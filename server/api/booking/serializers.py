from rest_framework import serializers
from django.utils import timezone
from .models import Booking
from api.room.models import Room
import re
from dateutil.rrule import rruleset, rrulestr
from django.utils.timezone import localtime, make_aware
from datetime import datetime, time
from django.db.models import Q


class DynamicFieldsModelSerializer(serializers.ModelSerializer):

    def __init__(self, *args, **kwargs):
        # removes fields from kwargs
        fields = kwargs.pop('fields', None)

        super().__init__(*args, **kwargs)

        if fields is not None:
            allowed = set(fields)
            existing = set(self.fields)
            for field_name in existing - allowed:
                self.fields.pop(field_name)


class RoomShortSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ['id', 'name']


class BookingSerializer(DynamicFieldsModelSerializer):
    room = RoomShortSerializer(read_only=True)          # for nested output
    room_id = serializers.PrimaryKeyRelatedField(
        queryset=Room.objects.all(),
        source='room',
        write_only=True
    )

    class Meta:
        model = Booking
        fields = '__all__'
        # google_event_id and status cannot be set from clients
        read_only_fields = ['google_event_id', 'status']

    # visitor email is not editable in a serializer level
    def validate_visitor_email(self, value):
        if self.instance and value != self.instance.visitor_email:
            raise serializers.ValidationError(
                "The visitor email cannot be changed.")
        return value

    def validate(self, data):
        """Validate that end_datetime is greater than start_datetime and handle cancel_reason logic."""
        start_datetime = data.get('start_datetime')
        end_datetime = data.get('end_datetime')
        recurrence_rule = data.get('recurrence_rule')
        room = data.get('room')

        # for updates, get existing values if not provided
        if self.instance:
            start_datetime = start_datetime or self.instance.start_datetime
            end_datetime = end_datetime or self.instance.end_datetime
            room = room or self.instance.room
            if 'recurrence_rule' not in data:
                recurrence_rule = self.instance.recurrence_rule

        if room:
            # reject inactive rooms
            if getattr(room, "is_active", True) is False:
                raise serializers.ValidationError({
                    "room_id": "This room is not active."
                })

            # reject bookings past the room's end_datetime (if set)
            room_end = room.end_datetime
            if room_end and end_datetime:
                room_end = timezone.localtime(room_end)
                booking_end = timezone.localtime(end_datetime)

                if booking_end > room_end:
                    raise serializers.ValidationError({
                        "end_datetime": f"Booking ends after the room's end time ({room_end})."
                    })

        # validate recurrence_rule (Google Calendar RFC 5545 format)
        if recurrence_rule:
            # MUST start with FREQ= and have valid values for it (this is to keep consistant with other apis)
            if not re.match(r'^FREQ=(DAILY|WEEKLY|MONTHLY|YEARLY)(;.*)?$', recurrence_rule):
                raise serializers.ValidationError({
                    'recurrence_rule': 'RRULE must start with FREQ= and use DAILY/WEEKLY/MONTHLY/YEARLY.'
                })

            has_count = re.search(r'(?:^|;)COUNT=\d+(?:;|$)',
                                  recurrence_rule) is not None
            has_until = re.search(
                r'(?:^|;)UNTIL=[^;]+(?:;|$)', recurrence_rule) is not None

            # MUST have a COUNT or UNTIL but not both
            if has_count and has_until:
                raise serializers.ValidationError({
                    'recurrence_rule': 'RRULE cannot contain both COUNT and UNTIL.'
                })
            if not has_count and not has_until:
                raise serializers.ValidationError({
                    'recurrence_rule': 'RRULE must contain either COUNT or UNTIL as it must be finite.'
                })

        # for new bookings, ensure start_datetime is in the future
        if not self.instance and start_datetime:
            if start_datetime <= timezone.now():
                raise serializers.ValidationError({
                    'start_datetime': 'Booking start time must be in the future.'
                })

        # ensure booking starts and ends on the same day and that the end time is after the start time
        if start_datetime and end_datetime:
            if end_datetime <= start_datetime:
                raise serializers.ValidationError({
                    'end_datetime': 'End datetime must be greater than start datetime.'
                })

            if start_datetime.date() != end_datetime.date():
                raise serializers.ValidationError({
                    'non_field_errors': [
                        'Booking start and end times must be on the same day. '
                        f'Start date: {start_datetime.date()}, End date: {end_datetime.date()}'
                    ]
                })

        # check for overlapping bookings in the same room
        if room and start_datetime and end_datetime:

            # helper: standard interval overlap check for [start, end)
            def _overlaps(a_start, a_end, b_start, b_end):
                """Return True if half-open intervals [a_start, a_end) and [b_start, b_end) overlap."""
                return a_start < b_end and a_end > b_start

            # helper: same one used in the availability api
            def _expand_recurrences(base_start_datetime, rrule_str, rdate_list=None, exdate_list=None):
                tz = timezone.get_current_timezone()
                start_local = timezone.localtime(base_start_datetime, tz)

                rrule_set = rruleset()
                if rrule_str:
                    rrule_set.rrule(rrulestr(rrule_str, dtstart=start_local))

                if rdate_list:
                    for dt in rdate_list:
                        dt = timezone.localtime(dt, tz) if timezone.is_aware(dt) else timezone.make_aware(dt, tz)
                        rrule_set.rdate(dt)

                if exdate_list:
                    for dt in exdate_list:
                        dt = timezone.localtime(dt, tz) if timezone.is_aware(dt) else timezone.make_aware(dt, tz)
                        rrule_set.exdate(dt)

                return rrule_set

            # helper: returns list[(start,end)] for this booking inside a window
            def _booking_intervals(b_start, b_end, b_rrule, window_start, window_end):
                tz = timezone.get_current_timezone()

                # Normalise all inputs to the same tz (and ensure aware)
                b_start = timezone.localtime(b_start, tz)
                b_end = timezone.localtime(b_end, tz)

                # If window_* are aware, just normalise; if they're dates/naive, make them aware explicitly
                if isinstance(window_start, datetime):
                    window_start = timezone.localtime(window_start, tz) if timezone.is_aware(window_start) else timezone.make_aware(window_start, tz)
                else:
                    window_start = timezone.make_aware(datetime.combine(window_start, time.min), tz)

                if isinstance(window_end, datetime):
                    window_end = timezone.localtime(window_end, tz) if timezone.is_aware(window_end) else timezone.make_aware(window_end, tz)
                else:
                    window_end = timezone.make_aware(datetime.combine(window_end, time.max), tz)

                duration = b_end - b_start

                if b_rrule:
                    occ_starts = _expand_recurrences(b_start, b_rrule).between(window_start, window_end)
                    return [(s, s + duration) for s in occ_starts]

                return [(b_start, b_end)]

            # build the window for the new booking
            new_duration = end_datetime - start_datetime
            if recurrence_rule:
                # creates the window but theres a 366 day upper bound so if a collision were to happen only after a year, then this would miss it
                new_occ_starts = _expand_recurrences(
                    localtime(start_datetime),
                    recurrence_rule,
                ).between(
                    make_aware(datetime.combine(start_datetime.date(), time.min)),
                    make_aware(datetime.combine((start_datetime + timezone.timedelta(days=366)).date(), time.max)),
                )

                new_intervals = [(localtime(s), localtime(s) + new_duration) for s in new_occ_starts]
                if not new_intervals:
                    raise serializers.ValidationError({
                        'recurrence_rule': 'RRULE produced no occurrences.'
                    })
                window_start = min(s for s, _ in new_intervals)
                window_end = max(e for _, e in new_intervals)
            else:
                new_intervals = [
                    (localtime(start_datetime), localtime(end_datetime))]
                window_start = localtime(start_datetime)
                window_end = localtime(end_datetime)

            room_end = getattr(room, "end_datetime", None)
            if room_end:
                room_end = timezone.localtime(room_end)
                if window_end > room_end:
                    raise serializers.ValidationError({
                        "non_field_errors": [
                            f"Bookings exceed the end date of the room. Room isn't active after {room_end.strftime('%Y-%m-%d %H:%M')}."
                        ]
                    })

            # pull candidate existing bookings
            overlapping_bookings = Booking.objects.filter(
                room=room,
                # exclude cancelled bookings
                status__in=['CONFIRMED', 'COMPLETED'],
            ).filter(
                Q(
                    recurrence_rule__isnull=False,
                    start_datetime__lt=window_end,
                ) |
                Q(
                    recurrence_rule__isnull=True,
                    start_datetime__lt=window_end,
                    end_datetime__gt=window_start,
                )
            )

            # For updates, exclude the current booking being updated
            if self.instance:
                overlapping_bookings = overlapping_bookings.exclude(
                    id=self.instance.id)

            # collision test: any existing occurrence overlaps any new interval
            for existing in overlapping_bookings:
                existing_intervals = _booking_intervals(
                    existing.start_datetime,
                    existing.end_datetime,
                    existing.recurrence_rule,
                    window_start,
                    window_end,
                )
                for ns, ne in new_intervals:
                    for es, ee in existing_intervals:
                        if _overlaps(ns, ne, es, ee):
                            raise serializers.ValidationError({
                                'non_field_errors': [
                                    f'Room is already booked from {es.strftime("%Y-%m-%d %H:%M")} '
                                    f'to {ee.strftime("%Y-%m-%d %H:%M")} '
                                    f'by {existing.visitor_name}.'
                                ]
                            })

        return data

    def save(self, **kwargs):
        """Override save to handle status logic after validation."""
        cancel_reason = self.validated_data.get('cancel_reason')
        if cancel_reason and cancel_reason.strip():
            # Set status to CANCELLED when cancel_reason is provided
            if self.instance:
                self.instance.status = 'CANCELLED'
            else:
                # For creation, set the status before saving
                self.validated_data['status'] = 'CANCELLED'

        return super().save(**kwargs)


# though dynamic fields are supported, define a separate serializer for list view for reusability
class BookingListSerializer(BookingSerializer):
    class Meta:
        model = Booking
        fields = ('id', 'room', 'room_id', 'visitor_name', 'visitor_email', 'start_datetime', 'end_datetime',
                  'recurrence_rule', 'status', 'google_event_id', 'created_at')
        read_only_fields = ['google_event_id', 'status']
