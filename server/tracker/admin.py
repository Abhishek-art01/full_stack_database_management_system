from django.contrib import admin
from rangefilter.filters import DateRangeFilterBuilder
from .models import MISReport

@admin.register(MISReport)
class MISReportAdmin(admin.ModelAdmin):
    # List View Columns
    list_display = ('billing_month', 'billing_year', 'visual_progress', 'status_badge', 'created_at')
    
    # Filters
    list_filter = (
        ("created_at", DateRangeFilterBuilder()), 
        'billing_year',
    )
    
    search_fields = ('billing_month', 'billing_year')

    # --- THE FORM LAYOUT ---
    fieldsets = (
        ('Billing Details', {
            'fields': (('billing_year', 'billing_month'),),
            'description': 'Select the Billing Year and Month'
        }),
        ('Stage 1: ', {
            'fields': (
                ('stage1_start_date', 'stage1_end_date'), 
                ('stage1_locality_set', 'stage1_gps_check')
            ),
            'classes': ('collapse',), 
        }),
        ('Stage 2: ', {
            'fields': (
                ('stage2_start_date', 'stage2_end_date'),
                ('stage2_locality_set', 'stage2_gps_check')
            ),
            'classes': ('collapse',),
        }),
        ('Stage 3: ', {
            'fields': (
                ('stage3_start_date', 'stage3_end_date'),
                ('stage3_locality_set', 'stage3_gps_check')
            ),
            'classes': ('collapse',),
        }),
        ('Final Stage', {
            # Use the variable name 'bill_approval_status' here
            'fields': ('final_mis_status', 'bill_approval_status'),
            'classes': ('wide',),
        }),
    )

    # --- Progress Bar Logic ---
    def visual_progress(self, obj):
        # Increased total steps to 8 to include the new Bill Approval field
        total_steps = 8 
        completed = sum([
            obj.stage1_locality_set, obj.stage1_gps_check,
            obj.stage2_locality_set, obj.stage2_gps_check,
            obj.stage3_locality_set, obj.stage3_gps_check,
            obj.final_mis_status,
            obj.bill_approval_status # Added new step to calculation
        ])
        percent = int((completed / total_steps) * 100)
        
        color = "red"
        if percent > 30: color = "orange"
        if percent > 70: color = "#2ecc71"
        
        from django.utils.html import format_html
        return format_html(
            '<div style="width:100px; background:#eee; border-radius:3px;">'
            '<div style="width:{}%; background:{}; height:10px; border-radius:3px;"></div>'
            '</div>',
            percent, color
        )
    visual_progress.short_description = "Progress Bar"

    def status_badge(self, obj):
        # Only mark complete if BOTH final checks are done
        if obj.final_mis_status and obj.bill_approval_status:
            return "✅ Completed"
        return "⏳ In Progress"
    status_badge.short_description = "Status"