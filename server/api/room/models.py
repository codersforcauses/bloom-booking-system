from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone


def get_start_of_today():
    utc_now = timezone.now()
    local_now = timezone.localtime(utc_now)
    return local_now.replace(hour=0, minute=0, second=0, microsecond=0)


def get_end_of_today():
    utc_now = timezone.now()
    local_now = timezone.localtime(utc_now)
    return local_now.replace(hour=23, minute=59, second=59, microsecond=999999)


class Location(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=64, blank=False)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return self.name


class Amenity(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=32, blank=False)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return self.name


class Room(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=32, blank=False)
    img = models.ImageField(upload_to='room_images/', blank=True, null=True)
    location = models.ForeignKey(
        Location, on_delete=models.PROTECT, blank=False)
    capacity = models.PositiveIntegerField(validators=[MinValueValidator(1)], blank=True, null=True)
    amenities = models.ManyToManyField(Amenity, blank=True)
    is_active = models.BooleanField(default=True)
    start_datetime = models.DateTimeField(default=get_start_of_today, blank=True)
    end_datetime = models.DateTimeField(default=get_end_of_today, blank=True)
    recurrence_rule = models.CharField(default='FREQ=DAILY', max_length=64, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
