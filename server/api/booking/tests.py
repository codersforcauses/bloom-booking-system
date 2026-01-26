from datetime import timedelta
from .models import Booking
from api.room.models import Room, Location, Amenity
from rest_framework import status
from rest_framework.test import APITestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from unittest.mock import patch

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
            "recurrence_rule": "FREQ=WEEKLY;COUNT=10"  # Updated to include a COUNT
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

    def _base_payload(self):
        return {
            "room_id": self.room.id,
            "visitor_name": "RRULE User",
            "visitor_email": "rrule@example.com",
            "start_datetime": future_date.replace(hour=10, minute=0, second=0, microsecond=0) + timedelta(days=10),
            "end_datetime": future_date.replace(hour=12, minute=0, second=0, microsecond=0) + timedelta(days=10),
        }

    # Test manually or locally. Wont wont without google calendar api.
    """def test_rrule_with_count_is_valid(self):
        payload = self._base_payload()
        payload["recurrence_rule"] = "FREQ=WEEKLY;COUNT=5"

        response = self.client.post('/api/bookings/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_rrule_with_until_is_valid(self):
        payload = self._base_payload()
        payload["recurrence_rule"] = "FREQ=WEEKLY;UNTIL=20260501T000000Z"

        response = self.client.post('/api/bookings/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)"""

    def test_rrule_with_count_and_until_fails(self):
        payload = self._base_payload()
        payload["recurrence_rule"] = "FREQ=WEEKLY;COUNT=5;UNTIL=20260501T000000Z"

        response = self.client.post('/api/bookings/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("recurrence_rule", response.json())

    def test_rrule_without_count_or_until_fails(self):
        payload = self._base_payload()
        payload["recurrence_rule"] = "FREQ=WEEKLY"

        response = self.client.post('/api/bookings/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("recurrence_rule", response.json())

    def test_rrule_with_invalid_freq_fails(self):
        payload = self._base_payload()
        payload["recurrence_rule"] = "FREQ=HOURLY;COUNT=5"

        response = self.client.post('/api/bookings/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("recurrence_rule", response.json())

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

        # Should limit results (default pagination is typically 10-20)
        self.assertLessEqual(len(data["results"]), 20)

    # ==================== RECURRING COLLISION TESTS ====================

    def test_overlapping_recurring_bookings_detected(self):
        Booking.objects.create(
            room=self.room,
            visitor_name="Recurring A",
            visitor_email="a@test.com",
            start_datetime=future_date.replace(hour=10),
            end_datetime=future_date.replace(hour=11),
            recurrence_rule="FREQ=WEEKLY;COUNT=5",
            status="CONFIRMED"
        )

        payload = {
            "room_id": self.room.id,
            "visitor_name": "Recurring B",
            "visitor_email": "b@test.com",
            "start_datetime": future_date.replace(hour=10),
            "end_datetime": future_date.replace(hour=11),
            "recurrence_rule": "FREQ=WEEKLY;COUNT=5",
        }

        response = self.client.post('/api/bookings/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # Test manually or locally. Wont wont without google calendar api.
    """def test_non_overlapping_recurring_bookings_allowed(self):
        Booking.objects.create(
            room=self.room,
            visitor_name="Recurring A",
            visitor_email="a@test.com",
            start_datetime=future_date.replace(hour=1),
            end_datetime=future_date.replace(hour=2),
            recurrence_rule="FREQ=WEEKLY;COUNT=5",
            status="CONFIRMED"
        )

        payload = {
            "room_id": self.room.id,
            "visitor_name": "Recurring B",
            "visitor_email": "b@test.com",
            "start_datetime": future_date.replace(hour=2),
            "end_datetime": future_date.replace(hour=3),
            "recurrence_rule": "FREQ=WEEKLY;COUNT=5",
        }

        response = self.client.post('/api/bookings/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)"""

    def test_recurring_conflicts_with_one_time_booking(self):
        Booking.objects.create(
            room=self.room,
            visitor_name="One Time",
            visitor_email="once@test.com",
            start_datetime=future_date.replace(hour=14),
            end_datetime=future_date.replace(hour=15),
            status="CONFIRMED"
        )

        payload = {
            "room_id": self.room.id,
            "visitor_name": "Recurring",
            "visitor_email": "rec@test.com",
            "start_datetime": future_date.replace(hour=14),
            "end_datetime": future_date.replace(hour=15),
            "recurrence_rule": "FREQ=WEEKLY;COUNT=3",
        }

        response = self.client.post('/api/bookings/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_same_time_different_recurrence_patterns_conflict(self):
        Booking.objects.create(
            room=self.room,
            visitor_name="Biweekly",
            visitor_email="bi@test.com",
            start_datetime=future_date.replace(hour=15),
            end_datetime=future_date.replace(hour=16),
            recurrence_rule="FREQ=WEEKLY;INTERVAL=2;COUNT=6",
            status="CONFIRMED"
        )

        payload = {
            "room_id": self.room.id,
            "visitor_name": "Weekly",
            "visitor_email": "wk@test.com",
            "start_datetime": future_date.replace(hour=15),
            "end_datetime": future_date.replace(hour=16),
            "recurrence_rule": "FREQ=WEEKLY;COUNT=10",
        }

        response = self.client.post('/api/bookings/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
