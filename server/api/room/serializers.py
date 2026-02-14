from rest_framework import serializers
from .models import Room, Amenity, Location
from api.booking.models import Booking
import re


class AmenitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Amenity
        fields = ["id", "name"]
        read_only_fields = ['id']


class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ["id", "name"]
        read_only_fields = ['id']


class RoomSerializer(serializers.ModelSerializer):
    location = LocationSerializer(read_only=True)
    amenities = AmenitySerializer(many=True, read_only=True)
    location_id = serializers.PrimaryKeyRelatedField(
        queryset=Location.objects.all(), write_only=True, source='location'
    )
    amenities_id = serializers.PrimaryKeyRelatedField(
        queryset=Amenity.objects.all(), many=True, write_only=True, source='amenities'
    )

    class Meta:
        model = Room
        fields = [
            "id",
            "name",
            "img",
            "location",
            "location_id",
            "capacity",
            "amenities",
            "amenities_id",
            "start_datetime",
            "end_datetime",
            "recurrence_rule",
            "is_active",
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, data):
        start = data.get('start_datetime') or getattr(
            self.instance, 'start_datetime', None)
        end = data.get('end_datetime') or getattr(
            self.instance, 'end_datetime', None)
        recurrence_rule = data.get('recurrence_rule') or getattr(
            self.instance, 'recurrence_rule', None)

        if start and end and end <= start:
            raise serializers.ValidationError({
                'end_datetime': 'End datetime must be after start datetime.'
            })

        # Validate recurrence_rule (Google Calendar RFC 5545 format)
        if recurrence_rule:
            # Basic RFC 5545 RRULE validation: must start with FREQ= and contain valid frequency
            freq_pattern = r'^FREQ=(DAILY|WEEKLY|MONTHLY|YEARLY)(;.*)?$'
            if not re.match(freq_pattern, recurrence_rule):
                raise serializers.ValidationError({
                    'recurrence_rule': 'Recurrence rule must start with FREQ= and use a valid frequency (DAILY, WEEKLY, MONTHLY, YEARLY).'
                })

        return data

    # Block PATCH requests from making an active room inactive if it has bookings
    def validate_is_active(self, value):
        if self.instance and value is False and self.instance.is_active is True:
            uncompleted_bookings_exist = Booking.objects.filter(
                room_id=self.instance.id,
                status="CONFIRMED"
                ).exists()
            if uncompleted_bookings_exist:
                raise serializers.ValidationError(
                    "Cannot change room status to inactive while there are uncompleted bookings."
                )
        return value
