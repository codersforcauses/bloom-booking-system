from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework import status
from .models import Room, Location, Amenity
from .serializers import RoomSerializer, LocationSerializer, AmenitySerializer
from .filters import RoomFilter
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.decorators import action
from django.db.models import Q
from django.utils.dateparse import parse_date
from dateutil.rrule import rruleset, rrulestr
from api.booking.models import Booking
from datetime import datetime, time
from django.utils.timezone import localdate, make_aware, localtime
from collections import defaultdict
# Viewset is library that provides CRUD operations for api
# Admin have create update delete permissions everyone can read
# get request can filter by name, location, capacity for get

# per issue thing:
# Update has custom response with id name updated_at
# Delete has custom response message


# Helper function to expand recurrence rules
def _expand_recurrences(base_start_datetime, rrule_str, rdate_list=None, exdate_list=None):
    rrule_set = rruleset()
    if rrule_str:
        rrule_set.rrule(rrulestr(rrule_str, dtstart=base_start_datetime))
    if rdate_list:
        for dt in rdate_list:
            rrule_set.rdate(dt)
    if exdate_list:
        for dt in exdate_list:
            rrule_set.exdate(dt)
    return rrule_set


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter, SearchFilter]
    filterset_class = RoomFilter

    # Ordering: Allow users to order by these fields
    ordering_fields = ['name', 'capacity',
                       'created_at', 'updated_at', 'location__name']
    ordering = ['name']  # Default ordering by room name

    # Search: Allow users to search across these fields
    search_fields = ['name', 'location__name', 'location__address']

    http_method_names = ["get", "post", "patch"]

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        qs = super().get_queryset()

        # Only show active rooms to unauthenticated users
        # Authenticated users (admin) can see all rooms including inactive ones
        if not self.request.user.is_authenticated:
            qs = qs.filter(is_active=True)

        return qs

    @action(detail=True, methods=["get"], url_path="availability")
    def availability(self, request, pk=None):
        """
        Get availability for a specific room within a date range.
        Returns: JSON response with room ID and availability slots.
        """
        room = self.get_object()
        # If a room is inactive, it has no availability.
        if not room.is_active:
            return Response({"room_id": room.id, "availability": []}, status=200)

        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")
        if not start_date or not end_date:
            return Response({"detail": "start_date and end_date are required"}, status=400)

        start_date = parse_date(start_date)
        end_date = parse_date(end_date)

        today = localdate()

        # Update start_date to be today if it's in the past (assume availability is meaningless in the past)
        if start_date < today:
            start_date = today

        # If the date range is invalid or end_date is in the past, return empty
        if start_date > end_date or end_date < today:
            return Response({"room_id": room.id, "availability": []}, status=200)

        availability = self._calculate_availability(room, start_date, end_date)
        return Response({"room_id": room.id, "availability": availability}, status=200)

    def _calculate_availability(self, room, start_date, end_date):
        """
        Private method to calculate room availability.
        - Calculate available slots based on recurrence rules.
        - Subtract booked slots from available slots.
        Assumption: Room starttime and endtime are on the same day.
        """
        # Step 1: get all slots that have been booked
        booked_slots = []
        bookings = Booking.objects.filter(room=room).filter(
            Q(recurrence_rule__isnull=False) |  # include all bookings with recurrence rules
            Q(start_datetime__lt=make_aware(datetime.combine(end_date, time.max)),
              end_datetime__gt=make_aware(datetime.combine(start_date, time.min)))  # include overlapping bookings without recurrence rules
              )

        for booking in bookings:
            duration = booking.end_datetime - booking.start_datetime
            if booking.recurrence_rule:
                booking_recurrence_rule = booking.recurrence_rule   # split into rrule, rdate_list, exdate_list if needed
                booking_occurrences = _expand_recurrences(
                    booking.start_datetime,
                    booking_recurrence_rule,
                ).between(
                    make_aware(datetime.combine(start_date, time.min)),
                    make_aware(datetime.combine(end_date, time.max))
                )
                for occurence_start in booking_occurrences:
                    booked_slots.append((occurence_start, occurence_start + duration))
            else:
                booked_slots.append((booking.start_datetime, booking.end_datetime))

        # Step 2: get all available slots based on room's recurrence rules
        availability_slots = defaultdict(list)
        if not room.recurrence_rule:
            available_date = room.start_datetime.date()
            if start_date <= available_date <= end_date:
                self.add_free_intervals(
                    availability_slots,
                    room.start_datetime,
                    room.end_datetime,
                    booked_slots
                )
        else:
            room_recurrence_rule = room.recurrence_rule   # split into rrule, rdate_list, exdate_list if needed
            room_occurrences = _expand_recurrences(
                    room.start_datetime,
                    room_recurrence_rule,
                ).between(
                    make_aware(datetime.combine(start_date, time.min)),
                    make_aware(datetime.combine(end_date, time.max))
                )
            for occurrence_start in room_occurrences:
                duration = room.end_datetime - room.start_datetime
                occurrence_end = occurrence_start + duration
                self.add_free_intervals(
                    availability_slots,
                    occurrence_start,
                    occurrence_end,
                    booked_slots
                )

        return [{"date": date, "slots": slots} for date, slots in sorted(availability_slots.items())]

    # Helper function to subtract booked slots from room availability
    def _subtract_booked_from_room_availability(self, room_start, room_end, booked_slots):
        booked_slots = sorted(booked_slots, key=lambda x: x[0])
        free_intervals = []
        current_start = room_start
        for b_start, b_end in booked_slots:
            # Skip bookings that end before current_start
            if b_end <= current_start:
                continue
            # If booking starts after current_start, add the slot to free_intervals
            if b_start > current_start:
                free_intervals.append((current_start, min(b_start, room_end)))
            # If b_end > current_start, move current_start forward
            current_start = max(current_start, b_end)
            # If current_start reaches room_end, end the loop
            if current_start >= room_end:
                break
        # Add any remaining free interval after lastest booking
        if current_start < room_end:
            free_intervals.append((current_start, room_end))
        return free_intervals

    # Helper function to add free intervals to availability_slots
    def add_free_intervals(self, availability_slots, room_start, room_end, booked_slots):
        """
        Subtract booked slots from a room interval and add the resulting free intervals
        to the availability_slots dict (grouped by local date).
        Assumption: room_start and room_end are on the same day.
        """
        # Filter only overlapping bookings
        overlapping_bookings = [
            (b_start, b_end)
            for b_start, b_end in booked_slots
            if b_end > room_start and b_start < room_end
        ]
        # Subtract booked intervals
        free_intervals = self._subtract_booked_from_room_availability(room_start, room_end, overlapping_bookings)
        # Append free intervals to availability_slots, grouped by local date
        for fi_start, fi_end in free_intervals:
            date_str = localtime(fi_start).date().isoformat()
            availability_slots[date_str].append({
                "start": localtime(fi_start).isoformat(),
                "end": localtime(fi_end).isoformat()
            })


