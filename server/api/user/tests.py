from django.test import TestCase
from django.urls import reverse, resolve
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework import exceptions
# import modules to be tested
from .models import CustomUser
from .serializers import CustomTokenObtainPairSerializer
from .views import CustomTokenObtainPairView

UserModel = get_user_model()


# --- 2. Serializers Tests ---
class CustomTokenObtainPairSerializerTests(TestCase):
    """
    test successful authentication with username or email, failure cases, and token generation.
    """
    def setUp(self):
        self.username = "serializertest"
        self.email = "serializer@test.com"
        self.password = "validpassword"
        self.user = CustomUser.objects.create_user(
            username=self.username,
            email=self.email,
            password=self.password
        )

    def test_successful_authentication_with_username(self):
        """test successful authentication using username."""
        data = {'username': self.username, 'password': self.password}
        serializer = CustomTokenObtainPairSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertIn('access', serializer.validated_data)
        self.assertIn('refresh', serializer.validated_data)
        self.assertEqual(serializer.user, self.user)

    def test_successful_authentication_with_email(self):
        """test successful authentication using email."""
        data = {'username': self.email, 'password': self.password}
        serializer = CustomTokenObtainPairSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.user, self.user)

    def test_authentication_failure_with_invalid_username(self):
        """test authentication failure with invalid username."""
        data = {'username': 'nonexistent', 'password': self.password}
        serializer = CustomTokenObtainPairSerializer(data=data)
        self.assertFalse(serializer.is_valid(raise_exception=False))
        self.assertEqual(serializer.errors['detail'][0], 'Invalid credentials')

    def test_authentication_failure_with_invalid_email(self):
        """test authentication failure with invalid email."""
        data = {'username': 'nonexistent@email.com', 'password': self.password}
        serializer = CustomTokenObtainPairSerializer(data=data)
        self.assertFalse(serializer.is_valid(raise_exception=False))
        self.assertEqual(serializer.errors['detail'][0], 'Invalid credentials')

    def test_authentication_failure_with_incorrect_password(self):
        """test authentication failure with incorrect password."""
        data = {'username': self.username, 'password': 'wrongpassword'}
        serializer = CustomTokenObtainPairSerializer(data=data)
        self.assertFalse(serializer.is_valid(raise_exception=False))
        self.assertEqual(serializer.errors['detail'][0], 'Invalid credentials')

    def test_token_generation_access_and_refresh_tokens(self):
        """test token generation for access and refresh tokens."""
        data = {'username': self.username, 'password': self.password}
        serializer = CustomTokenObtainPairSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.assertIn('access', serializer.validated_data)
        self.assertIn('refresh', serializer.validated_data)
        self.assertTrue(isinstance(serializer.validated_data['access'], str))
        self.assertTrue(isinstance(serializer.validated_data['refresh'], str))

    def test_response_data_structure(self):
        """test response data structure contains only access and refresh tokens."""
        data = {'username': self.username, 'password': self.password}
        serializer = CustomTokenObtainPairSerializer(data=data)
        serializer.is_valid(raise_exception=True)

        response_data = serializer.validated_data
        self.assertEqual(set(response_data.keys()), {'access', 'refresh'})

    def tearDown(self):
        self.user.delete()
