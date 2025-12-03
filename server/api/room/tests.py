from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User

class RoomAPITest(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser("admin", "admin@test.com", "pass")
    # ok i need test case basically post bunch of rooms
    # then i need to filter with get requests like name, location, capacity, or date).
    # then get then by id
    # then update
    # check with get response
    #then delete
    def test_list_rooms(self):
        response = self.client.get("/api/rooms/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_room_admin(self):

        self.client.login(username="admin", password="pass")

        data = {
            "name": "Meeting Room A",
            "img_url": "https://example.com/roomA.jpg",
            "location_id": 1,
            "capacity_id": 2,
            "start_datetime": "2025-11-01T09:00:00Z",
            "end_datetime": "2025-11-01T18:00:00Z",
            "recurrence_rule": "FREQ=WEEKLY;BYDAY=MO,WE,FR"
        }

        response = self.client.post("/api/rooms/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

