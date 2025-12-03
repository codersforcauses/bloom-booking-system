# from django.shortcuts import render
from django.urls import path
from .views import BookingsListCreateView, BookingListUpdateDeleteView, BookingSearchView

urlpatterns = [
    path('', BookingsListCreateView.as_view()),
    path('<int:pk>/', BookingListUpdateDeleteView.as_view()),
    path('search/', BookingSearchView.as_view()),
]
