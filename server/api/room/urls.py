from rest_framework.routers import DefaultRouter
from .views import RoomViewSet, LocationViewSet, AmenitiesViewSet

router = DefaultRouter()
router.register(r'', RoomViewSet, basename='rooms')
router.register(r'locations', LocationViewSet, basename='locations')
router.register(r'amenities', AmenitiesViewSet, basename='amenities')

urlpatterns = router.urls
