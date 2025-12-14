from django.http import JsonResponse
from datetime import datetime, timedelta
import calendar
from .models import MISReport # Import your model
from django.db.models import Count
from .models import T3AddressLocality, T3Locality, T3BillingKM
import json

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



def locality_master_data(request):
    """Returns all valid localities and their zones for the dropdown"""
    # We send the zone along with the name so frontend can auto-fill immediately
    data = list(T3Locality.objects.values('id', 'locality_name', 'billing_zone'))
    return JsonResponse({'localities': data})

def get_pending_address(request):
    """Fetches the next address that needs a locality"""
    # 1. Get Count
    pending_count = T3AddressLocality.objects.filter(assigned_locality__isnull=True).count()
    
    # 2. Get One Record
    next_item = T3AddressLocality.objects.filter(assigned_locality__isnull=True).first()
    
    if next_item:
        return JsonResponse({
            'found': True,
            'pending_count': pending_count,
            'data': {
                'id': next_item.id,
                'address': next_item.pickup_address
            }
        })
    else:
        return JsonResponse({'found': False, 'pending_count': 0})

def get_billing_km(request):
    """Finds KM based on Zone"""
    zone = request.GET.get('zone')
    try:
        record = T3BillingKM.objects.get(billing_zone=zone)
        return JsonResponse({'km': record.billing_km})
    except T3BillingKM.DoesNotExist:
        return JsonResponse({'km': 0}) # Or handle error

def save_address_mapping(request):
    """Saves the selected locality to the address"""
    if request.method == "POST":
        data = json.loads(request.body)
        address_id = data.get('address_id')
        locality_id = data.get('locality_id')
        
        try:
            address_row = T3AddressLocality.objects.get(id=address_id)
            address_row.assigned_locality_id = locality_id
            address_row.status = "Completed"
            address_row.save()
            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
            
    return JsonResponse({'success': False, 'error': "Invalid Method"})