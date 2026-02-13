from django.db import models
from django.utils import timezone
from dateutil.rrule import rrulestr
import zoneinfo
import logging
from api.room.models import Room


logger = logging.getLogger(__name__)


class BookingManager(models.Manager):
    def get_queryset(self):
        now = timezone.now()
        super().get_queryset().filter(status='Confirmed', actual_end_datetime__lte=now).update(status='Completed')
        return super().get_queryset()


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
    actual_end_datetime = models.DateTimeField(blank=True, null=True)
    status = models.CharField(
        max_length=9, choices=STATUS_CHOICES, default="CONFIRMED")
    google_event_id = models.CharField(max_length=100, blank=True)
    # return "" when it is not cancelled
    cancel_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = BookingManager()

    def __str__(self):
        return f"Room {self.room_id} booked by {self.visitor_name} from {self.start_datetime} to {self.end_datetime}"

    def save(self, *args, **kwargs):
        # Calculate actual_end_datetime right before saving to the DB
        if not self.recurrence_rule:
            self.actual_end_datetime = self.end_datetime
        else:
            try:
                rrule_upper = self.recurrence_rule.upper()
                is_infinite = "UNTIL=" not in rrule_upper and "COUNT=" not in rrule_upper
                if is_infinite:
                    # Safely store NULL in the database so it never auto-completes
                    self.actual_end_datetime = None
                else:
                    from django.conf import settings
                    local_tz = zoneinfo.ZoneInfo(settings.TIME_ZONE)
                    start_local = self.start_datetime.astimezone(local_tz)
                    rule = rrulestr(self.recurrence_rule, dtstart=start_local)
                    last_occurrence_local = rule[-1]
                    duration = self.end_datetime - self.start_datetime
                    self.actual_end_datetime = last_occurrence_local + duration
            except Exception as e:
                logger.error(f"Failed to calculate rrule for booking: {e}")
                self.actual_end_datetime = self.end_datetime

        super().save(*args, **kwargs)
