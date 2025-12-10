from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework.exceptions import MethodNotAllowed
from .models import Room
from .serializers import RoomSerializer


# Viewset is library that provides CRUD operations for api
# Admin have create update delete permissions everyone can read
# get request can filter by name, location_id, capacity_id for get

# per issue thing:
# Update has custom response with id name updated_at
# Delete has custom response message
class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer

    def get_permissions(self):
        if self.action in ["create", "update"]:
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
            qs = qs.filter(location__name__icontains=location_name)

        if cap := params.get("capacity"):
            qs = qs.filter(capacity__gte=cap)

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
