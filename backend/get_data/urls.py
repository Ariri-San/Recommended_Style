from django.urls import path
from django.urls.conf import include
from rest_framework_nested import routers
from core.routers import CustomRouter
from . import views




urlpatterns = [
    # path('cities/<province_id>/', views.get_cities_by_id, name="cities-id-list"),
]