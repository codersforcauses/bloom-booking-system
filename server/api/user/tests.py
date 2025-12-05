'''
To run this test file, use the command:
cd server && python manage.py test api.user
'''
from django.test import TestCase
from django.urls import reverse, resolve
from rest_framework.test import APITestCase
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework import exceptions
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from django.db import IntegrityError
from unittest.mock import patch
from datetime import timedelta
# import modules to be tested
from .models import CustomUser
from .serializers import CustomTokenObtainPairSerializer
from .views import CustomTokenObtainPairView


# --- 1. Models Tests ---
class CustomUserModelTests(TestCase):
    """Tests for the CustomUser model behavior."""

    def test_user_creation_with_username_and_email(self):
        user = CustomUser.objects.create_user(
            username='modeluser', email='model@example.com', password='pass123'
        )
        self.assertEqual(user.username, 'modeluser')
        self.assertEqual(user.email, 'model@example.com')

    def test_unique_email_constraint(self):
        CustomUser.objects.create_user(
            username='first', email='dup@example.com', password='pw'
        )
        # creating another user with same email should raise IntegrityError
        with self.assertRaises(IntegrityError):
            CustomUser.objects.create_user(
                username='second', email='dup@example.com', password='pw'
            )

    def test_auto_updates_on_save(self):
        """
        Use mock to test that the updated_at field automatically updates on save.
        """
        time1 = timezone.now()
        time2 = time1 + timedelta(hours=1)

        with patch('django.utils.timezone.now') as mock_now:
            # create user at time1
            mock_now.return_value = time1
            user = CustomUser.objects.create_user(
                username='updatetest', email='update@example.com', password='pw'
            )
            user.refresh_from_db()
            original_updated = user.updated_at
            self.assertEqual(original_updated, time1)

            # Update user at time2
            mock_now.return_value = time2
            user.first_name = "NewName"
            user.save()
            user.refresh_from_db()
            self.assertGreater(user.updated_at, original_updated)
            self.assertEqual(user.updated_at, time2)

    def test_str_method_returns_correct_format(self):
        user = CustomUser.objects.create_user(
            username='struser', email='str@example.com', password='pw'
        )
        self.assertEqual(str(user), f"User {user.username}")


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
        with self.assertRaises(exceptions.AuthenticationFailed):
            serializer.is_valid(raise_exception=True)

    def test_authentication_failure_with_invalid_email(self):
        """test authentication failure with invalid email."""
        data = {'username': 'nonexistent@email.com', 'password': self.password}
        serializer = CustomTokenObtainPairSerializer(data=data)
        with self.assertRaises(exceptions.AuthenticationFailed):
            serializer.is_valid(raise_exception=True)

    def test_authentication_failure_with_incorrect_password(self):
        """test authentication failure with incorrect password."""
        data = {'username': self.username, 'password': 'wrongpassword'}
        serializer = CustomTokenObtainPairSerializer(data=data)
        with self.assertRaises(exceptions.AuthenticationFailed):
            serializer.is_valid(raise_exception=True)

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


# --- 3. Views Tests ---
class CustomTokenObtainPairViewTests(APITestCase):
    """
    Tests for login and refresh token endpoints.
    """
    def setUp(self):
        self.username = "viewtestuser"
        self.email = "viewtest@example.com"
        self.password = "ViewSecurePass"
        self.user = CustomUser.objects.create_user(
            username=self.username,
            email=self.email,
            password=self.password
        )
        self.login_url = reverse('user:token_obtain_pair')
        self.refresh_url = reverse('user:token_refresh')
        self.valid_data = {'username': self.username, 'password': self.password}
        self.invalid_data = {'username': 'wronguser', 'password': 'wrongpassword'}

    def test_post_request_with_valid_username(self):
        """test POST request with valid username credentials
        and data structure of response."""
        response = self.client.post(self.login_url, self.valid_data, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_post_request_with_invalid_credentials(self):
        """test POST request with invalid credentials
        and data structure of error response."""
        response = self.client.post(self.login_url, self.invalid_data, format='json')
        self.assertEqual(response.status_code, 401)
        self.assertIn('detail', response.data)

    def test_token_expiration_settings(self):
        """
        test token expiration settings:
        Access Token: 15 minutes
        Refresh Token: 1 day
        """
        response = self.client.post(self.login_url, self.valid_data, format='json')

        access_token = RefreshToken(response.data['refresh']).access_token
        access_exp_timestamp = access_token['exp']
        expected_exp = timezone.now() + timedelta(minutes=15)
        time_difference = abs(expected_exp.timestamp() - access_exp_timestamp)
        # allow 5sec difference for processing time
        self.assertLess(time_difference, 5)

        refresh_token = RefreshToken(response.data['refresh'])
        refresh_exp_timestamp = refresh_token['exp']
        expected_refresh_exp = timezone.now() + timedelta(days=1)
        refresh_time_difference = abs(expected_refresh_exp.timestamp() - refresh_exp_timestamp)
        # allow 5sec difference for processing time
        self.assertLess(refresh_time_difference, 5)


# 4. --- URLs Tests ---
class URLsTests(TestCase):
    """
    test /login and /refresh URLs resolve to correct views.
    """
    def test_login_url(self):
        """test login URL resolves to CustomTokenObtainPairView."""
        login_url = reverse('user:token_obtain_pair')
        resolved_view = resolve(login_url)
        self.assertEqual(resolved_view.func.view_class, CustomTokenObtainPairView)

    def test_refresh_url(self):
        """test refresh URL resolves to TokenRefreshView."""
        refresh_url = reverse('user:token_refresh')
        resolved_view = resolve(refresh_url)
        self.assertEqual(resolved_view.func.view_class, TokenRefreshView)
