from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User
from .models import Room, Location, Amenties
from django.utils import timezone
import json

class RoomAPITest(APITestCase):
    def setUp(self):
        # Admin user
        self.admin = User.objects.create_superuser("admin", "admin@test.com", "pass")
        self.client.login(username="admin", password="pass")

        # Locations
        self.loc1 = Location.objects.create(name="Building A")
        self.loc3 = Location.objects.create(name="Building C")

        # Amenities
        self.amenity1 = Amenties.objects.create(name="Projector")
        self.amenity2 = Amenties.objects.create(name="Whiteboard")
        self.amenity4 = Amenties.objects.create(name="House")

        # Rooms
        self.room1 = Room.objects.create(
            name="Conference Room 1",
            location=self.loc1,
            capacity=10,
            start_datetime=timezone.make_aware(timezone.datetime(2025, 10, 1, 9, 0)),
            end_datetime=timezone.make_aware(timezone.datetime(2025, 10, 1, 18, 0)),
            recurrence_rule="FREQ=DAILY;BYDAY=MO,TU,WE,"
        )
        self.room1.amenities.set([self.amenity1, self.amenity2])

        self.room2 = Room.objects.create(
            name="Meeting Room A",
            location=self.loc3,
            capacity=5,
            start_datetime=timezone.make_aware(timezone.datetime(2025, 11, 1, 10, 0)),
            end_datetime=timezone.make_aware(timezone.datetime(2025, 11, 1, 17, 0)),
            recurrence_rule="FREQ=WEEKLY;BYDAY=MO,WE,FR"
        )
        self.room2.amenities.set([self.amenity4])

    # -------- LIST & FILTER TESTS --------
    def test_list_all_rooms(self):
        response = self.client.get("/api/rooms/")
        print("\nAll Rooms Response:")
        print(json.dumps(response.data, indent=4))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_filter_rooms_by_name(self):
        response = self.client.get("/api/rooms/?name=Meeting Room A")
        print("\nFilter by Name Response:")
        print(json.dumps(response.data, indent=4))
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["name"], "Meeting Room A")

    def test_filter_rooms_by_location(self):
        loc_id = self.loc1.id
        response = self.client.get(f"/api/rooms/?location_id={loc_id}")
        print("\nFilter by Location Response:")
        print(json.dumps(response.data, indent=4))
        self.assertTrue(all(r["location_id"] == loc_id for r in response.data))

    # -------- RETRIEVE TEST --------
    def test_retrieve_room(self):
        room = Room.objects.first()
        response = self.client.get(f"/api/rooms/{room.id}/")
        print("\nRetrieve Room Response:")
        print(json.dumps(response.data, indent=4))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], room.id)

    # -------- UPDATE TEST --------
    def test_update_room(self):
        room = Room.objects.first()
        response = self.client.patch(
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

    # -------- DELETE TEST --------
    def test_delete_room(self):
        room = Room.objects.first()
        response = self.client.delete(f"/api/rooms/{room.id}/")
        print("\nDelete Room Response:")
        print(response.content.decode())
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Confirm deletion
        response = self.client.get("/api/rooms/")
        self.assertEqual(len(response.data), 1)
        self.assertNotIn(room.id, [r["id"] for r in response.data])
