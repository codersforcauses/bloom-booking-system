from rest_framework import serializers
from .models import Booking
from api.room.models import Room


class RoomShortSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ["id", "name"]


class BookingSerializer(serializers.ModelSerializer):
    room = RoomShortSerializer(read_only=True)          # for nested output
    room_id = serializers.PrimaryKeyRelatedField(
        queryset=Room.objects.all(),
        source="room",
        write_only=True
    )

    class Meta:
        model = Booking
        fields = ['id', 'room', 'room_id', 'visitor_name', 'visitor_email',
                  'start_datetime', 'end_datetime', 'recurrence_rule',
                  'status', 'google_event_id', 'created_at']
