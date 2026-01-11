from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import Room, Location, Amenity
from django.utils import timezone
from datetime import date, timedelta, time
from api.booking.models import Booking

User = get_user_model()


def next_monday_and_sunday():
    today = date.today()
    # Monday = 0, Sunday = 6
    days_until_monday = (0 - today.weekday()) % 7
    if days_until_monday == 0:
        days_until_monday = 7

    next_monday = today + timedelta(days=days_until_monday)
    next_tuesday = next_monday + timedelta(days=1)
    next_wednesday = next_monday + timedelta(days=2)
    next_sunday = next_monday + timedelta(days=6)

    return next_monday, next_tuesday, next_wednesday, next_sunday


future_date = date.today() + timedelta(days=7)
next_monday, next_tuesday, next_wednesday, next_sunday = next_monday_and_sunday()
today = timezone.localdate()


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


class AvailabilityAPITest(APITestCase):
    def setUp(self):
        # abc user
        self.abc = User.objects.create_superuser(
            "abc", "abc@test.com", "pass")
        self.client.login(username="abc", password="pass")

        # Locations
        self.loc1 = Location.objects.create(name="Building A")

        # Amenities
        self.amenity1 = Amenity.objects.create(name="Projector")
        self.amenity2 = Amenity.objects.create(name="Whiteboard")

        # Rooms
        self.room1 = Room.objects.create(
            name="Meeting Room 1",
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

        # Room without recurrence rules
        self.room2 = Room.objects.create(
            name="Meeting Room 2",
            location=self.loc1,
            capacity=5,
            start_datetime=timezone.make_aware(
                timezone.datetime.combine(future_date, time(9, 0))),
            end_datetime=timezone.make_aware(
                timezone.datetime.combine(future_date, time(18, 0))),
            is_active=True
        )
        self.room2.amenities.set([self.amenity1, self.amenity2])

        self.room3 = Room.objects.create(
            name="Meeting Room 3",
            location=self.loc1,
            capacity=8,
            start_datetime=timezone.make_aware(
                 timezone.datetime.combine(today, time(9, 0))
                 ),
            end_datetime=timezone.make_aware(
                 timezone.datetime.combine(today, time(23, 59))
                ),
            is_active=True
            )
        self.room3.amenities.set([self.amenity1, self.amenity2])

        # Bookings
        self.booking1 = Booking.objects.create(
            room=self.room1,
            visitor_name='John Doe',
            visitor_email='john@example.com',
            start_datetime=timezone.make_aware(
                timezone.datetime(2025, 10, 1, 11, 0)),
            end_datetime=timezone.make_aware(
                timezone.datetime(2025, 10, 1, 12, 0)),
            recurrence_rule="FREQ=DAILY;BYDAY=MO",
            status='CONFIRMED'
        )

        # Booking for room without recurrence rules
        self.booking2 = Booking.objects.create(
            room=self.room2,
            visitor_name='John Doe',
            visitor_email='john@example.com',
            start_datetime=timezone.make_aware(
                timezone.datetime.combine(future_date, time(13, 0))),
            end_datetime=timezone.make_aware(
                timezone.datetime.combine(future_date, time(14, 0))),
            recurrence_rule="",
            status='CONFIRMED'
        )

    # Test availability when there are no bookings
    def test_availability_no_bookings(self):
        # Check availability for next Tuesday to next Sunday
        response = self.client.get(
            f"/api/rooms/{self.room1.id}/availability/?start_date={next_tuesday.isoformat()}&end_date={next_sunday.isoformat()}")
        print("\nAvailability No Bookings Response:")
        print(response.content.decode())
        print()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        room_id = response.data["room_id"]
        self.assertEqual(room_id, self.room1.id)
        availability = response.data["availability"]
        self.assertEqual(len(availability), 2)
        self.assertEqual(availability[0]['date'], next_tuesday.isoformat())
        self.assertEqual(len(availability[0]["slots"]), 1)
        self.assertEqual(availability[1]['date'], next_wednesday.isoformat())
        self.assertEqual(len(availability[1]["slots"]), 1)

    # Test availability when room and booking have recurring rules
    def test_availability_recurrence_rules(self):
        # Check availability for next Monday to next Sunday
        response = self.client.get(
            f"/api/rooms/{self.room1.id}/availability/?start_date={next_monday.isoformat()}&end_date={next_sunday.isoformat()}")
        print("\nAvailability Recurrrence Rules Response:")
        print(response.content.decode())
        print()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        room_id = response.data["room_id"]
        self.assertEqual(room_id, self.room1.id)
        availability = response.data["availability"]
        self.assertEqual(len(availability), 3)
        self.assertEqual(availability[0]['date'], next_monday.isoformat())
        self.assertEqual(len(availability[0]["slots"]), 2)
        # Monday has a booking from 11:00 to 12:00
        self.assertEqual(availability[0]["slots"][0]['end'], timezone.make_aware(
            timezone.datetime.combine(next_monday, time(11, 0))).isoformat())
        self.assertEqual(availability[0]["slots"][1]['start'], timezone.make_aware(
            timezone.datetime.combine(next_monday, time(12, 0))).isoformat())
        self.assertEqual(len(availability[1]["slots"]), 1)
        self.assertEqual(len(availability[1]["slots"]), 1)

    # Test availability when room and booking have no recurring rules
    def test_availability_no_recurrence_rules(self):
        # Check availability for next Monday to next Sunday
        response = self.client.get(
            f"/api/rooms/{self.room2.id}/availability/?start_date={next_monday.isoformat()}&end_date={next_sunday.isoformat()}")
        print("\nAvailability No Reccurrence Rules Response:")
        print(response.content.decode())
        print()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        room_id = response.data["room_id"]
        self.assertEqual(room_id, self.room2.id)
        availability = response.data["availability"]
        self.assertEqual(len(availability), 1)
        self.assertEqual(availability[0]['date'], future_date.isoformat())
        self.assertEqual(len(availability[0]["slots"]), 2)
        # Room 2 has a booking from 13:00 to 14:00
        self.assertEqual(availability[0]["slots"][0]['end'], timezone.make_aware(
            timezone.datetime.combine(future_date, time(13, 0))).isoformat())
        self.assertEqual(availability[0]["slots"][1]['start'], timezone.make_aware(
            timezone.datetime.combine(future_date, time(14, 0))).isoformat())

    # Test availability when start_date is at today
    def test_availability_today(self):
        response = self.client.get(
            f"/api/rooms/{self.room3.id}/availability/?start_date={today.isoformat()}&end_date={today.isoformat()}"
            )
        print("\nAvailability Today Response:")
        print(response.content.decode())
        print()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        room_id = response.data["room_id"]
        self.assertEqual(room_id, self.room3.id)
        availability = response.data["availability"]
        self.assertEqual(availability[0]["date"], today.isoformat())
        # Only one slot should remain (from now → 24:00)
        self.assertEqual(len(availability[0]["slots"]), 1)
        now_local = timezone.localtime(timezone.now())
        room_start = timezone.make_aware(
            timezone.datetime.combine(today, time(9, 0))
            )
        room_end = timezone.make_aware(
            timezone.datetime.combine(today, time(23, 59))
            )
        # Expected start = max(now, room_start)
        expected_start = max(room_start, now_local)
        expected_end = room_end
        actual_start = timezone.datetime.fromisoformat(availability[0]["slots"][0]["start"])
        self.assertLess(abs(actual_start - expected_start), timedelta(seconds=1))
        self.assertEqual(availability[0]["slots"][0]["end"], expected_end.isoformat())
