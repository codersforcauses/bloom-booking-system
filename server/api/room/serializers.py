from rest_framework import serializers
from .models import Room, Location, Capacity, Amenties

class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ["id", "name"]

class CapacitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Capacity
        fields = ["id", "name"]

class AmenitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Amenties
        fields = ["id", "name"]

# 2 different serialiser because api requirements want more or less details depending on request type
class RoomSerializer(serializers.ModelSerializer):
    location = LocationSerializer(read_only=True)
    capacity = CapacitySerializer(read_only=True)
    amenities = AmenitySerializer(many=True, read_only=True)

    class Meta:
        model = Room
        fields = [
            "id",
            "name",
            "img_url",
            "location",
            "capacity",
            "amenities",
        ]


class RoomListSerializer(serializers.ModelSerializer):
    location = LocationSerializer(read_only=True)
    capacity = CapacitySerializer(read_only=True)
    amenities = AmenitySerializer(many=True, read_only=True)

    class Meta:
        model = Room
        fields = "__all__"
