from django.db import models
from django.contrib.auth.models import User as UserModel


class User(UserModel):
    id = models.IntegerField(primary_key=True)
    updated_at = models.DateTimeField()
