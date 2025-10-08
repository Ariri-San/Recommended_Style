from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, APIView
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.viewsets import ModelViewSet, GenericViewSet, mixins
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend

from core.permissions import IsAdminOrReadOnly
from .scripts.detect_products import FindSimilarProducts
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
    permission_classes = [permissions.MyStylePermission]
    filter_backends = [DjangoFilterBackend]
    filterset_class = filters.MyStyleFilter
    
    def get_queryset(self):
        return models.MyStyle.objects.filter(user__is_show=True)
    
    def get_serializer_class(self):
        if self.action in ["create", "update"]:
            return serializers.CreateMyStyleSerializer
        elif self.action == "retrieve":
            return serializers.MyStyleAndPredictSerializer
        return serializers.MyStyleSerializer



class MyStylePredictViewSet(ModelViewSet):
    permission_classes = [permissions.MyStylePredictPermission]
    
    def get_queryset(self):
        return models.MyStylePredict.objects.filter(style__id=self.kwargs["my_style__pk"])
    
    def get_serializer_class(self):
        if self.request.method in ["POST", "PUT", "PATCH"]:
            return serializers.UpdateMyStylePredictSerializer
        return serializers.MyStylePredictSerializer



#  -----------  Custom Views ----------
class CreateCropMyStylePredict(APIView):
    serializer_class = serializers.CreateCropMyStylePredictSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = self.serializer_class(data=self.request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        
        my_style = models.MyStyle.objects.filter(id=data["style_id"])
        
        if my_style.exists():
            find_simslar = FindSimilarProducts()
            predict = find_simslar.create_predict_from_crop(my_style[0], {
                "x1": data["x1"],
                "y1": data["y1"],
                "x2": data["x2"],
                "y2": data["y2"],
            })
            
            predict_serializer = serializers.MyStylePredictSerializer(instance=predict, context={"request": request})
            
            return Response(predict_serializer.data, status.HTTP_201_CREATED)
        
        return Response({"Style Not Found"}, status.HTTP_204_NO_CONTENT)


class UpdateCropMyStylePredict(APIView):
    serializer_class = serializers.UpdateCropMyStylePredictSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = self.serializer_class(data=self.request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        
        my_style_predict = models.MyStylePredict.objects.filter(id=data["predict_id"])
        
        if my_style_predict.exists():
            find_simslar = FindSimilarProducts()
            predict = find_simslar.create_predict_from_crop(my_style_predict[0].style, {
                "x1": data["x1"],
                "y1": data["y1"],
                "x2": data["x2"],
                "y2": data["y2"],
            }, my_style_predict[0])
            
            predict_serializer = serializers.MyStylePredictSerializer(instance=predict, context={"request": request})
            
            return Response(predict_serializer.data, status.HTTP_200_OK)
        
        return Response({"Predict Style Not Found"}, status.HTTP_204_NO_CONTENT)
        

