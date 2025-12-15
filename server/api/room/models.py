from django.db import models
from django.core.validators import MinValueValidator


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
    capacity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    amenities = models.ManyToManyField(Amenity, blank=True)
    is_active = models.BooleanField(default=True)
    start_datetime = models.DateTimeField(blank=False)
    end_datetime = models.DateTimeField(blank=False)
    recurrence_rule = models.CharField(max_length=64, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
