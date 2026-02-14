from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import CustomTokenObtainPairView, check_auth, ping

app_name = "user"

urlpatterns = [
    path('ping/', ping, name='ping'),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('check-auth/', check_auth, name='check_auth'),
]
