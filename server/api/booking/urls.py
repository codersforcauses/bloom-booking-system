# from django.shortcuts import render
from django.urls import path
from .views import test
from .views import BookingsListCreatView, BookingUpdateDeleteView, BookingSearchView

urlpatterns = [
    path('', BookingsListCreatView.as_view()),
    path('<int:pk>/', BookingUpdateDeleteView.as_view()),
    path('search/', BookingSearchView.as_view()),
    path('test/', test),
]
