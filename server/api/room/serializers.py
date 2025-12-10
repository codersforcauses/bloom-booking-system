from rest_framework import serializers
from .models import Room, Amenities, Location


class AmenitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Amenities
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

    class Meta:
        model = Room
        fields = [
            "id",
            "name",
            "img",
            "location",
            "capacity",
            "amenities",
            "start_datetime",
            "end_datetime",
            "recurrence_rule",
            "is_active",
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
