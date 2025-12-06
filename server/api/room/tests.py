<<<<<<< Updated upstream
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User
from .models import Room, Location, Amenties, Capacity
from django.utils import timezone
from datetime import timedelta
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

        # Capacities
        self.cap1 = Capacity.objects.create(name="10 people")
        self.cap4 = Capacity.objects.create(name="2 people")

        # Rooms
        rooms_list = [
            {
                "name": "Meeting Room A",
                "location": self.loc1,
                "capacity": self.cap1,
                "amenities": [self.amenity1, self.amenity2]
            },
            {
                "name": "Meeting Room X",
                "location": self.loc3,
                "capacity": self.cap4,
                "amenities": [self.amenity1, self.amenity4]
            }
        ]

        for idx, room_data in enumerate(rooms_list):
            start = timezone.make_aware(timezone.datetime(2025, 11, 1, 9, 0)) + timedelta(days=idx)
            end = timezone.make_aware(timezone.datetime(2025, 11, 1, 18, 0)) + timedelta(days=idx)

            room = Room.objects.create(
                name=room_data["name"],
                img_url="https://example.com/room.jpg",
                location_id=room_data["location"],
                capacity_id=room_data["capacity"],
                start_datetime=start,
                end_datetime=end,
                recurrence_rule="FREQ=WEEKLY;BYDAY=MO,WE,FR"
            )
            room.amenities.set(room_data["amenities"])
            print(f"Created room: {room.name}, ID: {room.id}")

    def test_list_rooms(self):
        response = self.client.get("/api/rooms/")
        print("\nAll Rooms Response:")
        print(json.dumps(response.data, indent=4))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Filter by name
        response = self.client.get("/api/rooms/?name=Meeting Room A")
        print("\nFilter by name Response:")
        print(json.dumps(response.data, indent=4))
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["name"], "Meeting Room A")

        # Filter by location_id
        loc_id = self.loc1.id
        response = self.client.get(f"/api/rooms/?location_id={loc_id}")
        print("\nFilter by location_id Response:")
        print(json.dumps(response.data, indent=4))

        # Filter by capacity_id
        cap_id = self.cap4.id
        response = self.client.get(f"/api/rooms/?capacity_id={cap_id}")
        print("\nFilter by capacity_id Response:")
        print(json.dumps(response.data, indent=4))

    def test_retrieve_update_delete_room(self):
        room = Room.objects.first()

        # Retrieve
        response = self.client.get(f"/api/rooms/{room.id}/")
        print("\nRetrieve Room Response:")
        print(json.dumps(response.data, indent=4))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Update
        response = self.client.patch(f"/api/rooms/{room.id}/", {"name": "Updated Room"}, format="json")
        print("\nUpdate Room Response:")
        print(response.content.decode()) 
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Updated Room")

        # GET after update
        response = self.client.get(f"/api/rooms/{room.id}/")
        print("\nRetrieve After Update Response:")
        print(response.content.decode())
        self.assertEqual(response.data["name"], "Updated Room")

        # Delete
        response = self.client.delete(f"/api/rooms/{room.id}/")
        print("\nDelete Room Response:")
        print(response.content.decode())
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # GET all rooms after delete
        response = self.client.get("/api/rooms/")
        print("\nAll Rooms After Delete Response:")
        print(response.content.decode())
=======
from django.test import TestCase

# Create your tests here.
>>>>>>> Stashed changes
