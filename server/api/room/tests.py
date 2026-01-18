from django.test import TestCase
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import Room, Location, Amenity
from .serializers import AmenitySerializer, LocationSerializer, RoomSerializer
from .views import RoomViewSet, LocationViewSet, AmenityViewSet
from django.urls import reverse, resolve
from django.utils import timezone
from django.core.exceptions import ValidationError
from datetime import datetime, timedelta

User = get_user_model()


# --- 1. Models Tests ---
class RoomModelTests(TestCase):
    def test_invalid_room_capacity(self):
        mock_location = Location.objects.create(name="mock_location")
        invalid_room = Room(
            name="room",
            location=mock_location,
            capacity=-1,
            start_datetime=datetime(2025, 1, 1),
            end_datetime=datetime(2025, 1, 2),
        )
        valid_room = Room(
            name="room",
            location=mock_location,
            capacity=1,
            start_datetime=datetime(2025, 1, 1),
            end_datetime=datetime(2025, 1, 2),
        )

        print("\nTest room capacity:")
        with self.assertRaises(ValidationError):
            invalid_room.clean_fields()  # validates each field

        try:
            valid_room.clean_fields()
        except ValidationError as e:
            self.fail(f"Valid room flagged as invalid: {e}")


# --- 2. Serializers Tests ---
class AmenitySerializerTests(TestCase):
    pass


class LocationSerializerTests(TestCase):
    pass


class RoomSerializerTests(TestCase):
    def setUp(self):
        self.mock_location = Location.objects.create(id=1, name="mock_location")
        self.mock_amenity = Amenity.objects.create(id=1, name="mock_amenity")
        self.generic_room_dict = {
            "name": "testroom",
            "capacity": 1,
            "location_id": self.mock_location.pk,
            "amenities_id": [self.mock_amenity.pk],
        }
        self.generic_date = datetime(2025, 1, 1, 10)
        self.one_hour = timedelta(hours=1)

    def test_date_combinations(self):
        # end date must be strictly after start date
        valid_room_data = self.generic_room_dict | {
            "start_datetime": self.generic_date,
            "end_datetime": self.generic_date + self.one_hour,
        }
        invalid_room_data = self.generic_room_dict | {
            "start_datetime": self.generic_date,
            "end_datetime": self.generic_date - self.one_hour,
        }

        print("\nTesting valid date combination:")
        valid_serializer = RoomSerializer(data=valid_room_data)
        valid = valid_serializer.is_valid()
        self.assertTrue(valid)

        print("\nTesting invalid date combination:")
        invalid_serializer = RoomSerializer(data=invalid_room_data)
        valid = invalid_serializer.is_valid()
        self.assertFalse(valid)

    def test_response_data_structure(self):
        # ...
        pass

    def test_recurrence_rule(self):
        # not required, but test the format
        pass


# --- 3. Views Tests ---
class RoomViewSetTests(TestCase):
    pass


class LocationViewSetTests(TestCase):
    pass


class AmenityViewSetTests(TestCase):
    pass


# --- 4. URLs Tests ---
class URLTests(TestCase):
    pass


class RoomAPITest(APITestCase):
    def setUp(self):
        # abc user
        self.abc = User.objects.create_superuser(
            "abc", "abc@test.com", "pass")
        self.client.login(username="abc", password="pass")

        # Locations
        self.loc1 = Location.objects.create(name="Building A")
        self.loc3 = Location.objects.create(name="Building C")

        # Amenities
        self.amenity1 = Amenity.objects.create(name="Projector")
        self.amenity2 = Amenity.objects.create(name="Whiteboard")
        self.amenity4 = Amenity.objects.create(name="House")

        # Rooms
        self.room1 = Room.objects.create(
            name="Conference Room 1",
            location=self.loc1,
            capacity=10,
            start_datetime=timezone.make_aware(
                timezone.datetime(2025, 10, 1, 9, 0)),
            end_datetime=timezone.make_aware(
                timezone.datetime(2025, 10, 1, 18, 0)),
            recurrence_rule="FREQ=DAILY;BYDAY=MO,TU,WE",
            is_active=True
        )
        self.room1.amenities.set([self.amenity1, self.amenity2])

        self.room2 = Room.objects.create(
            name="Meeting Room A",
            location=self.loc3,
            capacity=5,
            start_datetime=timezone.make_aware(
                timezone.datetime(2025, 11, 1, 10, 0)),
            end_datetime=timezone.make_aware(
                timezone.datetime(2025, 11, 1, 17, 0)),
            recurrence_rule="FREQ=WEEKLY;BYDAY=MO,WE,FR",
            is_active=False  # Inactive room for unauthenticated test
        )
        self.room2.amenities.set([self.amenity4])

    # -------- LIST & FILTER TESTS --------
    def test_list_all_rooms_authenticated(self):
        client = APIClient()
        client.force_authenticate(user=self.abc)
        response = client.get("/api/rooms/")
        print("\nAll Rooms (Authenticated) Response:")

        print("Is authenticated:", response.wsgi_request.user.is_authenticated)
        self.assertTrue(response.wsgi_request.user.is_authenticated)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 2)

    def test_list_only_active_rooms_unauthenticated(self):
        self.client.logout()
        response = self.client.get("/api/rooms/")
        print("\nAll Rooms (Unauthenticated) Response:")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Only room1 is active
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["id"], self.room1.id)

    def test_filter_rooms_by_name(self):
        response = self.client.get("/api/rooms/?name=Conference Room 1")
        print("\nFilter by Name Response:")

        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"]
                         [0]["name"], "Conference Room 1")

    def test_filter_rooms_by_location_name(self):
        response = self.client.get("/api/rooms/?location=Building A")
        print("\nFilter by location Name Response:")

        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"]
                         [0]["location"]["id"], self.loc1.id)

    # -------- RETRIEVE TEST --------
    def test_retrieve_room(self):
        room = Room.objects.first()
        response = self.client.get(f"/api/rooms/{room.id}/")
        print("\nRetrieve Room Response:")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], room.id)

    # -------- UPDATE TEST --------
    def test_update_room(self):
        client = APIClient()
        client.force_authenticate(user=self.abc)
        room = Room.objects.first()
        response = client.patch(
            f"/api/rooms/{room.id}/",
            {"name": "Updated Room"},
            format="json"
        )
        print("\nUpdate Room Response:")
        print(response.content.decode())
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Updated Room")

        # Confirm update
        response = self.client.get(f"/api/rooms/{room.id}/")
        self.assertEqual(response.data["name"], "Updated Room")

    # -------- DELETE TEST (should not be allowed) --------
    def test_delete_room_not_allowed(self):
        client = APIClient()
        client.force_authenticate(user=self.abc)
        room = Room.objects.first()
        response = client.delete(f"/api/rooms/{room.id}/")
        print("\nDelete Room Response:")
        print(response.content.decode())
        self.assertEqual(response.status_code,
                         status.HTTP_405_METHOD_NOT_ALLOWED)
