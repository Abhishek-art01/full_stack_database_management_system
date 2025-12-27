import logging
import json
import calendar
from datetime import datetime, timedelta
from django.http import JsonResponse
from django.core.paginator import Paginator
from django.db.models import Count, Q, Max
from django.views.decorators.csrf import csrf_exempt

# IMPORT YOUR MODELS
from .models import MISReport, T3Locality, T3BillingZone, T3BillingKM, VehicleList

logger = logging.getLogger(__name__)

# ==========================================
# HELPER: SMART MATCHING (Fixes "South" vs "South Zone")
# ==========================================
def normalize(text):
    """Removes spaces, lowercase, and strips 'zone' for fuzzy matching."""
    if not text: return ""
    # 1. Basic cleanup
    text = str(text).strip().lower()
    return text

def create_lookup_dict(queryset, key_field, val_field):
    """
    Creates a dictionary where the key is the 'normalized' version of the field.
    This allows us to find 'South Zone' even if we search for 'South'.
    """
    lookup = {}
    data = list(queryset.values(key_field, val_field))
    
    for item in data:
        raw_key = item[key_field]
        val = item[val_field]
        if raw_key:
            # Store normalized key -> value
            clean_key = normalize(raw_key)
            lookup[clean_key] = val
            
            # ALSO store exact key -> value (just in case)
            lookup[raw_key] = val
            
    return lookup

# ==========================================
# 1. DASHBOARD & REPORTING
# ==========================================
def get_report_for_month(year, month_name):
    try:
        report = MISReport.objects.get(billing_year=year, billing_month=month_name)
        total_steps = 8
        completed = sum([
            report.stage1_locality_set, report.stage1_gps_check,
            report.stage2_locality_set, report.stage2_gps_check,
            report.stage3_locality_set, report.stage3_gps_check,
            report.final_mis_status, report.bill_approval_status
        ])
        progress = int((completed / total_steps) * 100)

        return {
            "found": True,
            "progress": progress,
            "stage1": {
                "start": report.stage1_start_date, "end": report.stage1_end_date,
                "locality": report.stage1_locality_set, "gps": report.stage1_gps_check
            },
            "stage2": {
                "start": report.stage2_start_date, "end": report.stage2_end_date,
                "locality": report.stage2_locality_set, "gps": report.stage2_gps_check
            },
            "stage3": {
                "start": report.stage3_start_date, "end": report.stage3_end_date,
                "locality": report.stage3_locality_set, "gps": report.stage3_gps_check
            },
            "final": {
                "mis_status": report.final_mis_status,
                "bill_approval": report.bill_approval_status
            }
        }
    except MISReport.DoesNotExist:
        return {"found": False, "progress": 0}

def dashboard_data(request):
    req_year = request.GET.get('year')
    req_month = request.GET.get('month')

    if req_year and req_month:
        current_date = datetime(int(req_year), int(req_month), 1)
    else:
        current_date = datetime.now()

    curr_year = current_date.year
    curr_month_idx = current_date.month
    curr_month_name = calendar.month_name[curr_month_idx]
    
    first_day = current_date.replace(day=1)
    prev_date = first_day - timedelta(days=1)
    prev_year = prev_date.year
    prev_month_name = calendar.month_name[prev_date.month]

    current_report_data = get_report_for_month(curr_year, curr_month_name)
    prev_report_data = get_report_for_month(prev_year, prev_month_name)

    data = {
        "current": {
            "month": curr_month_name,
            "year": curr_year,
            "data": current_report_data
        },
        "previous": {
            "month": prev_month_name,
            "year": prev_year,
            "data": prev_report_data
        }
    }
    return JsonResponse(data)


# ==========================================
# 2. LOCALITY MANAGEMENT APIS
# ==========================================

