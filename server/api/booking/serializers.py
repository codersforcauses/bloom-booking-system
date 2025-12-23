from rest_framework import serializers
from .models import Booking
from api.room.models import Room


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
        # google_event_id cannot be set from clients
        read_only_fields = ['google_event_id']

    # visitor emial is not editable in a serializer level
    def validate_visitor_email(self, value):
        if self.instance and value != self.instance.visitor_email:
            raise serializers.ValidationError("Visitor email is not editable.")
        return value

    def validate(self, data):
        """Validate that end_datetime is greater than start_datetime."""
        start_datetime = data.get('start_datetime')
        end_datetime = data.get('end_datetime')

        # For updates, get existing values if not provided
        if self.instance:
            start_datetime = start_datetime or self.instance.start_datetime
            end_datetime = end_datetime or self.instance.end_datetime

        if start_datetime and end_datetime:
            if end_datetime <= start_datetime:
                raise serializers.ValidationError({
                    'end_datetime': 'End datetime must be greater than start datetime.'
                })

        return data


# though dynamic fields are supported, define a separate serializer for list view for reusability
class BookingListSerializer(BookingSerializer):
    class Meta:
        model = Booking
        fields = ('id', 'room', 'room_id', 'visitor_name', 'visitor_email', 'start_datetime', 'end_datetime',
                  'recurrence_rule', 'status', 'google_event_id', 'created_at')
        read_only_fields = ['google_event_id']
