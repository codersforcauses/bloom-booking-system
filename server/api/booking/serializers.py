from rest_framework import serializers
from .models import Booking
from api.room.models import Room
from .google_calendar.events import create_event, update_event, delete_event
from googleapiclient.errors import HttpError
import logging

logger = logging.getLogger(__name__)


class DynamicFieldsModelSerializer(serializers.ModelSerializer):

    def __init__(self, *args, **kwargs):
        # removes fields from kwargs
        fields = kwargs.pop('fields', None)

        super().__init__(*args, **kwargs)

        if fields is not None:
            allowed = set(fields)
            existing = set(self.fields)
            for field_name in existing - allowed:
                self.fields.pop(field_name)


class RoomShortSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ['id', 'name']


class BookingSerializer(DynamicFieldsModelSerializer):
    room = RoomShortSerializer(read_only=True)          # for nested output
    room_id = serializers.PrimaryKeyRelatedField(
        queryset=Room.objects.all(),
        source='room',
        write_only=True
    )

    class Meta:
        model = Booking
        fields = '__all__'
        read_only_fields = ['google_event_id']      # google_event_id cannot be set from clients

    def create(self, validated_data):
        booking = super().create(validated_data)
        event_data = self._build_event_data(booking)
        try:
            created_event = create_event(event_data)
            booking.google_event_id = created_event["id"]
            booking.save(update_fields=["google_event_id"])
        except HttpError as error:
            logger.error(f"Google Calendar creation fails: {error}")
        except Exception as error:
            logger.error(f"Unexpected error while creating Google Calendar event: {error}")
        return booking

    def update(self, instance, validated_data):
        booking = super().update(instance, validated_data)
        if booking.google_event_id:
            event_data = self._build_event_data(booking)
            try:
                update_event(booking.google_event_id, event_data)
            except HttpError as error:
                logger.error(f"Google Calendar update fails: {error}")
            except Exception as error:
                logger.error(f"Unexpected error while updating Google Calendar event: {error}")
        return booking

    def delete(self, instance):
        if instance.google_event_id:
            try:
                delete_event(instance.google_event_id)
            except HttpError as error:
                logger.error(f"Google Calendar deletion fails: {error}")
            except Exception as error:
                logger.error(f"Unexpected error while deleting Google Calendar event: {error}")
        instance.delete()

    def _build_event_data(self, booking):
        return {
            "summary": f"Booking of {booking.room.name} - {booking.visitor_name}",
            "description": "Booking confirmed",
            "start": {
                "dateTime": booking.start_datetime.isoformat(),
                "timeZone": "Australia/Perth",
            },
            "end": {
                "dateTime": booking.end_datetime.isoformat(),
                "timeZone": "Australia/Perth",
            },
            "recurrence": [f"RRULE:{booking.recurrence_rule}"] if booking.recurrence_rule else []
        }


# though dynamic fields are supported, define a separate serializer for list view for reusability
class BookingListSerializer(BookingSerializer):
    class Meta:
        model = Booking
        fields = ('id', 'room', 'room_id', 'visitor_name', 'visitor_email', 'start_datetime', 'end_datetime',
                  'recurrence_rule', 'status', 'google_event_id', 'created_at')
        read_only_fields = ['google_event_id']
