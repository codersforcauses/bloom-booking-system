from rest_framework import permissions
from .models import Booking
from .serializers import BookingSerializer, BookingListSerializer
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django_filters.rest_framework import DjangoFilterBackend
import django_filters
from rest_framework import viewsets, status
from .google_calendar.events import create_event, update_event, delete_event
from googleapiclient.errors import HttpError
import logging

logger = logging.getLogger(__name__)


# For admin to filter booking in /api/bookings


class ListBookingFilter(django_filters.FilterSet):
    room_id = django_filters.NumberFilter()
    date = django_filters.DateFilter(
        field_name='start_datetime', lookup_expr='date')
    visitor_name = django_filters.CharFilter(
        lookup_expr='icontains')       # contain + case insensitive
    visitor_email = django_filters.CharFilter(
        lookup_expr='iexact')         # exact + case insensitive

    class Meta:
        model = Booking
        fields = ["room_id", "date", "visitor_name", "visitor_email"]


class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.select_related(
        "room")   # for better performance
    filter_backends = [DjangoFilterBackend]
    filterset_class = ListBookingFilter
    # PUT and DELETE is forbiddened
    http_method_names = ["get", "post",  "patch"]

    # for put and delete methods, use BookingSerializer for customization
    def get_serializer_class(self):
        if self.request.method in ["GET", "POST"]:
            return BookingListSerializer
        return BookingSerializer

    def get_permissions(self):
        # GET /api/bookings/ and GET /bookings/{id}/ (when no visitor_email provided, admin only)
        if self.action == "retrieve" or self.action == "list":
            visitor_email = self.request.query_params.get("visitor_email")
            if not visitor_email:
                return [permissions.IsAuthenticated()]
            return [permissions.AllowAny()]

        # POST/PATCH (everyone)
        return [permissions.AllowAny()]

    def get_queryset(self):
        queryset = Booking.objects.select_related("room")

        # GET /bookings/{id}/:
        # when visitor_email provided, send the booking detail only if visitor_email and id match
        if self.action == "retrieve":
            visitor_email = self.request.query_params.get('visitor_email')
            if visitor_email:
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
            response_serializer = self.get_serializer(booking)
            return Response(response_serializer.data, status=201)
        except HttpError as error:
            return Response(
                {"detail": f"Failed to create Google Calendar event. Error: {error}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        except Exception as error:
            return Response(
                {"detail": f"Unexpected error while creating Google Calendar event. Error: {error}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    # helper function for update booking
    def _perform_update(self, request, instance):
        cancel_reason = request.data.get('cancel_reason')
        status = request.data.get('status')
        if status == "CANCELLED" and not cancel_reason:
            raise ValidationError({
                "detail": "Cancel reason is necessary to cancel a booking."
            })

        serializer = self.get_serializer(
            instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        booking = serializer.save()

        if booking.google_event_id:
            event_data = self._build_event_data(booking)
            try:
                update_event(booking.google_event_id, event_data)
            except HttpError as error:
                logger.error(f"Google Calendar update fails: {error}")
            except Exception as error:
                logger.error(
                    f"Unexpected error while updating Google Calendar event: {error}")

        response_serializer = BookingSerializer(
            booking, fields=('id', 'status', 'updated_at'))
        return Response(response_serializer.data)

    # custom PATCH (including both booking update and deletion)
    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        visitor_email = request.data.get('visitor_email')
        if not visitor_email:
            raise ValidationError({
                "detail": "Visitor email is required."
            })

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

            serializer = self.get_serializer(instance, data=data, partial=True)
            serializer.is_valid(raise_exception=True)
            booking = serializer.save()
            # for cancel action, delete google_event_id
            if booking.google_event_id:
                try:
                    delete_event(booking.google_event_id)
                except HttpError as error:
                    logger.error(f"Google Calendar deletion fails: {error}")
                except Exception as error:
                    logger.error(
                        f"Unexpected error while deleting Google Calendar event: {error}")

            booking.google_event_id = ""
            booking.save(update_fields=["google_event_id"])
            response_serializer = BookingSerializer(booking, fields=(
                'id', 'status', 'cancel_reason', 'updated_at'))
            return Response(response_serializer.data)

        # else, it is partial update
        return self._perform_update(request, instance)

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