# --- API 1: Main Table View ---
def locality_list_api(request):
    try:
        # 1. SMART LOAD: Locality -> Zone
        # Matches "Mahipalpur" to "South" even if spaces/case differ
        loc_to_zone = create_lookup_dict(
            T3BillingZone.objects, 't3_locality', 't3_billing_zone'
        )

        # 2. SMART LOAD: Zone -> KM
        # Matches "South" to "10" even if one says "South Zone"
        zone_to_km = create_lookup_dict(
            T3BillingKM.objects, 't3_billing_zone', 't3_billing_km'
        )

        # 3. Query Addresses
        page_number = request.GET.get('page', 1)
        search_query = request.GET.get('search', '').strip()

        queryset = T3Locality.objects.values('id', 'address', 't3_locality').order_by('-id')

        if search_query:
            queryset = queryset.filter(
                Q(address__icontains=search_query) | 
                Q(t3_locality__icontains=search_query)
            )

        paginator = Paginator(queryset, 50)
        page_obj = paginator.get_page(page_number)

        results = []
        for row in page_obj:
            raw_loc_name = row.get('t3_locality') or ""
            
            # --- SMART LOOKUP ---
            # 1. Normalize the locality name from the address
            clean_loc = normalize(raw_loc_name)
            
            # 2. Find Zone (Look up using normalized key)
            found_zone = loc_to_zone.get(clean_loc, "-")
            
            # 3. Find KM (Normalize the found zone first!)
            # This ensures "South" finds "South Zone" in the KM table
            clean_zone_key = normalize(found_zone)
            found_km = zone_to_km.get(clean_zone_key, "-")

            status = "Done" if (raw_loc_name and raw_loc_name.strip()) else "Pending"

            results.append({
                "id": row['id'],
                "address": row['address'],
                "locality": raw_loc_name,
                "locality_id": raw_loc_name,
                "billing_zone": found_zone,
                "billing_km": found_km,
                "status": status
            })

        global_pending = T3Locality.objects.filter(
            Q(t3_locality__isnull=True) | Q(t3_locality='')
        ).count()

        return JsonResponse({
            "results": results,
            "global_pending": global_pending,
            "pagination": {
                "total_pages": paginator.num_pages,
                "current_page": page_obj.number,
                "total_records": paginator.count
            }
        })

    except Exception as e:
        print(f"🔥 LIST API ERROR: {str(e)}")
        return JsonResponse({"results": [], "error": str(e)}, status=500)


# --- API 2: Dropdown Data (Used for Preview) ---
def dropdown_localities(request):
    try:
        # 1. SMART LOAD: Zone -> KM
        zone_to_km = create_lookup_dict(
            T3BillingKM.objects, 't3_billing_zone', 't3_billing_km'
        )

        # 2. Fetch all Zones
        zone_list = list(T3BillingZone.objects.values('id', 't3_locality', 't3_billing_zone'))
        
        data = []
        seen_names = set()

        for item in zone_list:
            raw_loc_name = item['t3_locality']
            raw_zone_name = item['t3_billing_zone']
            
            if not raw_loc_name or raw_loc_name in seen_names:
                continue
            
            seen_names.add(raw_loc_name)
            
            # 3. SMART LOOKUP for KM
            # Normalize zone name to find match (e.g. "South" matches "South Zone")
            clean_zone = normalize(raw_zone_name)
            found_km = zone_to_km.get(clean_zone, "-")

            data.append({
                "id": raw_loc_name,             
                "locality_name": raw_loc_name,
                "billing_zone": raw_zone_name, # Send raw name for display
                "billing_km": found_km
            })

        data.sort(key=lambda x: x['locality_name'])
        return JsonResponse(data, safe=False)

    except Exception as e:
        print(f"🔥 DROPDOWN ERROR: {e}")
        return JsonResponse({"error": str(e)}, status=500)


# --- API 3: Next Pending Address ---
def next_pending(request):
    try:
        pending_item = T3Locality.objects.filter(
            Q(t3_locality__isnull=True) | Q(t3_locality='')
        ).first()

        if pending_item:
            return JsonResponse({
                "found": True,
                "data": {
                    "id": pending_item.id,
                    "address": pending_item.address,
                    "locality": "" 
                }
            })
        else:
            return JsonResponse({"found": False})

    except Exception as e:
        print(f"🔥 NEXT-PENDING ERROR: {e}")
        return JsonResponse({"error": str(e)}, status=500)


# --- API 4: Save Mapping (Single) ---
@csrf_exempt
def save_mapping(request):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Method not allowed'})
    
    try:
        data = json.loads(request.body)
        address_id = data.get('address_id')
        new_locality_name = data.get('locality_id') 

        if not address_id or not new_locality_name:
            return JsonResponse({'success': False, 'error': 'Missing ID or Locality'})

        obj = T3Locality.objects.get(id=address_id)
        obj.t3_locality = new_locality_name 
        obj.save()

        return JsonResponse({'success': True})

    except T3Locality.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Address not found'})
    except Exception as e:
        print(f"🔥 SAVE ERROR: {e}")
        return JsonResponse({'success': False, 'error': str(e)})


