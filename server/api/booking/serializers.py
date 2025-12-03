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
        read_only_fields = ['google_event_id']      # google_event_id cannot be set from clients

    # Todo: integrate with helper functions for Google Calendar API
    def create(self, validated_data):
        validated_data['google_event_id'] = 'to_be_implemented'
        return super().create(validated_data)
