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
    bill_approval_status = models.BooleanField(default=False, verbose_name="Bill Approval Status")
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.billing_month} {self.billing_year}"

    class Meta:
        verbose_name = "MIS Workflow"
        verbose_name_plural = "MIS Workflows"


class T3BillingKM(models.Model):
    id = models.AutoField(primary_key=True)
    t3_billing_zone = models.CharField(max_length=255, unique=True, db_column='t3_billing_zone') 
    t3_billing_km = models.FloatField(db_column='t3_billing_km')

    class Meta:
        db_table = 't3_billing_km'
        managed = False

class T3BillingZone(models.Model):
    id = models.AutoField(primary_key=True)
    t3_locality = models.CharField(max_length=255, unique=True, db_column='t3_locality') 
    t3_billing_zone = models.CharField(max_length=255, db_column='t3_billing_zone') 

    class Meta:
        db_table = 't3_billing_zone' 
        managed = False

class T3Locality(models.Model):
    id = models.AutoField(primary_key=True)
    address = models.TextField(db_column='address') 
    t3_locality = models.CharField(max_length=255, null=True, blank=True, db_column='t3_locality') 

    class Meta:
        db_table = 't3_locality' 
        managed = False


from django.db import models

class VehicleList(models.Model):
    # Standard Fields
    last_digit = models.CharField(max_length=10, null=True, blank=True)
    vehicle_no = models.CharField(max_length=15, unique=True) 
    cab_type = models.CharField(max_length=10, null=True, blank=True)
    vehicle_ownership = models.CharField(max_length=20, null=True, blank=True)
    contact_no = models.CharField(max_length=10, null=True, blank=True)
    
    # --- UPDATED FOR PDF STORAGE ---
    # changed from ImageField to FileField to accept PDFs
    rc_document = models.FileField(upload_to='vehicle_rc/', null=True, blank=True)

    def __str__(self):
        return self.vehicle_no

    class Meta:
        verbose_name = "Vehicle List"
        verbose_name_plural = "Vehicle List"