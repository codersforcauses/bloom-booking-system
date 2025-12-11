from rest_framework import serializers
from .models import Room, Amenities, Location


class AmenitiesSerializer(serializers.ModelSerializer):
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
    location = LocationSerializer(source='location_id', read_only=True)
    amenities = AmenitiesSerializer(
        many=True, source='amenities_id', read_only=True)
    location_id = serializers.PrimaryKeyRelatedField(
        queryset=Location.objects.all(), write_only=True)
    amenities_id = serializers.PrimaryKeyRelatedField(
        queryset=Amenities.objects.all(), many=True, write_only=True)

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
        if start and end and end <= start:
            raise serializers.ValidationError({
                'end_datetime': 'End datetime must be after start datetime.'
            })
        return data
