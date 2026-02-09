from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta

from api.room.models import Room
from api.booking.models import Booking
from api.user.models import CustomUser


@api_view(['GET'])
def get_dashboard_stats(request):
    """
    GET /api/dashboard
    """
    # calculating the start of the current week (Monday)
    today = timezone.now()
    week_start = today - timedelta(days=today.weekday())
    week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # gathering statistics
    stats = {
        'total_meeting_rooms': Room.objects.filter(is_active=True).count(),
        'total_bookings': Booking.objects.count(),
        'weekly_bookings': Booking.objects.filter(
            created_at__gte=week_start
        ).count(),
        'total_users': CustomUser.objects.count()
    }
    
    return Response(stats)