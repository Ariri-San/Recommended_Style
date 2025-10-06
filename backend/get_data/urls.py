from django.urls import path
from core.routers import CustomRouter
from rest_framework_nested import routers
from . import views


router = CustomRouter()
router.register('sites', views.SiteViewSet, basename='sites')
router.register('categories', views.CategoryViewSet, basename='categories')
router.register('colors', views.ColorViewSet, basename='colors')
router.register('products', views.ProductViewSet, basename='products')
router.register('styles', views.StyleViewSet, basename='styles')
router.register('my_styles', views.MyStyleViewSet, basename='my_styles')


styles_router = routers.NestedSimpleRouter(router, 'styles', lookup='style')
styles_router.register('predicts', views.StylePredictViewSet, basename='style-predicts')

my_styles_router = routers.NestedSimpleRouter(router, 'my_styles', lookup='my_style')
my_styles_router.register('predicts', views.MyStylePredictViewSet, basename='my_style-predicts')


urlpatterns = router.urls + styles_router.urls + my_styles_router.urls