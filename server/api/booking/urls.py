# from django.shortcuts import render
from django.urls import path
from .views import test

urlpatterns = [
    path('test/', test),
]
