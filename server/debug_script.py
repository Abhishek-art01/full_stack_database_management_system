import os
import django

# 1. Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

# 2. Import Models
from tracker.models import T3Locality, T3BillingZone, T3BillingKM

# 3. Helper to normalize text (same as your views.py)
def normalize(text):
    if not text: return ""
    return str(text).strip().lower().replace(" zone", "").replace(" billing", "").strip()

print("\n🚀 STARTING DIAGNOSIS...")

# --- STEP 1: Get a Real Address ---
# We look for ANY address that has a locality assigned
addr = T3Locality.objects.exclude(t3_locality__isnull=True).exclude(t3_locality='').first()

if not addr:
    print("❌ CRITICAL ERROR: No addresses found in 'T3Locality' table with a locality name.")
    exit()

raw_loc = addr.t3_locality
norm_loc = normalize(raw_loc)
print(f"📍 Checking Address: '{addr.address}'")
print(f"🏷️  Locality Name:   '{raw_loc}' (Normalized: '{norm_loc}')")

# --- STEP 2: Find Zone ---
print("\n🔍 Looking for Zone...")

# Try exact match first
zone_obj = T3BillingZone.objects.filter(t3_locality=raw_loc).first()

# If failed, try case-insensitive match
if not zone_obj:
    zone_obj = T3BillingZone.objects.filter(t3_locality__iexact=raw_loc).first()

if zone_obj:
    raw_zone = zone_obj.t3_billing_zone
    norm_zone = normalize(raw_zone)
    print(f"✅ SUCCESS: Found Zone '{raw_zone}' (Normalized: '{norm_zone}')")
else:
    print(f"❌ FAILED: Could not find '{raw_loc}' in T3BillingZone table.")
    print("   👉 Suggestion: Check if the spelling matches exactly in the Admin Panel.")
    print("   ℹ️  First 5 available localities in Zone Table:")
    for z in T3BillingZone.objects.all()[:5]:
        print(f"      - '{z.t3_locality}'")
    exit()

# --- STEP 3: Find KM ---
print("\n🔍 Looking for KM...")

# Try exact match
km_obj = T3BillingKM.objects.filter(t3_billing_zone=raw_zone).first()

# If failed, try case-insensitive
if not km_obj:
    km_obj = T3BillingKM.objects.filter(t3_billing_zone__iexact=raw_zone).first()

if km_obj:
    print(f"✅ SUCCESS: Found KM '{km_obj.t3_billing_km}'")
else:
    print(f"❌ FAILED: Found Zone '{raw_zone}', but it has NO entry in T3BillingKM table.")
    print("   👉 Suggestion: Does the KM table have 'South' or 'South Zone'?")
    print("   ℹ️  First 5 available Zones in KM Table:")
    for k in T3BillingKM.objects.all()[:5]:
        print(f"      - '{k.t3_billing_zone}'")

print("\n🏁 DIAGNOSIS COMPLETE")