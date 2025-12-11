from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework.exceptions import MethodNotAllowed
from rest_framework.pagination import PageNumberPagination
from .models import Room, Location, Amenities
from .serializers import RoomSerializer, LocationSerializer, AmenitiesSerializer

# Viewset is library that provides CRUD operations for api
# Admin have create update delete permissions everyone can read
# get request can filter by name, location_id, capacity_id for get

# per issue thing:
# Update has custom response with id name updated_at
# Delete has custom response message


class RoomPagination(PageNumberPagination):
    page_size = 10  # Change as needed


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    pagination_class = RoomPagination

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_serializer_class(self):
        return RoomSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params

        if name := params.get("name"):
            qs = qs.filter(name__icontains=name)

        if location_name := params.get("location"):
            qs = qs.filter(location_id__name__icontains=location_name)

        if min_cap := params.get("min_capacity"):
            qs = qs.filter(capacity__gte=min_cap)

        if max_cap := params.get("max_capacity"):
            qs = qs.filter(capacity__lte=max_cap)

        if min_datetime := params.get("min_datetime"):
            qs = qs.filter(start_datetime__gte=min_datetime)

        if max_datetime := params.get("max_datetime"):
            qs = qs.filter(end_datetime__lte=max_datetime)

        # Filter by amenity name (case-insensitive, supports multiple names comma-separated)
        if amenity_names := params.get("amenity"):
            names = [n.strip() for n in amenity_names.split(",") if n.strip()]
            if names:
                for n in names:
                    qs = qs.filter(amenities_id__name__iexact=n)
                qs = qs.distinct()

        if not self.request.user.is_authenticated:
            qs = qs.filter(is_active=True)

        return qs

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(
            instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        raise MethodNotAllowed("DELETE")


class LocationViewSet(viewsets.ModelViewSet):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]


class AmenitiesViewSet(viewsets.ModelViewSet):
    queryset = Amenities.objects.all()
    serializer_class = AmenitiesSerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]
