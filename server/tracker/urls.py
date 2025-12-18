from django.urls import path
from . import views

urlpatterns = [
    path('dashboard-data/', views.dashboard_data, name='dashboard_data'),
    
    
    
    path('api/localities/', views.locality_list_api, name='locality_api'),
    # 1. View All / Dashboard Table (Paginated)
    path('api/localities/', views.locality_list_api, name='locality_list_api'),

    # 2. Dropdown Data (For the "Set Locality" and "Edit" tabs)
    path('api/dropdown-localities/', views.get_locality_dropdown, name='get_locality_dropdown'),

    # 3. Get One Pending Address (For "Set Locality" Auto-Fetch)
    path('api/next-pending/', views.get_next_pending, name='get_next_pending'),

    # 4. Save the Mapping (Assign Locality to Address)
    path('api/save-mapping/', views.save_mapping, name='save_mapping'),
]


