from django.contrib import admin
from .models import Room, Location, Capacity, Amenties
# Register your models here.
@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "location", "capacity", "start_datetime", "end_datetime")
    search_fields = ("name",)

@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)

@admin.register(Capacity)
class CapacityAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)

@admin.register(Amenties)
class AmentiesAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)