from django import forms
from .models import Booking


class BookingForm(forms.ModelForm):

    class Meta:
        model = Booking
        fields = ['room_id', 'visitor_name', 'visitor_email',
                  'start_datetime', 'end_datetime', 'recurrence_rule', 'status']
