from django.db import models

<<<<<<< Updated upstream
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

class Capacity(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.TextField()

    def __str__(self):
        return str(self.name)
=======

>>>>>>> Stashed changes
class Room(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.TextField()
    img_url = models.TextField()
<<<<<<< Updated upstream
    location_id = models.ForeignKey(Location, on_delete=models.CASCADE)
    capacity_id = models.ForeignKey(Capacity, on_delete=models.CASCADE)
    amenities = models.ManyToManyField(Amenties, blank=True)
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    recurrence_rule = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
=======
    location_id = models.IntegerField()
    capacity_id = models.IntegerField()
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    recurrence_rule = models.TextField()
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()
>>>>>>> Stashed changes

    def __str__(self):
        return self.name
# Create your models here.
<<<<<<< Updated upstream


=======
>>>>>>> Stashed changes
