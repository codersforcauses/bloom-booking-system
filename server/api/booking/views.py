from rest_framework import generics, permissions
from .models import Booking
from .serializers import BookingSerializer, BookingListSerializer
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django_filters.rest_framework import DjangoFilterBackend
import django_filters


# For admin to filter booking in /api/bookings
class ListBookingFilter(django_filters.FilterSet):
    room_id = django_filters.NumberFilter()
    date = django_filters.DateFilter(field_name='start_datetime', lookup_expr='date')
    visitor_name = django_filters.CharFilter(lookup_expr='icontains')       # contain + case insensitive
    visitor_email = django_filters.CharFilter(lookup_expr='iexact')         # exact + case insensitive

    class Meta:
        model = Booking
        fields = ["room_id", "date", "visitor_name", "visitor_email"]


# GET /api/bookings and POST /api/bookings route
class BookingsListCreateView(generics.ListCreateAPIView):
    queryset = Booking.objects.select_related("room")
    serializer_class = BookingListSerializer
    http_method_names = ['get', 'post']
    filter_backends = [DjangoFilterBackend]
    filterset_class = ListBookingFilter

    # set permission restrictions
    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.IsAdminUser()]
        elif self.request.method == "POST":
            return [permissions.AllowAny()]
        return super().get_permissions()

    def get_queryset(self):
        queryset = Booking.objects.select_related("room")   # optimize performance with foreign key

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
