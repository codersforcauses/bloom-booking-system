from rest_framework.routers import DefaultRouter
from .views import RoomViewSet, LocationViewSet, AmenitiesViewSet
from django.urls import include, path

app_name = 'room'

router = DefaultRouter()
router.register(r'rooms', RoomViewSet, basename='rooms')
router.register(r'locations', LocationViewSet, basename='locations')
router.register(r'amenities', AmenitiesViewSet, basename='amenities')

urlpatterns = [
    path('', include(router.urls)),
]
