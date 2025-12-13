from rest_framework import permissions
from .models import Booking
from .serializers import BookingSerializer, BookingListSerializer
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django_filters.rest_framework import DjangoFilterBackend
import django_filters
from rest_framework import viewsets
from rest_framework.decorators import action


# For admin to filter booking in /api/bookings
class ListBookingFilter(django_filters.FilterSet):
    room_id = django_filters.NumberFilter()
    date = django_filters.DateFilter(field_name='start_datetime', lookup_expr='date')
    visitor_name = django_filters.CharFilter(lookup_expr='icontains')       # contain + case insensitive
    visitor_email = django_filters.CharFilter(lookup_expr='iexact')         # exact + case insensitive

    class Meta:
        model = Booking
        fields = ["room_id", "date", "visitor_name", "visitor_email"]


class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.select_related("room")   # for better performance
    filter_backends = [DjangoFilterBackend]
    filterset_class = ListBookingFilter
    http_method_names = ["get", "post", "put", "patch", "delete"]

    # for put and delete methods, use BookingSerializer for customization
    def get_serializer_class(self):
        if self.request.method == "GET" or self.request.method == "POST":
            return BookingListSerializer
        return BookingSerializer

    def get_permissions(self):
        # GET /api/bookings/ (admin only)
        if self.action == "list":
            return [permissions.IsAdminUser()]

        # GET /bookings/{id}/ (when no visitor_email provided, admin only)
        if self.action == "retrieve":
            visitor_email = self.request.query_params.get("visitor_email")
            if not visitor_email:
                return [permissions.IsAdminUser()]
            return [permissions.AllowAny()]

        # POST/PUT/PATCH/DELETE (everyone)
        return [permissions.AllowAny()]

    def get_queryset(self):
        queryset = Booking.objects.select_related("room")

        # GET /bookings/{id}/ (when visitor_email provided, send the booking detail only if visitor_email and id match)
        if self.action == "retrieve":
            visitor_email = self.request.query_params.get('visitor_email')
            if visitor_email:
                queryset = queryset.filter(visitor_email__iexact=visitor_email)

        return queryset

    # custom PUT
    def update(self, request, *args, **kwargs):
        partial = True      # allow partial update
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        response_serializer = BookingSerializer(instance, fields=('id', 'status', 'updated_at'))
        return Response(response_serializer.data)

    # custom PATCH
    def partial_update(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)

    # custom DELETE
    def destroy(self, request, *args, **kwargs):
        partial = True
        instance = self.get_object()

        visitor_email = request.data.get('visitor_email')
        cancel_reason = request.data.get('cancel_reason')
        if visitor_email and visitor_email != instance.visitor_email:
            raise ValidationError({
                "detail": "Visitor email is incorrect."
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

    # custom search
    @action(detail=False, methods=["get"], url_path="search")
    def search(self, request):
        visitor_email = self.request.query_params.get('visitor_email')

        if not visitor_email:
            raise ValidationError({
                "detail": "visitor_email is required"
            })

        queryset = self.queryset.filter(visitor_email__iexact=visitor_email)
        # have to apply pagination manually
        page = self.paginate_queryset(queryset)
        serializer = BookingListSerializer(page, many=True)
        return self.get_paginated_response(serializer.data)