class LocationViewSet(viewsets.ModelViewSet):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    http_method_names = ["get", "post", "patch", "delete"]

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def destroy(self, request, *args, **kwargs):
        """
        Prevent deletion of locations that are currently used by rooms.
        """
        instance = self.get_object()

        # Check if any rooms are using this location
        rooms_using_location = Room.objects.filter(location=instance)
        if rooms_using_location.exists():
            room_names = list(
                rooms_using_location.values_list('name', flat=True))
            return Response(
                {
                    "detail": f"Cannot delete location '{instance.name}'. It is currently used by the following rooms: {', '.join(room_names)}",
                    "rooms_using_location": room_names
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # If no rooms are using this location, proceed with deletion
        return super().destroy(request, *args, **kwargs)


class AmenityViewSet(viewsets.ModelViewSet):
    queryset = Amenity.objects.all()
    serializer_class = AmenitySerializer
    http_method_names = ["get", "post", "patch", "delete"]

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def destroy(self, request, *args, **kwargs):
        """
        Prevent deletion of amenities that are currently used by rooms.
        """
        instance = self.get_object()

        # Check if any rooms are using this amenity
        rooms_using_amenity = Room.objects.filter(amenities=instance)
        if rooms_using_amenity.exists():
            room_names = list(
                rooms_using_amenity.values_list('name', flat=True))
            return Response(
                {
                    "detail": f"Cannot delete amenity '{instance.name}'. It is currently used by the following rooms: {', '.join(room_names)}",
                    "rooms_using_amenity": room_names
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # If no rooms are using this amenity, proceed with deletion
        return super().destroy(request, *args, **kwargs)
