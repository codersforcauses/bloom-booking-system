from django.db import models

class Location(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.TextField()

    def __str__(self):
        return self.name
class Amenties(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.TextField()

    def __str__(self):
        return self.name

class Room(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.TextField()
    img_url = models.TextField()
    location_id = models.ForeignKey(Location, on_delete=models.CASCADE)
    capacity_id = models.IntegerField()
    amenties = models.ManyToManyField(Amenties, blank=True)
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    recurrence_rule = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
# Create your models here.


