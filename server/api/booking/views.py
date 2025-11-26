from django.http import HttpResponse
from rest_framework import generics, permissions
from .models import Booking
from .serializers import BookingSerializer
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError


# GET /api/bookings and POST /api/bookings route
class BookingsListCreatView(generics.ListCreateAPIView):
    serializer_class = BookingSerializer
    http_method_names = ['get', 'post']

    def get_serializer(self, *args, **kwargs):
        # avoid N+1 query problem
        kwargs["fields"] = ('id', 'room', 'room_id', 'visitor_name', 'visitor_email', 'start_datetime', 'end_datetime',
                            'recurrence_rule', 'status', 'google_event_id', 'created_at')
        return super().get_serializer(*args, **kwargs)

    # set permission restrictions (commented as there is no user right now)
    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.IsAdminUser()]
        elif self.request.method == "POST":
            return [permissions.AllowAny()]
        return super().get_permissions()

    def get_queryset(self):
        # reduce data retrieved from database
        queryset = Booking.objects.all().only('id', 'room', 'room_id', 'visitor_name', 'visitor_email', 'start_datetime', 'end_datetime',
                                              'recurrence_rule', 'status', 'google_event_id', 'created_at')
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


# PUT /api/bookings/{id} and DELETE /api/bookings/{id}
class BookingUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    http_method_names = ['put', 'delete']

    def update(self, request, *args, **kwargs):
        partial = True      # allow partial update
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        response_serializer = BookingSerializer(instance, fields=('id', 'status', 'updated_at'))
        return Response(response_serializer.data)

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


# GET /api/bookings/search
class BookingSearchView(generics.ListAPIView):
    serializer_class = BookingSerializer
    http_method_names = ['get']

    def get_serializer(self, *args, **kwargs):
        # same as GET /api/bookings
        kwargs["fields"] = ('id', 'room', 'room_id', 'visitor_name', 'visitor_email', 'start_datetime', 'end_datetime',
                            'recurrence_rule', 'status', 'google_event_id', 'created_at')
        return super().get_serializer(*args, **kwargs)

    def get_queryset(self):
        queryset = Booking.objects.all().only('id', 'room', 'room_id', 'visitor_name', 'visitor_email', 'start_datetime', 'end_datetime',
                                              'recurrence_rule', 'status', 'google_event_id', 'created_at')
        visitor_email = self.request.query_params.get('visitor_email')

        if not visitor_email:
            raise ValidationError({
                "status": "error",
                "message": "visitor_email is required"
            })
        queryset = queryset.filter(visitor_email__iexact=visitor_email)
        return queryset


# /test route
def test(request):
    return HttpResponse("Hello, Django!")
