from django.urls import path
from . import views

urlpatterns = [
    # --- Dashboard & Reports ---
    path('dashboard-data/', views.dashboard_data, name='dashboard_data'),

    # --- Locality Manager ---
    path('localities/', views.locality_list_api, name='locality_list_api'),
    path('dropdown-localities/', views.dropdown_localities, name='dropdown_localities'),
    path('next-pending/', views.next_pending, name='next_pending'),
    path('save-mapping/', views.save_mapping, name='save_mapping'),
    
    # --- Bulk Operations ---
    path('search-pending/', views.search_pending_addresses, name='search_pending_addresses'),
    path('bulk-save/', views.bulk_save_mapping, name='bulk_save_mapping'),

    # --- Add New Master Locality (Tab 3) ---
    path('add-master-locality/', views.add_master_locality, name='add_master_locality'),

    # --- NEW: VEHICLE MANAGEMENT (Add these lines!) ---
    path('vehicles/', views.get_vehicle_list, name='get_vehicle_list'),
    path('add-vehicle/', views.add_vehicle, name='add_vehicle'),
]