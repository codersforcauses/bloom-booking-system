# from django.shortcuts import render
from rest_framework.routers import DefaultRouter
from .views import BookingViewSet

router = DefaultRouter()
router.register('bookings', BookingViewSet, basename='booking')
