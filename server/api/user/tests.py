from django.test import TestCase
from django.urls import reverse, resolve
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework_simplejwt.views import TokenRefreshView

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

    def get_serializer(self, data):
        """ helper method to instantiate the serializer with given data """
        return CustomTokenObtainPairSerializer(data=data)

    def test_successful_authentication_with_username(self):
        """test successful authentication using username."""
        data = {'username': self.username, 'password': self.password}
        serializer = self.get_serializer(data)
        self.assertTrue(serializer.is_valid())
        self.assertIn('access', serializer.validated_data)
        self.assertIn('refresh', serializer.validated_data)
        self.assertEqual(serializer.user, self.user)

    def test_successful_authentication_with_email(self):
        """test successful authentication using email."""
        data = {'username': self.email, 'password': self.password}
        serializer = self.get_serializer(data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.user, self.user)

    def test_authentication_failure_with_invalid_username(self):
        """test authentication failure with invalid username."""
        data = {'username': 'nonexistent', 'password': self.password}
        serializer = self.get_serializer(data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)

    def test_authentication_failure_with_invalid_email(self):
        """test authentication failure with invalid email."""
        data = {'username': 'nonexistent@email.com', 'password': self.password}
        serializer = self.get_serializer(data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)

    def test_authentication_failure_with_incorrect_password(self):
        """test authentication failure with incorrect password."""
        data = {'username': self.username, 'password': 'wrongpassword'}
        serializer = self.get_serializer(data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)

    def test_token_generation_access_and_refresh_tokens(self):
        """test token generation for access and refresh tokens."""
        data = {'username': self.username, 'password': self.password}
        serializer = self.get_serializer(data)
        serializer.is_valid(raise_exception=True)
        self.assertIn('access', serializer.validated_data)
        self.assertIn('refresh', serializer.validated_data)
        self.assertTrue(isinstance(serializer.validated_data['access'], str))
        self.assertTrue(isinstance(serializer.validated_data['refresh'], str))

    def test_response_data_structure(self):
        """test response data structure contains only access and refresh tokens."""
        data = {'username': self.username, 'password': self.password}
        serializer = self.get_serializer(data)
        serializer.is_valid(raise_exception=True)

        response_data = serializer.validated_data
        self.assertEqual(set(response_data.keys()), {'access', 'refresh'})


class AuthEndpointTests(APITestCase):
    """
    test /api/users/login/ and /api/users/refresh/ endpoints resolution and functionality.
    """
    def setUp(self):
        # 1. create a test user
        self.username = "testuser"
        self.email = "test@example.com"
        self.password = "password123"
        self.user = CustomUser.objects.create_user(
            username=self.username,
            email=self.email,
            password=self.password
        )

        # 2. define URLs
        self.login_url = reverse('user:token_obtain_pair')
        self.refresh_url = reverse('user:token_refresh')

        # 3. prepare login request data
        self.valid_login_with_username = {'username': self.username, 'password': self.password}
        self.valid_login_with_email = {'username': self.email, 'password': self.password}
        self.invalid_login_data = {'username': 'wronguser', 'password': 'wrongpassword'}

    # --- URL resolution tests ---
    def test_login_endpoint_resolves_correctly(self):
        """
        test if /api/users/login/ URL resolves to CustomTokenObtainPairView.
        """
        match = resolve('/api/users/login/')
        self.assertEqual(match.func.__name__, CustomTokenObtainPairView.as_view().__name__)

    def test_refresh_endpoint_resolves_correctly(self):
        """
        test if /api/users/refresh/ URL resolves to TokenRefreshView.
        """
        match = resolve('/api/users/refresh/')
        self.assertEqual(match.func.__name__, TokenRefreshView.as_view().__name__)

    # --- Login function tests ---
    def test_login_success_with_username(self):
        """
        test successful login with username, returning access and refresh tokens.
        """
        response = self.client.post(self.login_url, self.valid_login_with_username, format='json')

        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        # make sure tokens are not empty
        self.assertTrue(len(response.data['access']) > 0)

    def test_login_success_with_email(self):
        """
        test successful login with email, returning access and refresh tokens.
        """
        response = self.client.post(self.login_url, self.valid_login_with_email, format='json')

        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_login_failure_invalid_credentials(self):
        """
        test login failure with invalid username or password.
        """
        response = self.client.post(self.login_url, self.invalid_login_data, format='json')
        self.assertEqual(response.status_code, 401)
        self.assertIn('detail', response.data)
        self.assertNotIn('access', response.data)

    # --- Refresh function tests ---
    def test_refresh_token_success(self):
        """
        test successful refresh of access token using a valid refresh token.
        """

        login_response = self.client.post(self.login_url, self.valid_login_with_username, format='json')
        refresh_token = login_response.data['refresh']

        refresh_data = {'refresh': refresh_token}
        refresh_response = self.client.post(self.refresh_url, refresh_data, format='json')

        self.assertEqual(refresh_response.status_code, 200)
        self.assertIn('access', refresh_response.data)
        self.assertTrue(len(refresh_response.data['access']) > 0)
        # make sure the new access token is different from the old one
        self.assertNotEqual(refresh_response.data['access'], login_response.data['access'])

    def test_refresh_token_failure_invalid_token(self):
        """
        test failure to refresh access token using an invalid refresh token.
        """
        # use access token instead of refresh token to simulate invalid token
        login_response = self.client.post(self.login_url, self.valid_login_with_username, format='json')
        invalid_refresh_token = login_response.data['access']

        refresh_response = self.client.post(
            self.refresh_url,
            {'refresh': invalid_refresh_token},
            format='json'
        )

        self.assertEqual(refresh_response.status_code, 401)
        self.assertIn('detail', refresh_response.data)
