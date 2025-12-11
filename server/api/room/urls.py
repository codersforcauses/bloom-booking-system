from rest_framework.routers import DefaultRouter
from .views import RoomViewSet, LocationViewSet, AmenityViewSet
from django.urls import include, path

app_name = 'room'

router = DefaultRouter()
router.register(r'rooms', RoomViewSet, basename='rooms')
router.register(r'locations', LocationViewSet, basename='locations')
router.register(r'amenities', AmenityViewSet, basename='amenities')

urlpatterns = [
    path('', include(router.urls)),
]
