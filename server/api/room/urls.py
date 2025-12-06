<<<<<<< Updated upstream
from rest_framework.routers import DefaultRouter
from .views import RoomViewSet

router = DefaultRouter()
router.register(r'', RoomViewSet, basename='rooms')

urlpatterns = router.urls
=======
from django.urls import path
from . import views

app_name = "room"
urlpatterns = [
]
>>>>>>> Stashed changes
