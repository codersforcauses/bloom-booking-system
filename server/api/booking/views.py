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
from django.db import transaction
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
    http_method_names = ["get", "post", "patch"]

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
        """Create booking with Google Calendar integration and transaction rollback."""
        try:
            # Step 1: Validate booking data
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            # Step 2 & 3: Perform both Google Calendar creation and DB save atomically
            with transaction.atomic():
                # Save booking to database first
                booking = serializer.save()

                # Create Google Calendar event
                event_data = self._build_event_data(booking)
                try:
                    created_event = create_event(event_data)
                    booking.google_event_id = created_event["id"]
                    booking.save(update_fields=["google_event_id"])
                except HttpError as error:
                    logger.error(
                        f"Failed to create Google Calendar event: {error}")
                    # This will cause the transaction to rollback
                    raise Exception({
                        "detail": "Failed to create Google Calendar event. Please try again later."
                    })
                except Exception as error:
                    logger.error(
                        f"Failed to create Google Calendar event: {error}")
                    # This will cause the transaction to rollback
                    raise Exception({
                        "detail": "Failed to create Google Calendar event. Please try again later."
                    })

            # If we get here, both Google Calendar and DB creation succeeded
            response_serializer = self.get_serializer(booking)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)

        except ValidationError:
            # Re-raise ValidationError (includes Google Calendar failures)
            raise
        except Exception as error:
            # Handle any other unexpected errors
            logger.error(f"Unexpected error during booking creation: {error}")
            return Response(
                {"detail": f"Failed to create booking. Error: {error}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    # custom PATCH (including both booking update and deletion)
    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        visitor_email = request.data.get('visitor_email')
        if not visitor_email:
            raise ValidationError({
                "detail": "Visitor email is required."
            })

        if visitor_email != instance.visitor_email:
            raise ValidationError({
                "detail": "Visitor email is incorrect."
            })

        cancel_reason = request.data.get('cancel_reason')

        # Check if this is a cancellation request
        if cancel_reason and cancel_reason.strip():
            # Handle cancellation with transaction and Google Calendar deletion
            try:
                with transaction.atomic():
                    # Delete from Google Calendar first, inside the transaction
                    if instance.google_event_id:
                        try:
                            delete_event(instance.google_event_id)
                        except HttpError as error:
                            logger.error(
                                f"Failed to delete Google Calendar event: {error}"
                            )
                            raise Exception(
                                "Failed to delete Google Calendar event. Please try again later."
                            )
                        except Exception as error:
                            logger.error(
                                f"Failed to delete Google Calendar event: {error}"
                            )
                            raise Exception(
                                "Failed to delete Google Calendar event. Please try again later."
                            )

                    # Update database (serializer will auto-set status to CANCELLED)
                    serializer = self.get_serializer(
                        instance, data=request.data, partial=True)
                    serializer.is_valid(raise_exception=True)
                    booking = serializer.save()

                    # Clear Google event ID after successful deletion
                    booking.google_event_id = ""
                    booking.save(update_fields=["google_event_id"])

                    response_serializer = BookingSerializer(booking, fields=(
                        'id', 'status', 'cancel_reason', 'updated_at'))
                    return Response(response_serializer.data)

            except ValidationError:
                raise
            except Exception as error:
                raise ValidationError({
                    "detail": f"Failed to cancel booking. Error: {error}"
                })

        # Regular update (not cancellation)
        try:
            with transaction.atomic():
                # Step 1: Prepare updated booking data but do not save yet
                serializer = self.get_serializer(
                    instance, data=request.data, partial=True)
                serializer.is_valid(raise_exception=True)

                # Step 2: Sync to Google Calendar with updated data before saving
                temp_booking = serializer.update(
                    instance, serializer.validated_data)
                if temp_booking.google_event_id:
                    event_data = self._build_event_data(temp_booking)
                    try:
                        update_event(
                            temp_booking.google_event_id, event_data)
                    except HttpError as error:
                        # Raise exception to trigger rollback
                        logger.error(
                            f"Failed to update Google Calendar event: {error}"
                        )
                        raise Exception(
                            "Failed to update Google Calendar event. Please try again later."
                        )
                    except Exception as error:
                        # Raise exception to trigger rollback
                        logger.error(
                            f"Failed to update Google Calendar event: {error}"
                        )
                        raise Exception(
                            "Failed to update Google Calendar event. Please try again later."
                        )

                # Step 3: Save the booking after successful Google Calendar update using serializer.save()
                updated_booking = serializer.save()

                # If we get here, both Google Calendar and DB updates succeeded
                response_serializer = BookingSerializer(
                    updated_booking, fields=('id', 'status', 'updated_at'))
                return Response(response_serializer.data)

        except ValidationError:
            # Re-raise ValidationError (includes Google Calendar failures)
            raise
        except Exception as error:
            # Handle any other unexpected errors
            logger.error(f"Unexpected error during booking update: {error}")
            return Response(
                {"detail": "Failed to update Google Calendar event. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

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
