import django_filters
from .models import Room


class RoomFilter(django_filters.FilterSet):
    """
    Filter set for Room queryset with support for:
    - Name search (case-insensitive)
    - Location search (case-insensitive)
    - Capacity range filtering
    - Amenity filtering (multiple amenities supported)
    - Active status (automatically filtered for non-authenticated users)
    """

    # Name search (case-insensitive contains)
    name = django_filters.CharFilter(
        field_name='name',
        lookup_expr='icontains',
        help_text="Filter by room name (case-insensitive partial match)"
    )

    # Location search by location name (case-insensitive contains)
    location = django_filters.CharFilter(
        field_name='location__name',
        lookup_expr='icontains',
        help_text="Filter by location name (case-insensitive partial match)"
    )

    # Capacity range filters
    min_capacity = django_filters.NumberFilter(
        field_name='capacity',
        lookup_expr='gte',
        help_text="Minimum room capacity"
    )

    max_capacity = django_filters.NumberFilter(
        field_name='capacity',
        lookup_expr='lte',
        help_text="Maximum room capacity"
    )

    # Amenity filtering using names directly
    amenities = django_filters.CharFilter(
        method='filter_amenities_by_name',
        help_text="Filter by amenity names (comma-separated string, e.g., 'WiFi,Projector')"
    )

    def filter_amenities_by_name(self, queryset, name, value):
        """Custom filter method for amenity names as comma-separated string"""
        if not value:
            return queryset

        names = [n.strip() for n in value.split(',') if n.strip()]
        if not names:
            return queryset

        # Filter rooms that have ALL specified amenities
        for amenity_name in names:
            queryset = queryset.filter(amenities__name__iexact=amenity_name)

        return queryset.distinct()

    class Meta:
        model = Room
        fields = ['name', 'location']
