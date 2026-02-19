from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import Room, Location, Amenity
from django.utils import timezone
from datetime import timedelta, time
from api.booking.models import Booking

User = get_user_model()


def next_monday_and_sunday():
    today = timezone.localdate()
    # Monday = 0, Sunday = 6
    days_until_monday = (0 - today.weekday()) % 7
    if days_until_monday == 0:
        days_until_monday = 7

    next_monday = today + timedelta(days=days_until_monday)
    next_tuesday = next_monday + timedelta(days=1)
    next_wednesday = next_monday + timedelta(days=2)
    next_thursday = next_monday + timedelta(days=3)
    next_sunday = next_monday + timedelta(days=6)

    return next_monday, next_tuesday, next_wednesday, next_thursday, next_sunday


next_monday, next_tuesday, next_wednesday, next_thursday, next_sunday = next_monday_and_sunday()
today = timezone.localdate()
next_year = today.year + 1


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
            is_active=True
        )
        self.room1.amenities.set([self.amenity1, self.amenity2])

        self.room2 = Room.objects.create(
            name="Meeting Room 2",
            location=self.loc1,
            capacity=5,
            is_active=True
        )
        self.room2.amenities.set([self.amenity1, self.amenity2])

        self.room3 = Room.objects.create(
            name="Meeting Room 3",
            location=self.loc1,
            capacity=5,
            is_active=True
        )

        self.room3.amenities.set([self.amenity1, self.amenity2])

        # Bookings
        # Booking for room with a recurrence rule (no end date)
        self.booking1 = Booking.objects.create(
            room=self.room1,
            visitor_name='John Doe',
            visitor_email='john@example.com',
            start_datetime=timezone.make_aware(
                timezone.datetime(2025, 10, 1, 11, 0)),
            end_datetime=timezone.make_aware(
                timezone.datetime(2025, 10, 1, 12, 0)),
            recurrence_rule="FREQ=WEEKLY;BYDAY=MO",
            status='CONFIRMED'
        )

        # Booking for room without a recurrence rule
        self.booking2 = Booking.objects.create(
            room=self.room2,
            visitor_name='John Doe',
            visitor_email='john@example.com',
            start_datetime=timezone.make_aware(
                timezone.datetime.combine(next_monday, time(13, 0))),
            end_datetime=timezone.make_aware(
                timezone.datetime.combine(next_monday, time(14, 0))),
            recurrence_rule="",
            status='CONFIRMED'
        )

        # Booking for room with a recurrence rule (with end date)
        self.booking3 = Booking.objects.create(
            room=self.room3,
            visitor_name='John Doe',
            visitor_email='john@example.com',
            start_datetime=timezone.make_aware(
                timezone.datetime(2025, 10, 1, 15, 0)),
            end_datetime=timezone.make_aware(
                timezone.datetime(2025, 10, 1, 16, 0)),
            recurrence_rule=f"FREQ=DAILY;UNTIL={next_year}1130000000Z",
            status='CONFIRMED'
        )

    # Test availability when there are no bookings
    def test_availability_no_bookings(self):
        # Check availability for next Tuesday to next Sunday
        response = self.client.get(
            f"/api/rooms/{self.room1.id}/availability/?start_date={next_tuesday.isoformat()}&end_date={next_thursday.isoformat()}")
        print("\nAvailability No Bookings Response:")
        print(response.content.decode())
        print()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        room_id = response.data["room_id"]
        self.assertEqual(room_id, self.room1.id)
        availability = response.data["availability"]
        self.assertEqual(len(availability), 3)
        self.assertEqual(availability[0]['date'], next_tuesday.isoformat())
        self.assertEqual(len(availability[0]["slots"]), 1)
        self.assertEqual(availability[1]['date'], next_wednesday.isoformat())
        self.assertEqual(len(availability[1]["slots"]), 1)
        self.assertEqual(availability[2]['date'], next_thursday.isoformat())
        self.assertEqual(len(availability[2]["slots"]), 1)

    # Test availability when booking have recurrence rules
    def test_availability_recurrence_rules(self):
        # Check availability for next Monday to next Sunday
        response = self.client.get(
            f"/api/rooms/{self.room1.id}/availability/?start_date={next_monday.isoformat()}&end_date={next_wednesday.isoformat()}")
        print("\nAvailability Recurrence Rules Response:")
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
        self.assertEqual(len(availability[2]["slots"]), 1)

    def test_start_date_is_inclusive(self):
        """
        Specifically asserts that the start_date boundary is included.
        Fails if inc=False, passes if inc=True.
        """
        response = self.client.get(
            f"/api/rooms/{self.room1.id}/availability/",
            {"start_date": next_tuesday.isoformat(), "end_date": next_wednesday.isoformat()}
        )

        # If it was exclusive (inc=False), this length would be 1.
        availability = response.data.get("availability", [])
        self.assertEqual(len(availability), 2, "The search range must include the start_date.")

    # Test availability when booking have no recurrence rules
    def test_availability_no_recurrence_rules(self):
        # Check availability for next Monday to next Sunday
        response = self.client.get(
            f"/api/rooms/{self.room2.id}/availability/?start_date={next_monday.isoformat()}&end_date={next_monday.isoformat()}")
        print("\nAvailability No Recurrence Rules Response:")
        print(response.content.decode())
        print()

    #     self.assertEqual(response.status_code, status.HTTP_200_OK)
    #     room_id = response.data["room_id"]
    #     self.assertEqual(room_id, self.room2.id)
    #     availability = response.data["availability"]
    #     self.assertEqual(len(availability), 1)
    #     self.assertEqual(availability[0]['date'], next_monday.isoformat())
    #     self.assertEqual(len(availability[0]["slots"]), 2)
    #     # Room 2 has a booking from 13:00 to 14:00
    #     self.assertEqual(availability[0]["slots"][0]['end'], timezone.make_aware(
    #         timezone.datetime.combine(next_monday, time(13, 0))).isoformat())
    #     self.assertEqual(availability[0]["slots"][1]['start'], timezone.make_aware(
    #         timezone.datetime.combine(next_monday, time(14, 0))).isoformat())

    # Test availability when room and booking have recurrence rules with end date
    def test_availability_recurrence_rule_with_end_date(self):
        response = self.client.get(
            f"/api/rooms/{self.room3.id}/availability/?start_date={next_year}-11-01&end_date={next_year}-11-01"
            )
        print("\nAvailability Recurrence Rule with End Date Response:")
        print(response.content.decode())
        print()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        room_id = response.data["room_id"]
        self.assertEqual(room_id, self.room3.id)
        availability = response.data["availability"]
        self.assertEqual(len(availability), 1)
        self.assertEqual(availability[0]['date'], f"{next_year}-11-01")
        self.assertEqual(len(availability[0]["slots"]), 2)
        # Monday has a booking from 15:00 to 16:00
        target_date = timezone.datetime.strptime(
            f"{next_year}-11-01", "%Y-%m-%d").date()
        self.assertEqual(availability[0]["slots"][0]['end'], timezone.make_aware(
            timezone.datetime.combine(target_date, time(15, 0))).isoformat())
        self.assertEqual(availability[0]["slots"][1]['start'], timezone.make_aware(
            timezone.datetime.combine(target_date, time(16, 0))).isoformat())

    # Test availability when room and booking have recurrence rules when booking end date is in the past
    def test_availability_recurrence_rule_with_booking_end_date_past(self):
        response = self.client.get(
            f"/api/rooms/{self.room3.id}/availability/?start_date={next_year}-12-01&end_date={next_year}-12-01"
            )
        print("\nAvailability Recurrence Rule with Booking End Date Past Response:")
        print(response.content.decode())
        print()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        room_id = response.data["room_id"]
        self.assertEqual(room_id, self.room3.id)
        availability = response.data["availability"]
        self.assertEqual(len(availability), 1)
        self.assertEqual(availability[0]['date'], f"{next_year}-12-01")
        self.assertEqual(len(availability[0]["slots"]), 1)

    def test_rooms_availability(self):
        start_datetime = timezone.make_aware(
            timezone.datetime.combine(next_monday, time(11, 0))
        )
        end_datetime = timezone.make_aware(
            timezone.datetime.combine(next_monday, time(12, 0))
        )
        response = self.client.get(
            f"/api/rooms/availability/?start_datetime={start_datetime.isoformat()}&end_datetime={end_datetime.isoformat()}"
        )
        print("\nRooms Availability Response:")
        print(response.content.decode())
        print()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data["results"]
        self.assertEqual(len(data), 3)
        # The room is booked 11-12 on next Monday
        self.assertEqual(data[0]['room_id'], self.room1.id)
        self.assertEqual(data[0]['availability'], False)
        self.assertEqual(data[1]['room_id'], self.room2.id)
        self.assertEqual(data[1]['availability'], True)
        self.assertEqual(data[2]['room_id'], self.room3.id)
        self.assertEqual(data[2]['availability'], True)
