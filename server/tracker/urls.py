from django.urls import path
from . import views

urlpatterns = [
    path('dashboard-data/', views.dashboard_data, name='dashboard_data'),
    path('locality-master-data/', views.locality_master_data, name='locality_master_data'),
    path('get-pending-address/', views.get_pending_address, name='get_pending_address'),
    path('get-billing-km/', views.get_billing_km, name='get_billing_km'),
    path('save-address-mapping/', views.save_address_mapping, name='save_address_mapping'),
]