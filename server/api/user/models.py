from django.db import models
from django.contrib.auth.models import AbstractUser


class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = 'api_user'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f"User {self.username}"
