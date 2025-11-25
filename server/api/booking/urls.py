# from django.shortcuts import render
from django.urls import path
from .views import test
from .views import BookingsListCreatView

urlpatterns = [
    path('', BookingsListCreatView.as_view()),
    path('test/', test),
]
