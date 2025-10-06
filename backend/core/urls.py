from django.urls import path
from django.urls.conf import include
from rest_framework_nested import routers
from .routers import CustomRouter
from . import views


router = CustomRouter()
router.add_custom_root('models', views.ContentTypeAPIView.as_view(), 'models-list')


urlpatterns = router.urls
