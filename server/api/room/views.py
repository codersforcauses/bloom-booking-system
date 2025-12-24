from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework import status
from .models import Room, Location, Amenity
from .serializers import RoomSerializer, LocationSerializer, AmenitySerializer
from .filters import RoomFilter
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter, SearchFilter
# Viewset is library that provides CRUD operations for api
# Admin have create update delete permissions everyone can read
# get request can filter by name, location, capacity for get

# per issue thing:
# Update has custom response with id name updated_at
# Delete has custom response message


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter, SearchFilter]
    filterset_class = RoomFilter

    # Ordering: Allow users to order by these fields
    ordering_fields = ['name', 'capacity',
                       'created_at', 'updated_at', 'location__name']
    ordering = ['name']  # Default ordering by room name

    # Search: Allow users to search across these fields
    search_fields = ['name', 'location__name', 'location__address']

    http_method_names = ["get", "post", "patch"]

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        qs = super().get_queryset()

        # Only show active rooms to unauthenticated users
        # Authenticated users (admin) can see all rooms including inactive ones
        if not self.request.user.is_authenticated:
            qs = qs.filter(is_active=True)

        return qs


class LocationViewSet(viewsets.ModelViewSet):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    http_method_names = ["get", "post", "patch", "delete"]

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def destroy(self, request, *args, **kwargs):
        """
        Prevent deletion of locations that are currently used by rooms.
        """
        instance = self.get_object()

        # Check if any rooms are using this location
        rooms_using_location = Room.objects.filter(location=instance)
        if rooms_using_location.exists():
            room_names = list(
                rooms_using_location.values_list('name', flat=True))
            return Response(
                {
                    "detail": f"Cannot delete location '{instance.name}'. It is currently used by the following rooms: {', '.join(room_names)}",
                    "rooms_using_location": room_names
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # If no rooms are using this location, proceed with deletion
        return super().destroy(request, *args, **kwargs)


class AmenityViewSet(viewsets.ModelViewSet):
    queryset = Amenity.objects.all()
    serializer_class = AmenitySerializer
    http_method_names = ["get", "post", "patch", "delete"]

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def destroy(self, request, *args, **kwargs):
        """
        Prevent deletion of amenities that are currently used by rooms.
        """
        instance = self.get_object()

        # Check if any rooms are using this amenity
        rooms_using_amenity = Room.objects.filter(amenities=instance)
        if rooms_using_amenity.exists():
            room_names = list(
                rooms_using_amenity.values_list('name', flat=True))
            return Response(
                {
                    "detail": f"Cannot delete amenity '{instance.name}'. It is currently used by the following rooms: {', '.join(room_names)}",
                    "rooms_using_amenity": room_names
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # If no rooms are using this amenity, proceed with deletion
        return super().destroy(request, *args, **kwargs)
