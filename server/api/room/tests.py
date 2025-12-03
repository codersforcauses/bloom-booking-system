from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User
from .models import Room, Location, Amenties
from django.utils import timezone
from datetime import timedelta

class RoomAPITest(APITestCase):
    def setUp(self):
        # Create admin user
        self.admin = User.objects.create_superuser("admin", "admin@test.com", "pass")

        # Login as admin for all POST/PUT/DELETE actions
        self.client.login(username="admin", password="pass")

        # Create locations
        self.loc1 = Location.objects.create(name="Building A")
        self.loc2 = Location.objects.create(name="Building B")

        # Create amenities
        self.amenity1 = Amenties.objects.create(name="Projector")
        self.amenity2 = Amenties.objects.create(name="Whiteboard")

        # Create rooms
        for i in range(5):
            start = timezone.make_aware(timezone.datetime(2025, 11, 1, 9, 0)) + timedelta(days=i)
            end = timezone.make_aware(timezone.datetime(2025, 11, 1, 18, 0)) + timedelta(days=i)

            room = Room.objects.create(
                name=f"Meeting Room {chr(65+i)}",
                img_url=f"https://example.com/room{chr(65+i)}.jpg",
                location_id=self.loc1,
                capacity_id=1,
                start_datetime=start,
                end_datetime=end,
                recurrence_rule="FREQ=WEEKLY;BYDAY=MO,WE,FR"
            )
            room.amenties.add(self.amenity1, self.amenity2)

    def test_list_rooms(self):
        # GET all rooms
        response = self.client.get("/api/rooms/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 5)

        # Filter by name
        response = self.client.get("/api/rooms/?name=Room A")
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["name"], "Meeting Room A")

        # Filter by location_id
        response = self.client.get("/api/rooms/?location_id=1")
        self.assertTrue(all(r["location_id"] == 1 for r in response.data))

        # Filter by capacity_id
        response = self.client.get("/api/rooms/?capacity_id=2")
        self.assertTrue(all(r["capacity_id"] == 2 for r in response.data))


    def test_retrieve_update_delete_room(self):
        # Get a room
        room = Room.objects.first()
        response = self.client.get(f"/api/rooms/{room.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], room.name)

        # Update room
        response = self.client.patch(f"/api/rooms/{room.id}/", {"name": "Updated Room"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Updated Room")

        # Check via GET
        response = self.client.get(f"/api/rooms/{room.id}/")
        self.assertEqual(response.data["name"], "Updated Room")

        # Delete room
        response = self.client.delete(f"/api/rooms/{room.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Room deleted successfully")

        # Check room count
        response = self.client.get("/api/rooms/")
        self.assertEqual(len(response.data), 4)
