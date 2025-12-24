from django.db import models
from api.room.models import Room


class Booking(models.Model):
    # Booking status enum
    STATUS_CHOICES = {
        "CONFIRMED": "CONFIRMED",
        "CANCELLED": "CANCELLED",
        "COMPLETED": "COMPLETED"
    }

    id = models.AutoField(primary_key=True)
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    visitor_name = models.CharField(max_length=100)
    visitor_email = models.EmailField(max_length=100)
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    # return "" when there is no recurrence rule
    recurrence_rule = models.CharField(max_length=100, blank=True)
    status = models.CharField(
        max_length=9, choices=STATUS_CHOICES, default="CONFIRMED")
    google_event_id = models.CharField(max_length=100, blank=True)
    # return "" when it is not cancelled
    cancel_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Room {self.room_id} booked by {self.visitor_name} from {self.start_datetime} to {self.end_datetime}"
