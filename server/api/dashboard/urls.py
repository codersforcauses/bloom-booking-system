from django.urls import path
from . import views

urlpatterns = [
    path('', views.get_dashboard_stats, name='dashboard-stats'),
]
