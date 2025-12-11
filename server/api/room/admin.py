from django.contrib import admin
from .models import Room, Location, Amenities
# Register your models here.


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "location_name",
                    "start_datetime", "end_datetime", "recurrence_rule", "is_active")
    search_fields = ("name", "location__name", "amenities__name")
    list_display_links = ("name",)

    def location_name(self, obj):
        return obj.location_id.name
    location_name.short_description = "Location"


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)
    list_display_links = ("name",)


@admin.register(Amenities)
class AmenitiesAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)
    list_display_links = ("name",)
