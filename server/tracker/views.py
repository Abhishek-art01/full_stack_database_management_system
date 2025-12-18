from django.http import JsonResponse
from datetime import datetime, timedelta
import calendar
from .models import MISReport # Import your model
from django.db.models import Count
from django.core.paginator import Paginator
from django.db.models import Q
from .models import T3AddressLocality, T3LocalityMaster, T3BillingKM
import json
from django.views.decorators.csrf import csrf_exempt  

def get_report_for_month(year, month_name):
    """
    Tries to find the MISReport in the DB. 
    If not found, returns empty/default values.
    """
    try:
        report = MISReport.objects.get(billing_year=year, billing_month=month_name)
        
        # Calculate Progress Percent based on your admin logic
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
    # 1. Get requested date or default to now
    req_year = request.GET.get('year')
    req_month = request.GET.get('month') # e.g., "12"

    if req_year and req_month:
        current_date = datetime(int(req_year), int(req_month), 1)
    else:
        current_date = datetime.now()

    # 2. Setup Current & Previous Month Text
    curr_year = current_date.year
    curr_month_idx = current_date.month
    curr_month_name = calendar.month_name[curr_month_idx]
    
    # Previous Month Math
    first_day = current_date.replace(day=1)
    prev_date = first_day - timedelta(days=1)
    prev_year = prev_date.year
    prev_month_name = calendar.month_name[prev_date.month]

    # 3. Query DB for BOTH months
    current_report_data = get_report_for_month(curr_year, curr_month_name)
    prev_report_data = get_report_for_month(prev_year, prev_month_name)

    # 4. Send JSON
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





# --- Helper: Build the "Master Map" ---
# fetching all zones/localities once is faster than querying for every row
def get_master_mappings():
    # 1. Map Zone -> KM
    zone_map = {z['t3_billing_zone']: z['t3_billing_km'] for z in T3BillingKM.objects.values('t3_billing_zone', 't3_billing_km')}
    
    # 2. Map LocalityID -> {Name, Zone, KM}
    loc_map = {}
    localities = T3Locality.objects.values('id', 't3_locality', 't3_billing_zone')
    
    for l in localities:
        z_name = l['t3_billing_zone']
        km = zone_map.get(z_name, None) # Get KM from the zone map
        loc_map[l['id']] = {
            'name': l['t3_locality'],
            'zone': z_name,
            'km': km
        }
    return loc_map


# --- Helper: Build the "Master Map" ---
def get_master_mappings():
    # 1. Map Zone -> KM
    zone_map = {z['billing_zone']: z['billing_km'] for z in T3BillingKM.objects.values('billing_zone', 'billing_km')}
    
    # 2. Map LocalityName -> {Zone, KM}
    loc_map = {}
    try:
        # Fetching from the Master Table
        master_rows = T3LocalityMaster.objects.values('locality_name', 'billing_zone')
        for l in master_rows:
            name = l['locality_name']
            z_name = l['billing_zone']
            km = zone_map.get(z_name, None)
            loc_map[name] = {'zone': z_name, 'km': km}
    except Exception as e:
        print(f"Warning: Could not fetch master mappings: {e}")
        
    return loc_map

# --- Task 1: View All with Joins ---
def locality_list_api(request):
    page_number = request.GET.get('page', 1)
    search_query = request.GET.get('search', '').lower()
    
    # 1. Get Address Data
    queryset = T3AddressLocality.objects.all().order_by('id')
    
    if search_query:
        queryset = queryset.filter(address__icontains=search_query)

    paginator = Paginator(queryset, 50)
    page_obj = paginator.get_page(page_number)
    
    # 2. Manual Join
    loc_map = get_master_mappings()
    
    final_results = []
    
    for row in page_obj:
        # "row.locality_name" comes from the Address table column 't3_locality'
        current_loc = row.locality_name 
        details = loc_map.get(current_loc)
        
        status = "Completed"
        if not current_loc or not details or details['km'] is None:
            status = "Pending"
            
        final_results.append({
            'id': row.id,
            'address': row.address,
            'locality': current_loc,
            'billing_zone': details['zone'] if details else None,
            'billing_km': details['km'] if details else None,
            'status': status
        })

    # Global Pending Count (Approximation: Missing locality OR Missing mapping)
    # Counting rows with empty locality column
    global_pending = T3AddressLocality.objects.filter(locality_name__isnull=True).count()

    return JsonResponse({
        'results': final_results,
        'global_pending': global_pending,
        'pagination': {
            'total_pages': paginator.num_pages,
            'current_page': page_obj.number,
            'total_records': paginator.count
        }
    })

# --- Task 2: Dropdown Data ---
# server/tracker/views.py

def get_locality_dropdown(request):
    try:
        # 1. Fetch all Zone Rates (Zone -> KM)
        # Result: {'East Delhi': 15.5, 'Paschim Vihar': 10.0, ...}
        rates = list(T3BillingKM.objects.values('billing_zone', 'billing_km'))
        rate_map = {r['billing_zone']: r['billing_km'] for r in rates}

        # 2. Fetch all Localities
        localities = list(T3LocalityMaster.objects.values('id', 'locality_name', 'billing_zone'))

        # 3. Attach the KM to each Locality
        for loc in localities:
            zone_name = loc['billing_zone']
            # Look up the KM in our map. Default to 'N/A' if not found.
            loc['billing_km'] = rate_map.get(zone_name, 'N/A')

        return JsonResponse(localities, safe=False)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

# --- Task 3: Auto-Fetch Pending ---
def get_next_pending(request):
    # Find address where 't3_locality' column is NULL
    item = T3AddressLocality.objects.filter(locality_name__isnull=True).first()
    if item:
        return JsonResponse({'found': True, 'data': {'id': item.id, 'address': item.address}})
    return JsonResponse({'found': False})

# --- Task 4: Save Mapping --
# 
@csrf_exempt
def save_mapping(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            print(f"DEBUG: Received Data -> {data}")  # <--- PRINT 1

            addr_id = data.get('address_id')
            loc_id_from_dropdown = data.get('locality_id')
            
            # 1. Fetch the Name
            master_loc = T3LocalityMaster.objects.get(id=loc_id_from_dropdown)
            real_locality_name = master_loc.locality_name
            print(f"DEBUG: Found Locality Name -> {real_locality_name}") # <--- PRINT 2
            
            # 2. Update the Address Row
            row = T3AddressLocality.objects.get(id=addr_id)
            row.locality_name = real_locality_name
            row.save()
            print(f"DEBUG: Saved Address ID {addr_id} successfully.") # <--- PRINT 3
            
            return JsonResponse({'success': True})
        except Exception as e:
            print(f"DEBUG: ERROR -> {str(e)}") # <--- PRINT ERROR
            return JsonResponse({'success': False, 'error': str(e)})
            
    return JsonResponse({'success': False, 'error': 'Invalid method'})