from django.urls import path
from . import views

from django.urls import path
from . import views

urlpatterns = [
    path('api/dashboard-data/', views.dashboard_data, name='dashboard_data'),
    path('api/localities/', views.locality_list_api, name='locality_list_api'),
    path('api/dropdown-localities/', views.dropdown_localities, name='dropdown_localities'),
    
    # These must match the function names in views.py exactly!
    path('api/next-pending/', views.next_pending, name='next_pending'),
    path('api/save-mapping/', views.save_mapping, name='save_mapping'),

    path('api/add-master-locality/', views.add_master_locality, name='add_master_locality'),
    
    # Bulk APIs
    path('api/search-pending/', views.search_pending_addresses, name='search_pending_addresses'),
    path('api/bulk-save/', views.bulk_save_mapping, name='bulk_save_mapping'),
]


