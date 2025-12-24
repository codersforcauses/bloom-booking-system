from rest_framework import serializers
from django.utils import timezone
from .models import Booking
from api.room.models import Room
import re


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
        # google_event_id and status cannot be set from clients
        read_only_fields = ['google_event_id', 'status']

    # visitor email is not editable in a serializer level
    def validate_visitor_email(self, value):
        if self.instance and value != self.instance.visitor_email:
            raise serializers.ValidationError(
                "The visitor email cannot be changed.")
        return value

    def validate(self, data):
        """Validate that end_datetime is greater than start_datetime and handle cancel_reason logic."""
        start_datetime = data.get('start_datetime')
        end_datetime = data.get('end_datetime')
        recurrence_rule = data.get('recurrence_rule')
        room = data.get('room')

        # For updates, get existing values if not provided
        if self.instance:
            start_datetime = start_datetime or self.instance.start_datetime
            end_datetime = end_datetime or self.instance.end_datetime
            room = room or self.instance.room
            recurrence_rule = recurrence_rule or self.instance.recurrence_rule

        # For new bookings, ensure start_datetime is in the future
        if not self.instance and start_datetime:
            if start_datetime <= timezone.now():
                raise serializers.ValidationError({
                    'start_datetime': 'Booking start time must be in the future.'
                })

        if start_datetime and end_datetime:
            if end_datetime <= start_datetime:
                raise serializers.ValidationError({
                    'end_datetime': 'End datetime must be greater than start datetime.'
                })

            # Ensure booking start and end are on the same day
            if start_datetime.date() != end_datetime.date():
                raise serializers.ValidationError({
                    'non_field_errors': [
                        'Booking start and end times must be on the same day. '
                        f'Start date: {start_datetime.date()}, End date: {end_datetime.date()}'
                    ]
                })

        # Check for overlapping bookings in the same room
        if room and start_datetime and end_datetime:
            overlapping_bookings = Booking.objects.filter(
                room=room,
                # Exclude cancelled bookings
                status__in=['CONFIRMED', 'COMPLETED'],
                start_datetime__lt=end_datetime,  # Existing booking starts before this one ends
                end_datetime__gt=start_datetime   # Existing booking ends after this one starts
            )

            # For updates, exclude the current booking being updated
            if self.instance:
                overlapping_bookings = overlapping_bookings.exclude(
                    id=self.instance.id)

            if overlapping_bookings.exists():
                overlapping_booking = overlapping_bookings.first()
                raise serializers.ValidationError({
                    'non_field_errors': [
                        f'Room is already booked from {overlapping_booking.start_datetime.strftime("%Y-%m-%d %H:%M")} '
                        f'to {overlapping_booking.end_datetime.strftime("%Y-%m-%d %H:%M")} '
                        f'by {overlapping_booking.visitor_name}.'
                    ]
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

    def save(self, **kwargs):
        """Override save to handle status logic after validation."""
        cancel_reason = self.validated_data.get('cancel_reason')
        if cancel_reason and cancel_reason.strip():
            # Set status to CANCELLED when cancel_reason is provided
            if self.instance:
                self.instance.status = 'CANCELLED'
            else:
                # For creation, set the status before saving
                self.validated_data['status'] = 'CANCELLED'

        return super().save(**kwargs)


# though dynamic fields are supported, define a separate serializer for list view for reusability
class BookingListSerializer(BookingSerializer):
    class Meta:
        model = Booking
        fields = ('id', 'room', 'room_id', 'visitor_name', 'visitor_email', 'start_datetime', 'end_datetime',
                  'recurrence_rule', 'status', 'google_event_id', 'created_at')
        read_only_fields = ['google_event_id', 'status']
