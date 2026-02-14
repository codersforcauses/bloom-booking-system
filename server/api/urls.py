"""
URL configuration for server project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView
)

from rest_framework_nested.routers import DefaultRouter
from rest_framework.routers import APIRootView
from api.booking.urls import router as bookings_router
from api.room.urls import router as room_router

router = DefaultRouter()
router.APIRootView = APIRootView
router.registry.extend(bookings_router.registry)
router.registry.extend(room_router.registry)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/healthcheck/", include(("api.healthcheck.urls"))),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("swagger/", SpectacularSwaggerView.as_view(url_name="schema"),
         name="swagger-ui"),
    path("redoc/", SpectacularRedocView.as_view(url_name="schema"),
         name="redoc"),
    path("api/users/", include(("api.user.urls"))),
    path("api/dashboard/", include("api.dashboard.urls")),
    path("api/", include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL,
                          document_root=settings.MEDIA_ROOT)
