from rest_framework import permissions
from .models import Booking
from .serializers import BookingSerializer, BookingListSerializer
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django_filters.rest_framework import DjangoFilterBackend
import django_filters
from rest_framework import viewsets
from rest_framework.decorators import action
from .google_calendar.events import create_event, update_event, delete_event
from googleapiclient.errors import HttpError
import logging

logger = logging.getLogger(__name__)


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
    http_method_names = ["get", "post", "patch"]        # PUT and DELETE is forbiddened

    # for put and delete methods, use BookingSerializer for customization
    def get_serializer_class(self):
        if self.request.method == "GET" or self.request.method == "POST":
            return BookingListSerializer
        return BookingSerializer

    def get_permissions(self):
        # GET /api/bookings/ (admin only)
        if self.action == "list":
            return [permissions.IsAuthenticated()]

        # GET /bookings/{id}/ (when no visitor_email provided, admin only)
        if self.action == "retrieve":
            visitor_email = self.request.query_params.get("visitor_email")
            if not visitor_email:
                return [permissions.IsAuthenticated()]
            return [permissions.AllowAny()]

        # POST/PUT/PATCH/DELETE (everyone)
        return [permissions.AllowAny()]

    def get_queryset(self):
        queryset = Booking.objects.select_related("room")
        visitor_email = self.request.query_params.get('visitor_email')

        # GET /bookings/{id}/:
        # when visitor_email provided, send the booking detail only if visitor_email and id match
        if self.action == "retrieve":
            if visitor_email:
                queryset = queryset.filter(visitor_email__iexact=visitor_email)

        # PATCh /bookings/{id}:
        # when visitor_email is not provided as a parameter, raise an 400 error;
        # if it is provided but does not match the booking, raise an 404 NOT FOUND error (so the user cannot guess whether the booking exists or not);
        if self.action == "partial_update":
            if not visitor_email:
                raise ValidationError({"detail": "Visitor email is required."})
            queryset = queryset.filter(visitor_email__iexact=visitor_email)

        return queryset

    # custom create logic to integrate Google calendar api
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking = serializer.save()

        event_data = self._build_event_data(booking)
        try:
            created_event = create_event(event_data)
            booking.google_event_id = created_event["id"]
            booking.save(update_fields=["google_event_id"])
        except HttpError as error:
            logger.error(f"Google Calendar creation fails: {error}")
        except Exception as error:
            logger.error(
                f"Unexpected error while creating Google Calendar event: {error}"
            )

        return Response(serializer.data, status=201)

    # custom PATCH (including both booking update and deletion)
    def partial_update(self, request, *args, **kwargs):
        partial = True
        instance = self.get_object()
        visitor_email = request.data.get('visitor_email')

        # If cancel_reason is provided (cancel_reason is not NULL / "" / composed of spaces), it will be booking deletion action
        cancel_reason = request.data.get('cancel_reason')
        if cancel_reason and cancel_reason.strip():
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
            booking = serializer.save()

            # for deletion action, delete google_event_id
            if booking.google_event_id:
                try:
                    delete_event(instance.google_event_id)
                except HttpError as error:
                    logger.error(f"Google Calendar deletion fails: {error}")
                except Exception as error:
                    logger.error(f"Unexpected error while deleting Google Calendar event: {error}")
            booking.google_event_id = None
            booking.save(update_fields=["google_event_id"])

            response_fields = ('id', 'status', 'cancel_reason', 'updated_at')

        # else, it is partial update
        else:
            status = request.data.get('status')
            if status == "CANCELLED" and not cancel_reason:
                raise ValidationError({
                    "detail": "Cancel reason is necessary to cancel a booking."
                    })

            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            serializer.is_valid(raise_exception=True)
            booking = serializer.save()

            if booking.google_event_id:
                event_data = self._build_event_data(booking)
                try:
                    update_event(booking.google_event_id, event_data)
                except HttpError as error:
                    logger.error(f"Google Calendar update fails: {error}")
                except Exception as error:
                    logger.error(f"Unexpected error while updating Google Calendar event: {error}")

            response_fields = ('id', 'status', 'updated_at')

        response_serializer = BookingSerializer(booking, fields=response_fields)
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

    # helper method for google calendar data construction
    def _build_event_data(self, booking):
        return {
            "summary": f"Booking of {booking.room.name} - {booking.visitor_name}",
            "description": "Booking confirmed",
            "start": {
                "dateTime": booking.start_datetime.isoformat(),
                "timeZone": "Australia/Perth",
            },
            "end": {
                "dateTime": booking.end_datetime.isoformat(),
                "timeZone": "Australia/Perth",
            },
            "recurrence": [f"RRULE:{booking.recurrence_rule}"] if booking.recurrence_rule else []
        }
