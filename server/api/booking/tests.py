from .models import Booking
from api.room.models import Room, Location, Amenity
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.utils import timezone
from datetime import timedelta, datetime
from django.contrib.auth import get_user_model
from dateutil.parser import isoparse

User = get_user_model()


class BookingViewTest(APITestCase):

    def setUp(self):
        # Location
        self.loc = Location.objects.create(name="Building A")

        # Amenity
        self.amenity = Amenity.objects.create(name="Projector")

        # Room
        self.room = Room.objects.create(
            name="Meeting Room A",
            location=self.loc,
            capacity=10,
            start_datetime=timezone.make_aware(
                timezone.datetime(2025, 10, 1, 9, 0)),
            end_datetime=timezone.make_aware(
                timezone.datetime(2025, 10, 1, 18, 0)),
            recurrence_rule="FREQ=DAILY;BYDAY=MO,TU,WE",
            is_active=True
        )
        self.room.amenities.set([self.amenity])

        # Booking
        self.booking = Booking.objects.create(
            room_id=self.room.id,
            visitor_name='default',
            visitor_email='default@example.com',
            start_datetime=timezone.make_aware(
                timezone.datetime(2025, 11, 1, 10, 0)),
            end_datetime=timezone.make_aware(
                timezone.datetime(2025, 11, 1, 12, 0)),
            recurrence_rule="",
            status='CONFIRMED',
            google_event_id='abc123'
        )

    def tearDown(self):
        self.booking.delete()
        self.room.delete()
        self.amenity.delete()
        self.loc.delete()

    # POST /api/bookings
    def test_booking_creation(self):
        payload = {
            "room_id": self.room.id,
            "visitor_name": "Alice Johnson",
            "visitor_email": "alice@example.com",
            "start_datetime": timezone.make_aware(
                timezone.datetime(2025, 11, 27, 10, 0)),
            "end_datetime": timezone.make_aware(
                timezone.datetime(2025, 11, 27, 12, 0)),
            "recurrence_rule": "",
            "status": "CONFIRMED"
            }
        url = '/api/bookings/'
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        now = timezone.now()
        data = response.json()
        self.assertEqual(data["id"], self.booking.id + 1)
        self.assertEqual(data["visitor_name"], payload["visitor_name"])
        self.assertEqual(data["visitor_email"], payload["visitor_email"])
        self.assertEqual(isoparse(data["start_datetime"]), payload["start_datetime"])
        self.assertEqual(isoparse(data["end_datetime"]), payload["end_datetime"])
        self.assertEqual(data["recurrence_rule"], payload["recurrence_rule"])
        self.assertEqual(data["status"], payload["status"])
        self.assertIn("google_event_id", data)
        self.assertIn("room", data)
        self.assertEqual(data["room"]["id"], self.room.id)
        self.assertEqual(data["room"]["name"], self.room.name)
        self.assertNotIn("cancel_reason", data)
        self.assertNotIn("updated_at", data)
        self.assertAlmostEqual(datetime.fromisoformat(data["created_at"]), now, delta=timedelta(seconds=10))

        self.assertTrue(Booking.objects.filter(id=data["id"]).exists())

    def test_booking_creation_fails_with_invalid_status(self):
        payload = {
            "room_id": self.room.id,
            "visitor_name": "Alice Johnson",
            "visitor_email": "alice@example.com",
            "start_datetime": timezone.make_aware(
                timezone.datetime(2025, 11, 27, 10, 0)),
            "end_datetime": timezone.make_aware(
                timezone.datetime(2025, 11, 27, 12, 0)),
            "recurrence_rule": "",
            "status": "WHATEVER"
            }
        url = '/api/bookings/'
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # GET /api/bookings
    def test_booking_listing_fails_without_authentication(self):
        url = '/api/bookings/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_booking_listing(self):
        admin = User.objects.create_superuser(
            "admin", "admin@test.com", "admin123")
        self.client = APIClient()
        self.client.force_authenticate(user=admin)
        url = '/api/bookings/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()
        data = data["results"][0]
        self.assertEqual(data["id"], self.booking.id)
        self.assertEqual(data["visitor_name"], self.booking.visitor_name)
        self.assertEqual(data["visitor_email"], self.booking.visitor_email)
        self.assertEqual(isoparse(data["start_datetime"]), self.booking.start_datetime)
        self.assertEqual(isoparse(data["end_datetime"]), self.booking.end_datetime)
        self.assertEqual(data["recurrence_rule"], self.booking.recurrence_rule)
        self.assertEqual(data["status"], self.booking.status)
        self.assertEqual(data["google_event_id"], self.booking.google_event_id)
        self.assertIn("room", data)
        self.assertEqual(data["room"]["id"], self.room.id)
        self.assertEqual(data["room"]["name"], self.room.name)
        self.assertNotIn("cancel_reason", data)
        self.assertNotIn("updated_at", data)
        self.assertEqual(datetime.fromisoformat(data["created_at"]), self.booking.created_at)

    def test_booking_filtering_with_room_id(self):
        admin = User.objects.create_superuser(
            "admin", "admin@test.com", "admin123")
        self.client = APIClient()
        self.client.force_authenticate(user=admin)

        # when there is matched booking
        url = '/api/bookings/?room_id=' + str(self.room.id)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data["results"]), 1)

        # when there is no matched booking
        url = '/api/bookings/?room_id=' + str(self.room.id + 1)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data["results"]), 0)

    def test_booking_filtering_with_date(self):
        admin = User.objects.create_superuser(
            "admin", "admin@test.com", "admin123")
        self.client = APIClient()
        self.client.force_authenticate(user=admin)

        # when there is matched booking
        date = self.booking.start_datetime.date()
        url = '/api/bookings/?date=' + str(date)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data["results"]), 1)

        # when there is no matched booking
        url = '/api/bookings/?date=' + str(date + timedelta(days=1))
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data["results"]), 0)

    def test_booking_filtering_with_visitor_name(self):
        admin = User.objects.create_superuser(
            "admin", "admin@test.com", "admin123")
        self.client = APIClient()
        self.client.force_authenticate(user=admin)

        # when there is matched booking
        url = '/api/bookings/?visitor_name=' + self.booking.visitor_name
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data["results"]), 1)

        # when there is matched booking (case insensitive)
        url = '/api/bookings/?visitor_name=' + self.booking.visitor_name.upper()
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data["results"]), 1)

        # when there is matched booking (partial match)
        url = '/api/bookings/?visitor_name=' + self.booking.visitor_name.split(' ')[0]
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data["results"]), 1)

        # when there is no matched booking
        url = '/api/bookings/?visitor_name=' + 'whatever'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data["results"]), 0)

    def test_booking_filtering_with_visitor_email(self):
        admin = User.objects.create_superuser(
            "admin", "admin@test.com", "admin123")
        self.client = APIClient()
        self.client.force_authenticate(user=admin)

        # when there is matched booking
        url = '/api/bookings/?visitor_email=' + self.booking.visitor_email
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data["results"]), 1)

        # when there is matched booking (case insensitive)
        url = '/api/bookings/?visitor_email=' + self.booking.visitor_email.upper()
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data["results"]), 1)

        # when there is no matched booking (no partial match)
        url = '/api/bookings/?visitor_email=' + self.booking.visitor_email.split('@')[0]
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data["results"]), 0)

        # when there is no matched booking
        url = '/api/bookings/?visitor_email=' + 'whatever@example.com'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data["results"]), 0)

    # GET /api/bookings/{id}
    def test_booking_retrieval_fails_without_authentication_and_no_visitor_emails_provided(self):
        url = '/api/bookings/' + str(self.booking.id) + '/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_booking_retrieval_with_admin_authorization(self):
        admin = User.objects.create_superuser(
            "admin", "admin@test.com", "admin123")
        self.client = APIClient()
        self.client.force_authenticate(user=admin)
        url = '/api/bookings/' + str(self.booking.id) + '/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()
        self.assertEqual(data["id"], self.booking.id)
        self.assertEqual(data["visitor_name"], self.booking.visitor_name)
        self.assertEqual(data["visitor_email"], self.booking.visitor_email)
        self.assertEqual(isoparse(data["start_datetime"]), self.booking.start_datetime)
        self.assertEqual(isoparse(data["end_datetime"]), self.booking.end_datetime)
        self.assertEqual(data["recurrence_rule"], self.booking.recurrence_rule)
        self.assertEqual(data["status"], self.booking.status)
        self.assertEqual(data["google_event_id"], self.booking.google_event_id)
        self.assertIn("room", data)
        self.assertEqual(data["room"]["id"], self.room.id)
        self.assertEqual(data["room"]["name"], self.room.name)
        self.assertNotIn("cancel_reason", data)
        self.assertNotIn("updated_at", data)
        self.assertEqual(datetime.fromisoformat(data["created_at"]), self.booking.created_at)

    def test_booking_retrieval_with_visitor_email(self):
        url = '/api/bookings/' + str(self.booking.id) + '/?visitor_email=' + self.booking.visitor_email
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()
        self.assertEqual(data["id"], self.booking.id)
        self.assertEqual(data["visitor_name"], self.booking.visitor_name)
        self.assertEqual(data["visitor_email"], self.booking.visitor_email)
        self.assertEqual(isoparse(data["start_datetime"]), self.booking.start_datetime)
        self.assertEqual(isoparse(data["end_datetime"]), self.booking.end_datetime)
        self.assertEqual(data["recurrence_rule"], self.booking.recurrence_rule)
        self.assertEqual(data["status"], self.booking.status)
        self.assertEqual(data["google_event_id"], self.booking.google_event_id)
        self.assertIn("room", data)
        self.assertEqual(data["room"]["id"], self.room.id)
        self.assertEqual(data["room"]["name"], self.room.name)
        self.assertNotIn("cancel_reason", data)
        self.assertNotIn("updated_at", data)
        self.assertEqual(datetime.fromisoformat(data["created_at"]), self.booking.created_at)

    def test_booking_retrieval_fails_as_not_found_with_unmatched_visitor_email(self):
        url = '/api/bookings/' + str(self.booking.id) + '/?visitor_email=whatever@example.com'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_booking_retrieval_fails_as_not_found_with_no_matching_id(self):
        url = '/api/bookings/' + str(self.booking.id + 1) + '/?visitor_email=' + self.booking.visitor_email
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # PATCH /api/bookings/{id} - for booking update
    def test_booking_partial_update(self):
        payload = {
            "start_datetime": timezone.make_aware(
                timezone.datetime(2025, 12, 3, 12, 0)),
            "end_datetime": timezone.make_aware(
                timezone.datetime(2025, 12, 3, 13, 0)),
            "recurrence_rule": ""
        }
        url = '/api/bookings/' + str(self.booking.id) + '/?visitor_email=' + self.booking.visitor_email
        response = self.client.patch(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        updated_booking = Booking.objects.get(id=self.booking.id)
        self.assertEqual(updated_booking.start_datetime, payload["start_datetime"])
        self.assertEqual(updated_booking.end_datetime, payload["end_datetime"])
        self.assertEqual(updated_booking.recurrence_rule, payload["recurrence_rule"])

        now = timezone.now()
        data = response.json()
        self.assertEqual(data["id"], self.booking.id)
        self.assertEqual(data["status"], self.booking.status)
        self.assertAlmostEqual(datetime.fromisoformat(data["updated_at"]), now, delta=timedelta(seconds=10))

        self.assertNotIn("visitor_name", data)
        self.assertNotIn("visitor_email", data)
        self.assertNotIn("start_datetime", data)
        self.assertNotIn("end_datetime", data)
        self.assertNotIn("recurrence_rule", data)
        self.assertNotIn("google_event_id", data)
        self.assertNotIn("room", data)
        self.assertNotIn("cancel_reason", data)
        self.assertNotIn("created_at", data)

        self.assertTrue(Booking.objects.filter(id=data["id"]).exists())

    # PATCH /api/bookings/{id} - for booking deletion
    def test_booking_deletion(self):
        payload = {
            "visitor_email": self.booking.visitor_email,
            "cancel_reason": "Meeting postponed"
        }
        url = '/api/bookings/' + str(self.booking.id) + '/?visitor_email=' + self.booking.visitor_email
        response = self.client.patch(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        now = timezone.now()
        data = response.json()
        self.assertEqual(data["id"], self.booking.id)
        self.assertEqual(data["status"], "CANCELLED")
        self.assertEqual(data["cancel_reason"], payload["cancel_reason"])
        self.assertAlmostEqual(datetime.fromisoformat(data["updated_at"]), now, delta=timedelta(seconds=10))

        self.assertNotIn("visitor_name", data)
        self.assertNotIn("visitor_email", data)
        self.assertNotIn("start_datetime", data)
        self.assertNotIn("end_datetime", data)
        self.assertNotIn("recurrence_rule", data)
        self.assertNotIn("google_event_id", data)
        self.assertNotIn("room", data)
        self.assertNotIn("created_at", data)

        self.assertTrue(Booking.objects.filter(id=data["id"]).exists())

    def test_booking_deletion_fails_with_unmatched_email(self):
        payload = {
            "visitor_email": "whatever@email.com",
            "cancel_reason": "Meeting postponed"
        }
        url = '/api/bookings/' + str(self.booking.id) + '/?visitor_email=' + self.booking.visitor_email
        response = self.client.patch(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # GET/api/bookings/search
    def test_booking_search(self):
        # when there is matched booking
        url = '/api/bookings/search/?visitor_email=' + self.booking.visitor_email
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data["results"]), 1)

        # when there is matched booking (case insensitive)
        url = '/api/bookings/search/?visitor_email=' + self.booking.visitor_email.upper()
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data["results"]), 1)

        # when there is no matched booking
        url = '/api/bookings/search/?visitor_email=' + 'whatever@example.com'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data["results"]), 0)

    def test_booking_search_fails_with_no_email(self):
        # when there is matched booking
        url = '/api/bookings/search/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_booking_listing_with_default_pagination_size(self):
        payload = {
            "room_id": self.room.id,
            "visitor_name": "Alice Johnson",
            "visitor_email": "alice@example.com",
            "start_datetime": timezone.make_aware(
                timezone.datetime(2025, 11, 27, 10, 0)),
            "end_datetime": timezone.make_aware(
                timezone.datetime(2025, 11, 27, 12, 0)),
            "recurrence_rule": "",
            "status": "CONFIRMED"
            }
        url = '/api/bookings/'
        for i in range(20):
            self.client.post(url, payload, format='json')

        admin = User.objects.create_superuser(
            "admin", "admin@test.com", "admin123")
        self.client = APIClient()
        self.client.force_authenticate(user=admin)
        response = self.client.get(url)
        data = response.json()
        self.assertEqual(len(data["results"]), 10)
