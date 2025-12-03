from rest_framework import generics, permissions
from .models import Booking
from .serializers import BookingSerializer, BookingListSerializer
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError


# GET /api/bookings and POST /api/bookings route
class BookingsListCreateView(generics.ListCreateAPIView):
    serializer_class = BookingListSerializer
    http_method_names = ['get', 'post']

    # set permission restrictions
    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.IsAdminUser()]
        elif self.request.method == "POST":
            return [permissions.AllowAny()]
        return super().get_permissions()

    def get_queryset(self):
        queryset = Booking.objects.select_related("room")   # optimize performance with foreign key
        room_id = self.request.query_params.get('room_id')
        date = self.request.query_params.get('date')
        visitor_name = self.request.query_params.get('visitor_name')
        visitor_email = self.request.query_params.get('visitor_email')

        # optionally filter by visitor name, email, room name or date
        if room_id:
            queryset = queryset.filter(room_id=room_id)
        if visitor_name:
            queryset = queryset.filter(visitor_name__icontains=visitor_name)    # contain + case insensitive
        if visitor_email:
            queryset = queryset.filter(visitor_email__iexact=visitor_email)     # exact + case insensitive
        if date:        # suppose start datetime and end datetime must be on the same day
            queryset = queryset.filter(start_datetime__date=date)

        return queryset


# GET /api/bookings, PUT/PATCH /api/bookings/{id} and DELETE /api/bookings/{id}
class BookingListUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    http_method_names = ['get', 'put', 'patch', 'delete']

    # use BookingListSerializer for GET and BookingSerializer for PUT and DELETE
    def get_serializer_class(self):
        if self.request.method == "GET":
            return BookingListSerializer
        return BookingSerializer

    # set permission restrictions
    def get_permissions(self):
        # for GET requests without visitor_email, only admin can access
        if self.request.method == "GET" and not self.request.query_params.get('visitor_email'):
            return [permissions.IsAdminUser()]
        else:
            return [permissions.AllowAny()]

    def update(self, request, *args, **kwargs):
        partial = True      # allow partial update
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        response_serializer = BookingSerializer(instance, fields=('id', 'status', 'updated_at'))
        return Response(response_serializer.data)

    # PATCH method
    def partial_update(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        partial = True
        instance = self.get_object()

        visitor_email = request.data.get('visitor_email')
        cancel_reason = request.data.get('cancel_reason')
        if visitor_email and visitor_email != instance.visitor_email:
            raise ValidationError({
                "status": "error",
                "message": "Visitor email is incorrect."
                })

        data = {
            "cancel_reason": cancel_reason,
            "status": "CANCELLED"
        }

        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        response_serializer = BookingSerializer(instance, fields=('id', 'status', "cancel_reason", 'updated_at'))
        return Response(response_serializer.data)

    def get_queryset(self):
        queryset = Booking.objects.select_related("room")
        visitor_email = self.request.query_params.get('visitor_email')

        if self.request.method == "GET":
            if visitor_email:
                queryset = queryset.filter(visitor_email__iexact=visitor_email)

        return queryset


# GET /api/bookings/search
class BookingSearchView(generics.ListAPIView):
    serializer_class = BookingListSerializer
    http_method_names = ['get']

    def get_queryset(self):
        queryset = Booking.objects.select_related("room")
        visitor_email = self.request.query_params.get('visitor_email')

        if not visitor_email:
            raise ValidationError({
                "status": "error",
                "message": "visitor_email is required"
            })

        queryset = queryset.filter(visitor_email__iexact=visitor_email)
        return queryset
