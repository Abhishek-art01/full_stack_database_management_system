from django.db import models
import datetime

# --- Dropdown Choices ---
YEAR_CHOICES = [(y, y) for y in range(2024, 2051)]
MONTH_CHOICES = [
    ('January', 'January'), ('February', 'February'), ('March', 'March'), 
    ('April', 'April'), ('May', 'May'), ('June', 'June'), 
    ('July', 'July'), ('August', 'August'), ('September', 'September'), 
    ('October', 'October'), ('November', 'November'), ('December', 'December')
]

class MISReport(models.Model):
    # --- Billing Details ---
    billing_year = models.IntegerField(
        choices=YEAR_CHOICES, 
        default=datetime.datetime.now().year, 
        verbose_name="Billing Year"
    )
    billing_month = models.CharField(
        max_length=20, 
        choices=MONTH_CHOICES, 
        default='January', 
        verbose_name="Billing Month"
    )
    
    # --- STAGE 1 (1st - 10th) ---
    stage1_start_date = models.DateField(null=True, blank=True, verbose_name="Start Date")
    stage1_end_date = models.DateField(null=True, blank=True, verbose_name="End Date")
    stage1_locality_set = models.BooleanField(default=False, verbose_name="Locality Set")
    stage1_gps_check = models.BooleanField(default=False, verbose_name="GPS Check")

    # --- STAGE 2 (11th - 20th) ---
    stage2_start_date = models.DateField(null=True, blank=True, verbose_name="Start Date")
    stage2_end_date = models.DateField(null=True, blank=True, verbose_name="End Date")
    stage2_locality_set = models.BooleanField(default=False, verbose_name="Locality Set")
    stage2_gps_check = models.BooleanField(default=False, verbose_name="GPS Check")

    # --- STAGE 3 (21st - End) ---
    stage3_start_date = models.DateField(null=True, blank=True, verbose_name="Start Date")
    stage3_end_date = models.DateField(null=True, blank=True, verbose_name="End Date")
    stage3_locality_set = models.BooleanField(default=False, verbose_name="Locality Set")
    stage3_gps_check = models.BooleanField(default=False, verbose_name="GPS Check")

    # --- FINAL STAGE ---
    final_mis_status = models.BooleanField(default=False, verbose_name="Final MIS Status")
    # NEW FIELD ADDED HERE
    bill_approval_status = models.BooleanField(default=False, verbose_name="Bill Approval Status")
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.billing_month} {self.billing_year}"

    class Meta:
        verbose_name = "MIS Workflow"
        verbose_name_plural = "MIS Workflows"


# ... existing imports and MISReport model ...

class T3Locality(models.Model):
    locality_name = models.CharField(max_length=255)
    billing_zone = models.CharField(max_length=100) # e.g., "South Delhi", "Zone A"

    def __str__(self):
        return self.locality_name

class T3BillingKM(models.Model):
    billing_zone = models.CharField(max_length=100)
    billing_km = models.FloatField()

    def __str__(self):
        return f"{self.billing_zone} - {self.billing_km}km"

class T3AddressLocality(models.Model):
    # The raw address data
    pickup_address = models.TextField()
    
    # The field we need to update (nullable initially)
    assigned_locality = models.ForeignKey(T3Locality, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Metadata
    status = models.CharField(max_length=20, default="Pending") # Pending, Completed
    
    def __str__(self):
        return self.pickup_address[:50]