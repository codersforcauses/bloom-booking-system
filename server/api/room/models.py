from django.db import models

class Location(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.TextField(blank=False)

    def __str__(self):
        return self.name
class Amenties(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.TextField(blank=False)

    def __str__(self):
        return self.name

class Capacity(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.TextField(blank=False)

    def __str__(self):
        return str(self.name)
class Room(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.TextField(blank=False)
    img_url = models.ImageField(upload_to='') # change to upload s3 later for deployment?
    location_id = models.ForeignKey(Location, on_delete=models.CASCADE, blank=False)
    capacity_id = models.ForeignKey(Capacity, on_delete=models.CASCADE, blank=False)
    amenities = models.ManyToManyField(Amenties, blank=True)
    start_datetime = models.DateTimeField(blank=False)
    end_datetime = models.DateTimeField(blank=False)
    recurrence_rule = models.TextField(blank=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
# Create your models here.


