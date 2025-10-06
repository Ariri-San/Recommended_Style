from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, APIView
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.viewsets import ModelViewSet, GenericViewSet, mixins
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend

from core.permissions import IsAdminOrReadOnly
from . import models, serializers, filters, permissions

# Create your views here.


class SiteViewSet(ModelViewSet):
    queryset = models.Site.objects.all()
    serializer_class = serializers.SiteSerializer
    permission_classes = [IsAdminOrReadOnly]



class CategoryViewSet(ModelViewSet):
    queryset = models.Category.objects.all()
    serializer_class = serializers.CategorySerializer
    permission_classes = [IsAdminOrReadOnly]



class ColorViewSet(ModelViewSet):
    queryset = models.Color.objects.all()
    serializer_class = serializers.ColorSerializer
    permission_classes = [IsAdminOrReadOnly]



class ProductViewSet(ModelViewSet):
    queryset = models.Product.objects.all()
    serializer_class = serializers.ProductSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_class = filters.ProductFilter
    search_fields = ['title']



class StyleViewSet(ModelViewSet):
    queryset = models.Style.objects.all()
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_class = filters.StyleFilter
    search_fields = ['title']
    
    def get_serializer_class(self):
        if self.action == "retrieve":
            return serializers.StyleAndPredictSerializer
        return serializers.StyleSerializer



class StylePredictViewSet(ModelViewSet):
    serializer_class = serializers.StylePredictSerializer
    permission_classes = [IsAdminOrReadOnly]
    
    def get_queryset(self):
        return models.StylePredict.objects.filter(style__id=self.kwargs["style__pk"])



class MyStyleViewSet(ModelViewSet):
    queryset = models.MyStyle.objects.all()
    permission_classes = [permissions.MyStylePermission]
    filter_backends = [DjangoFilterBackend]
    filterset_class = filters.MyStyleFilter
    
    def get_serializer_class(self):
        if self.action == "retrieve":
            return serializers.MyStyleAndPredictSerializer
        return serializers.MyStyleSerializer



class MyStylePredictViewSet(ModelViewSet):
    serializer_class = serializers.MyStylePredictSerializer
    permission_classes = [permissions.MyStylePredictPermission]
    
    def get_queryset(self):
        return models.MyStylePredict.objects.filter(style__id=self.kwargs["my_style__pk"])

