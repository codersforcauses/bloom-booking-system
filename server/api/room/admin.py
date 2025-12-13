from django.contrib import admin
from .models import Room, Location, Amenity
# Register your models here.


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "location",
                    "start_datetime", "end_datetime", "recurrence_rule", "is_active")
    search_fields = ("name", "location__name", "amenities__name")
    list_display_links = ("name",)


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)
    list_display_links = ("name",)


@admin.register(Amenity)
class AmenitiesAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)
    list_display_links = ("name",)
