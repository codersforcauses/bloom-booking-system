from django.http import HttpResponse
from rest_framework import generics
from .models import Booking
from .serializers import BookingSerializer


# /bookings/get and /bookings/post route
class BookingsListCreatView(generics.ListCreateAPIView):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    http_method_names = ['get', 'post']

    def get_queryset(self):
        queryset = Booking.objects.all()
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


# /test route
def test(request):
    return HttpResponse("Hello, Django!")