# --- API 5: Search Pending (Bulk Tab) ---
def search_pending_addresses(request):
    query = request.GET.get('q', '').strip()
    page_number = request.GET.get('page', 1)
    
    queryset = T3Locality.objects.filter(
        Q(t3_locality__isnull=True) | Q(t3_locality='')
    ).order_by('id')
    
    if query:
        queryset = queryset.filter(address__icontains=query)

    paginator = Paginator(queryset, 50)
    page_obj = paginator.get_page(page_number)
    
    results = list(page_obj.object_list.values('id', 'address'))
    
    return JsonResponse({
        'results': results,
        'pagination': {
            'current_page': page_obj.number,
            'total_pages': paginator.num_pages,
            'total_records': paginator.count
        }
    })


# --- API 6: Bulk Save ---
@csrf_exempt
def bulk_save_mapping(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            address_ids = data.get('address_ids', [])
            loc_id_from_dropdown = data.get('locality_id')
            
            T3Locality.objects.filter(id__in=address_ids).update(t3_locality=loc_id_from_dropdown)
            
            return JsonResponse({'success': True, 'count': len(address_ids)})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
            
    return JsonResponse({'success': False, 'error': 'Invalid method'})

# --- ADD THIS TO THE BOTTOM OF server/tracker/views.py ---

# --- API 7: Add New Master Locality (Tab 3) ---
@csrf_exempt
def add_master_locality(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            new_locality = data.get('locality_name', '').strip()
            existing_zone = data.get('zone_name', '').strip()

            if not new_locality or not existing_zone:
                return JsonResponse({'success': False, 'error': 'Missing Locality Name or Zone'})

            # 1. Check if it already exists (Case-insensitive check)
            if T3BillingZone.objects.filter(t3_locality__iexact=new_locality).exists():
                return JsonResponse({'success': False, 'error': f"Locality '{new_locality}' already exists!"})

            # 2. Get the next available ID manually (since DB auto-increment seems broken/missing)
            # ... imports ...
            from django.db.models import Max

            # 2. Get the next available ID manually
            max_id = T3BillingZone.objects.aggregate(Max('id'))['id__max']
            next_id = (max_id or 0) + 1

            # 3. Create the new Master Record with explicit ID
            T3BillingZone.objects.create(
                id=next_id,
                t3_locality=new_locality,
                t3_billing_zone=existing_zone
            )
            
            return JsonResponse({'success': True, 'message': f"Successfully added '{new_locality}' to '{existing_zone}'"})

        except Exception as e:
            print(f"🔥 ADD MASTER ERROR: {e}")
            return JsonResponse({'success': False, 'error': str(e)})

    return JsonResponse({'success': False, 'error': 'Invalid method'})


# ==========================================
# 4. VEHICLE MANAGEMENT APIS
# ==========================================

# --- API 8: Get All Vehicles ---
def get_vehicle_list(request):
    """
    Fetches all vehicles to display in the VehicleList.jsx table.
    """
    try:
        # Get all vehicles, newest first
        vehicles = VehicleList.objects.all().order_by('-id')
        
        data = []
        for v in vehicles:
            data.append({
                "id": v.id,
                "vehicle_no": v.vehicle_no,
                "contact_no": v.contact_no,
                "ownership": v.vehicle_ownership,
                "cab_type": v.cab_type,
                # .url gives the public link to the file on Supabase
                "rc_document": v.rc_document.url if v.rc_document else None
            })
            
        return JsonResponse({"results": data})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


# --- API 9: Add New Vehicle (With File Upload) ---
@csrf_exempt
def add_vehicle(request):
    """
    Handles the form submission from React to add a new car.
    Supports PDF/Image uploads for RC.
    """
    if request.method == "POST":
        try:
            # 1. Extract Text Data
            vehicle_no = request.POST.get('vehicle_no')
            contact_no = request.POST.get('contact_no')
            cab_type = request.POST.get('cab_type')
            ownership = request.POST.get('vehicle_ownership')
            
            # 2. Extract the File (PDF/Image)
            # request.FILES holds the uploaded file object
            rc_file = request.FILES.get('rc_document') 

            if not vehicle_no:
                return JsonResponse({"success": False, "error": "Vehicle Number is required"})

            # 3. Create Record in Database
            # Django + boto3 will automatically stream the file to Supabase here
            VehicleList.objects.create(
                vehicle_no=vehicle_no,
                contact_no=contact_no,
                cab_type=cab_type,
                vehicle_ownership=ownership,
                rc_document=rc_file 
            )

            return JsonResponse({"success": True, "message": "Vehicle Added Successfully!"})

        except Exception as e:
            print(f"🔥 ADD VEHICLE ERROR: {e}")
            return JsonResponse({"success": False, "error": str(e)})

    return JsonResponse({"success": False, "error": "Invalid method"})