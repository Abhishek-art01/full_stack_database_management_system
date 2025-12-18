from django.contrib import admin
from rangefilter.filters import DateRangeFilterBuilder
from .models import MISReport, T3Locality, T3BillingZone, T3BillingKM

# --- 1. MIS REPORT ADMIN (Your existing code) ---
@admin.register(MISReport)
class MISReportAdmin(admin.ModelAdmin):
    list_display = ('billing_month', 'billing_year', 'visual_progress', 'status_badge', 'created_at')
    list_filter = (("created_at", DateRangeFilterBuilder()), 'billing_year',)
    search_fields = ('billing_month', 'billing_year')
    
    fieldsets = (
        ('Billing Details', {'fields': (('billing_year', 'billing_month'),), 'description': 'Select the Billing Year and Month'}),
        ('Stage 1: ', {'fields': (('stage1_start_date', 'stage1_end_date'), ('stage1_locality_set', 'stage1_gps_check')), 'classes': ('collapse',), }),
        ('Stage 2: ', {'fields': (('stage2_start_date', 'stage2_end_date'), ('stage2_locality_set', 'stage2_gps_check')), 'classes': ('collapse',), }),
        ('Stage 3: ', {'fields': (('stage3_start_date', 'stage3_end_date'), ('stage3_locality_set', 'stage3_gps_check')), 'classes': ('collapse',), }),
        ('Final Stage', {'fields': ('final_mis_status', 'bill_approval_status'), 'classes': ('wide',), }),
    )

    def visual_progress(self, obj):
        total_steps = 8 
        completed = sum([
            obj.stage1_locality_set, obj.stage1_gps_check,
            obj.stage2_locality_set, obj.stage2_gps_check,
            obj.stage3_locality_set, obj.stage3_gps_check,
            obj.final_mis_status, obj.bill_approval_status
        ])
        percent = int((completed / total_steps) * 100)
        color = "red"
        if percent > 30: color = "orange"
        if percent > 70: color = "#2ecc71"
        from django.utils.html import format_html
        return format_html(
            '<div style="width:100px; background:#eee; border-radius:3px;">'
            '<div style="width:{}%; background:{}; height:10px; border-radius:3px;"></div>'
            '</div>', percent, color
        )
    visual_progress.short_description = "Progress Bar"

    def status_badge(self, obj):
        if obj.final_mis_status and obj.bill_approval_status: return "✅ Completed"
        return "⏳ In Progress"
    status_badge.short_description = "Status"


# --- 2. NEW ADMINS FOR LOCALITY DATA (So you can check the data) ---

@admin.register(T3BillingZone)
class T3BillingZoneAdmin(admin.ModelAdmin):
    list_display = ('id', 't3_locality', 't3_billing_zone')
    search_fields = ('t3_locality', 't3_billing_zone')

@admin.register(T3BillingKM)
class T3BillingKMAdmin(admin.ModelAdmin):
    list_display = ('id', 't3_billing_zone', 't3_billing_km')
    search_fields = ('t3_billing_zone',)

@admin.register(T3Locality)
class T3LocalityAdmin(admin.ModelAdmin):
    list_display = ('id', 'address', 't3_locality')
    search_fields = ('address', 't3_locality')
    list_filter = ('t3_locality',)