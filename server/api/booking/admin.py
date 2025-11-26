from django.contrib import admin
from .models import Booking


class BookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'room_id', 'visitor_name', 'visitor_email',
                    'start_datetime', 'end_datetime', 'recurrence_rule',
                    'status', 'google_event_id', 'cancel_reason',
                    'created_at', 'updated_at')
    search_fields = ('room_id', 'visitor_name', 'visitor_email', 'google_event_id')
    list_filter = ('room_id', 'start_datetime', 'end_datetime', 'status', 'cancel_reason')
    ordering = ('id', 'room_id', 'visitor_name', 'visitor_email',
                'start_datetime', 'end_datetime', 'recurrence_rule',
                'status', 'google_event_id', 'cancel_reason',
                'created_at', 'updated_at')


admin.site.register(Booking, BookingAdmin)
