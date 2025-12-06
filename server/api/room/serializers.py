from rest_framework import serializers
from .models import Room, Amenties


class AmenitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Amenties
        fields = ["id", "name"]

# 2 different serialiser because api requirements want more or less details depending on request type
class RoomSerializer(serializers.ModelSerializer):
    location = serializers.StringRelatedField(read_only=True)
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
        ]


class RoomListSerializer(serializers.ModelSerializer):
    location = serializers.StringRelatedField(read_only=True)
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
            "created_at",
            "updated_at",
        ]

