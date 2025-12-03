from rest_framework import viewsets, permissions
from rest_framework.response import Response
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
        if self.action in ["create", "update", "destroy"]:
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params

        if name := params.get("name"):
            qs = qs.filter(name__icontains=name)

        if loc := params.get("location_id"):
            qs = qs.filter(location_id=loc)

        if cap := params.get("capacity_id"):
            qs = qs.filter(capacity_id=cap)

        return qs

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response({
            "id": instance.id,
            "name": instance.name,
            "updated_at": instance.updated_at
        })

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response({"message": "Room deleted successfully"})
