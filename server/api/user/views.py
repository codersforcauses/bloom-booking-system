from django.contrib.auth import get_user_model
from django.http import HttpResponse

from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import CustomTokenObtainPairSerializer


# health check endpoint
@api_view(["GET"])
def ping(request):
    return HttpResponse("Pong!", status=200)


# JWT login endpoint (custom serializer)
class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom view to obtain JWT token pair using a custom serializer.
    """
    serializer_class = CustomTokenObtainPairSerializer


# check-auth response
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = get_user_model()
        fields = ["id", "username", "email"]


# Auth check endpoint
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def check_auth(request):
    serializer = UserSerializer(request.user)
    return Response(
        {
            "valid": True,
            "user": serializer.data,
        },
        status=status.HTTP_200_OK,
    )
