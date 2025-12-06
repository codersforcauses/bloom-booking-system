from rest_framework.decorators import api_view

from django.http import HttpResponse
from .serializers import CustomTokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView


# Create your views here.
@api_view(["GET"])
def ping(request):
    return HttpResponse("Pong!", status=200)


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom view to obtain JWT token pair using a custom serializer.
    """
    serializer_class = CustomTokenObtainPairSerializer
