from datetime import timedelta
from .models import Booking
from api.room.models import Room, Location, Amenity
from rest_framework import status
from rest_framework.test import APITestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from unittest.mock import patch
from types import SimpleNamespace
from api.booking.views import BookingViewSet

User = get_user_model()
future_date = timezone.now() + timedelta(days=7)


class BookingViewTest(APITestCase):

    def setUp(self):
        """Set up test data for all test cases."""
        # Location
        self.location = Location.objects.create(name="Building A")

        # Amenity
        self.amenity = Amenity.objects.create(name="Projector")

        # Room
        self.room = Room.objects.create(
            name="Meeting Room A",
            location=self.location,
            capacity=10,
            start_datetime=future_date.replace(
                hour=9, minute=0, second=0, microsecond=0),
            end_datetime=future_date.replace(
                hour=18, minute=0, second=0, microsecond=0),
            recurrence_rule="FREQ=DAILY;BYDAY=MO,TU,WE",
            is_active=True
        )
        self.room.amenities.set([self.amenity])

        # Admin user for authentication tests
        self.admin_user = User.objects.create_superuser(
            "admin", "admin@test.com", "admin123")

        # Test booking
        self.booking = Booking.objects.create(
            room=self.room,
            visitor_name='John Doe',
            visitor_email='john@example.com',
            start_datetime=future_date.replace(
                hour=10, minute=0, second=0, microsecond=0),
            end_datetime=future_date.replace(
                hour=12, minute=0, second=0, microsecond=0),
            recurrence_rule="",
            status='CONFIRMED',
            google_event_id='test-google-event-id'
        )

    # ==================== CREATE TESTS (POST /api/bookings/) ====================

    @patch('api.booking.views.create_event')
    def test_booking_creation_with_google_calendar(self, mock_create_event):
        """Test successful booking creation with Google Calendar integration."""
        # Mock Google Calendar API response
        mock_create_event.return_value = {"id": "mocked-google-event-id"}

        payload = {
            "room_id": self.room.id,
            "visitor_name": "Alice Johnson",
            "visitor_email": "alice@example.com",
            "start_datetime": future_date.replace(hour=10, minute=0, second=0, microsecond=0) + timedelta(days=1),
            "end_datetime": future_date.replace(hour=12, minute=0, second=0, microsecond=0) + timedelta(days=1),
            "recurrence_rule": ""
        }

        url = '/api/bookings/'
        response = self.client.post(url, payload, format='json')

        # Verify response
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertEqual(data["visitor_name"], payload["visitor_name"])
        self.assertEqual(data["visitor_email"], payload["visitor_email"])
        self.assertEqual(data["google_event_id"], "mocked-google-event-id")
        self.assertEqual(data["status"], "CONFIRMED")  # Default status

        # Verify Google Calendar API was called
        mock_create_event.assert_called_once()

        # Verify booking was created in database
        booking = Booking.objects.get(id=data["id"])
        self.assertEqual(booking.google_event_id, "mocked-google-event-id")

    @patch('api.booking.views.create_event')
    def test_booking_creation_handles_google_calendar_failure(self, mock_create_event):
        """Test booking creation when Google Calendar API fails."""
        # Mock Google Calendar API to raise an exception
        mock_create_event.side_effect = Exception("Google Calendar API error")

        payload = {
            "room_id": self.room.id,
            "visitor_name": "Bob Smith",
            "visitor_email": "bob@example.com",
            "start_datetime": future_date.replace(hour=10, minute=0, second=0, microsecond=0) + timedelta(days=2),
            "end_datetime": future_date.replace(hour=12, minute=0, second=0, microsecond=0) + timedelta(days=2),
            "recurrence_rule": ""
        }

        url = '/api/bookings/'
        response = self.client.post(url, payload, format='json')

        # Should return error when Google Calendar fails
        self.assertEqual(response.status_code,
                         status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn("Google Calendar", response.json()["detail"])

    def test_booking_creation_fails_with_invalid_datetime(self):
        """Test booking creation fails when end_datetime is before start_datetime."""
        payload = {
            "room_id": self.room.id,
            "visitor_name": "Invalid User",
            "visitor_email": "invalid@example.com",
            "start_datetime": future_date.replace(hour=12, minute=0, second=0, microsecond=0) + timedelta(days=1),
            # Before start time
            "end_datetime": future_date.replace(hour=10, minute=0, second=0, microsecond=0) + timedelta(days=1),
            "recurrence_rule": ""
        }

        url = '/api/bookings/'
        response = self.client.post(url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("end_datetime", response.json())

    # ==================== LIST TESTS (GET /api/bookings/) ====================

    def test_booking_listing_fails_without_authentication(self):
        """Test that listing bookings requires authentication when no visitor_email provided."""
        url = '/api/bookings/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_booking_listing_with_authentication(self):
        """Test authenticated admin can list all bookings."""
        self.client.force_authenticate(user=self.admin_user)
        url = '/api/bookings/'
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data["results"]), 1)
        self.assertEqual(data["results"][0]["id"], self.booking.id)

    def test_booking_listing_with_visitor_email_query_param(self):
        """Test listing bookings with visitor_email query parameter (no auth required)."""
        url = f'/api/bookings/?visitor_email={self.booking.visitor_email}'
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data["results"]), 1)
        self.assertEqual(data["results"][0]["visitor_email"],
                         self.booking.visitor_email)

    def test_booking_filtering_with_room_name(self):
        """Test filtering bookings by room name."""
        self.client.force_authenticate(user=self.admin_user)

        # Test with matching room name
        url = f'/api/bookings/?room={self.room.name}'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()["results"]), 1)

        # Test with non-matching room name
        url = '/api/bookings/?room=non_matching_name'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()["results"]), 0)

    def test_booking_filtering_with_date(self):
        """Test filtering bookings by date."""
        pass

    # ==================== RETRIEVE TESTS (GET /api/bookings/{id}/) ====================

    def test_booking_retrieval_with_authentication(self):
        """Test authenticated admin can retrieve any booking."""
        self.client.force_authenticate(user=self.admin_user)
        url = f'/api/bookings/{self.booking.id}/'
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["id"], self.booking.id)
        self.assertEqual(data["visitor_name"], self.booking.visitor_name)

    def test_booking_retrieval_with_visitor_email_query_param(self):
        """Test retrieving booking with visitor_email query parameter."""
        url = f'/api/bookings/{self.booking.id}/?visitor_email={self.booking.visitor_email}'
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["id"], self.booking.id)

    def test_booking_retrieval_fails_with_wrong_visitor_email(self):
        """Test retrieving booking fails with wrong visitor_email."""
        url = f'/api/bookings/{self.booking.id}/?visitor_email=wrong@example.com'
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_booking_retrieval_fails_without_authentication_or_email(self):
        """Test retrieving booking fails without authentication or visitor_email."""
        url = f'/api/bookings/{self.booking.id}/'
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ==================== UPDATE TESTS (PATCH /api/bookings/{id}/) ====================

    @patch('api.booking.views.update_event')
    def test_booking_update_with_google_calendar(self, mock_update_event):
        """Test successful booking update with Google Calendar sync."""
        payload = {
            "visitor_email": self.booking.visitor_email,
            "start_datetime": future_date.replace(hour=12, minute=0, second=0, microsecond=0),
            "end_datetime": future_date.replace(hour=14, minute=0, second=0, microsecond=0),
            "recurrence_rule": "FREQ=WEEKLY"
        }

        url = f'/api/bookings/{self.booking.id}/'
        response = self.client.patch(url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["id"], self.booking.id)
        self.assertEqual(data["status"], "CONFIRMED")

        # Verify Google Calendar API was called
        mock_update_event.assert_called_once()

        # Verify booking was updated in database
        updated_booking = Booking.objects.get(id=self.booking.id)
        self.assertEqual(updated_booking.start_datetime,
                         payload["start_datetime"])
        self.assertEqual(updated_booking.end_datetime, payload["end_datetime"])

    def test_booking_update_fails_without_visitor_email(self):
        """Test booking update fails without visitor_email in request."""
        payload = {
            "start_datetime": future_date.replace(hour=14, minute=0, second=0, microsecond=0),
            "end_datetime": future_date.replace(hour=16, minute=0, second=0, microsecond=0)
        }

        url = f'/api/bookings/{self.booking.id}/'
        response = self.client.patch(url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Visitor email is required", response.json()["detail"])

    def test_booking_update_fails_with_wrong_visitor_email(self):
        """Test booking update fails with wrong visitor_email."""
        payload = {
            "visitor_email": "wrong@example.com",
            "start_datetime": future_date.replace(hour=14, minute=0, second=0, microsecond=0),
            "end_datetime": future_date.replace(hour=16, minute=0, second=0, microsecond=0)
        }

        url = f'/api/bookings/{self.booking.id}/'
        response = self.client.patch(url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ==================== CANCELLATION TESTS (PATCH with cancel_reason) ====================

    @patch('api.booking.views.delete_event')
    def test_booking_cancellation_with_google_calendar(self, mock_delete_event):
        """Test successful booking cancellation with Google Calendar deletion."""
        payload = {
            "visitor_email": self.booking.visitor_email,
            "cancel_reason": "Meeting postponed due to weather"
        }

        url = f'/api/bookings/{self.booking.id}/'
        response = self.client.patch(url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["id"], self.booking.id)
        self.assertEqual(data["status"], "CANCELLED")
        self.assertEqual(data["cancel_reason"], payload["cancel_reason"])

        # Verify Google Calendar API was called to delete event
        mock_delete_event.assert_called_once_with(self.booking.google_event_id)

        # Verify booking was cancelled in database
        cancelled_booking = Booking.objects.get(id=self.booking.id)
        self.assertEqual(cancelled_booking.status, "CANCELLED")
        self.assertEqual(cancelled_booking.cancel_reason,
                         payload["cancel_reason"])
        self.assertEqual(cancelled_booking.google_event_id,
                         "")  # Should be cleared

    def test_booking_cancellation_fails_with_wrong_visitor_email(self):
        """Test booking cancellation fails with wrong visitor_email."""
        payload = {
            "visitor_email": "wrong@example.com",
            "cancel_reason": "Meeting postponed"
        }

        url = f'/api/bookings/{self.booking.id}/'
        response = self.client.patch(url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Visitor email is incorrect", response.json()["detail"])

    # ==================== VALIDATION TESTS ====================

    def test_booking_create_fails_with_end_before_start(self):
        """Test that booking creation fails when end_datetime is before start_datetime."""
        payload = {
            "room_id": self.room.id,
            "visitor_name": "Test User",
            "visitor_email": "test@example.com",
            "start_datetime": future_date.replace(hour=14, minute=0, second=0, microsecond=0) + timedelta(days=3),
            # Before start
            "end_datetime": future_date.replace(hour=12, minute=0, second=0, microsecond=0) + timedelta(days=3),
            "recurrence_rule": ""
        }

        url = '/api/bookings/'
        response = self.client.post(url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("end_datetime", response.json())

    # ==================== PAGINATION TESTS ====================

    @patch('api.booking.views.create_event')
    def test_booking_listing_pagination(self, mock_create_event):
        """Test that booking listing supports pagination."""
        mock_create_event.return_value = {"id": "test-event-id"}

        # Create multiple bookings
        for i in range(15):
            start_dt = future_date.replace(
                hour=10, minute=0, second=0, microsecond=0) + timedelta(days=4 + i)
            end_dt = future_date.replace(
                hour=11, minute=0, second=0, microsecond=0) + timedelta(days=4 + i)
            payload = {
                "room_id": self.room.id,
                "visitor_name": f"User {i}",
                "visitor_email": f"user{i}@example.com",
                "start_datetime": start_dt,
                "end_datetime": end_dt,
                "recurrence_rule": ""
            }
            self.client.post('/api/bookings/', payload, format='json')

        # Test pagination
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/bookings/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Should have pagination metadata
        self.assertIn("count", data)
        self.assertIn("results", data)

        # Verify default limit is enforced (Django REST default is 10)
        self.assertLessEqual(len(data["results"]), 10)

        # Test with explicit limit parameter (e.g., limit=5)
        response_limit_5 = self.client.get('/api/bookings/?limit=5')
        self.assertEqual(response_limit_5.status_code, status.HTTP_200_OK)
        data_limit_5 = response_limit_5.json()
        self.assertEqual(len(data_limit_5["results"]), 5)

        # Test with limit exceeding max_limit (if configured, e.g., max_limit=100)
        response_large_limit = self.client.get('/api/bookings/?limit=9999')
        self.assertEqual(response_large_limit.status_code, status.HTTP_200_OK)
        data_large_limit = response_large_limit.json()
        # If max_limit is set in pagination, update 100 to your max_limit value
        self.assertLessEqual(len(data_large_limit["results"]), 100)

    # ==================== Google Calendar Build Events Data Test ====================
    def test_build_event_data_for_google_calendar(self):
        """Test building event data for Google Calendar integration."""

        mock_room = SimpleNamespace(id=self.room.id, name=self.room.name)

        mock_booking = SimpleNamespace(
            room=mock_room,
            visitor_name="Alice Johnson",
            visitor_email="alice@example.com",
            start_datetime=future_date.replace(hour=10, minute=0, second=0, microsecond=0) + timedelta(days=1),
            end_datetime=future_date.replace(hour=12, minute=0, second=0, microsecond=0) + timedelta(days=1),
            recurrence_rule="FREQ=DAILY;COUNT=5"
        )

        booking_viewset = BookingViewSet()
        event_data = booking_viewset._build_event_data(mock_booking)

        self.assertEqual(event_data["summary"], f"Booking of {self.room.name} - Alice Johnson")
        self.assertIn("description", event_data)
        self.assertEqual(event_data["extendedProperties"]["private"].get("roomId"), str(self.room.id))
