from django.urls import path, re_path
from .views import FrontendAppView, serve_file


urlpatterns = [
    path('', FrontendAppView.as_view(), name='frontend'),
    
    path('<str:filename>/', serve_file, name='serve_file'),
    
    re_path(r'^[a-zA-Z]+/\d+/$', FrontendAppView.as_view(), name='home_id'),
]