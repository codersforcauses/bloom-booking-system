from django.db import models


class Room(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.TextField()
    img_url = models.TextField()
    location_id = models.IntegerField()
    capacity_id = models.IntegerField()
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    recurrence_rule = models.TextField()
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    def __str__(self):
        return self.name
# Create your models here.
