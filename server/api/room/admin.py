from django.contrib import admin
from .models import Room
# Register your models here.
@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "location_id", "capacity_id", "start_datetime", "end_datetime")
    search_fields = ("name",)
