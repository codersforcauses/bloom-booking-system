from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.models import UserManager
from django.core.validators import validate_email
from django.core.exceptions import ValidationError


class CustomUserManager(UserManager):
    def create_user(self, username, email=None, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')

        # Validate email format
        try:
            validate_email(email)
        except ValidationError:
            raise ValueError('Invalid email format')

        return super().create_user(username, email, password, **extra_fields)


class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = CustomUserManager()  # use custom manager

    class Meta:
        app_label = 'api_user'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f"User {self.username}"
