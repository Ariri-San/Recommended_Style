import json
from math import sqrt
from datetime import timedelta
from django.db.models import F, Value, BooleanField, FloatField
from django.db.models.functions import Abs, Coalesce, Now
from django.db.models import ExpressionWrapper, DurationField
from django.utils import timezone

from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, APIView
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.viewsets import ModelViewSet, GenericViewSet, mixins
from rest_framework.filters import SearchFilter, OrderingFilter

from django_filters.rest_framework import DjangoFilterBackend

from core.permissions import IsAdminOrReadOnly
from core.pagination import CustomDefaultPagination
from .scripts.detect_products import FindSimilarProducts, find_similar_products
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
    queryset = models.Product.objects.prefetch_related("likes", "predicts__category", "predicts__color").select_related("site").all()
    serializer_class = serializers.ProductSerializer
    pagination_class = CustomDefaultPagination
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_class = filters.ProductFilter
    ordering_fields = ['title', 'price', 'last_update']
    search_fields = ['title']



class StyleViewSet(ModelViewSet):
    queryset = models.Style.objects.all()
    permission_classes = [IsAdminOrReadOnly]
    serializer_class = serializers.StyleAndPredictSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    pagination_class = CustomDefaultPagination
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
    pagination_class = CustomDefaultPagination
    filterset_class = filters.MyStyleFilter
    serializer_class = serializers.MyStyleAndPredictSerializer
    
    def get_queryset(self):
        return models.MyStyle.objects.filter(user__is_show=True).order_by('-created_at')
    
    def get_serializer_class(self):
        if self.request.method in ["POST", "PUT", "PATCH"]:
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
class CreateCropMyStylePredictView(APIView):
    serializer_class = serializers.CreateCropMyStylePredictSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = self.serializer_class(data=self.request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        
        my_style = models.MyStyle.objects.filter(id=data["style_id"], user=self.request.user)
        
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


class UpdateCropMyStylePredictView(APIView):
    serializer_class = serializers.UpdateCropMyStylePredictSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = self.serializer_class(data=self.request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        
        my_style_predict = models.MyStylePredict.objects.filter(id=data["predict_id"], style__user=self.request.user)
        
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



def hex_to_rgb(hex_color):
    """تبدیل #RRGGBB به (R, G, B)"""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def color_distance(c1, c2):
    """محاسبه فاصله اقلیدسی بین دو رنگ"""
    r1, g1, b1 = hex_to_rgb(c1)
    r2, g2, b2 = hex_to_rgb(c2)
    return sqrt((r1 - r2)**2 + (g1 - g2)**2 + (b1 - b2)**2)     


class RecommendedMyStyleView(APIView):
    serializer_class = serializers.MyStyleAndPredictSerializer
    permission_classes = [IsAuthenticated]

    DEFAULTS = {
        'height': 175,
        'weight': 70,
        'birth_day': timezone.now() - timedelta(days=25 * 365),
        'hair_color': '#000000',   # سیاه
        'skin_color': '#f1c27d',   # رنگ پوست متوسط
    }

    def similarity(self, style, user):
        u = style.user

        # داده‌های فرد در استایل
        h = u.height or self.DEFAULTS['height']
        w = u.weight or self.DEFAULTS['weight']
        bd = u.birth_day or self.DEFAULTS['birth_day']
        hc = u.hair_color or self.DEFAULTS['hair_color']
        sc = u.skin_color or self.DEFAULTS['skin_color']

        # داده‌های کاربر جاری
        height = user.height or self.DEFAULTS['height']
        weight = user.weight or self.DEFAULTS['weight']
        birth_day = user.birth_day or self.DEFAULTS['birth_day']
        hair_color = user.hair_color or self.DEFAULTS['hair_color']
        skin_color = user.skin_color or self.DEFAULTS['skin_color']

        age_diff = abs((birth_day - bd).days)
        height_diff = abs(height - h)
        weight_diff = abs(weight - w)
        hair_diff = color_distance(hair_color, hc)
        skin_diff = color_distance(skin_color, sc)

        # محاسبه‌ی امتیاز شباهت
        # Ensure Decimal values are converted to float before mixing with float constants
        score = (
            float(height_diff) * 0.4 +
            float(weight_diff) * 0.3 +
            float(age_diff) * 0.001 +
            hair_diff * 0.05 +
            skin_diff * 0.05
        )
        return score

    def get(self, request):
        user = request.user

        # استایل‌های قابل نمایش و هم‌جنس
        qs = models.MyStyle.objects.select_related('user').filter(
            user__is_man=user.is_man,
            user__is_show=True
        )

        # مرتب‌سازی بر اساس شباهت
        sorted_styles = sorted(qs, key=lambda s: self.similarity(s, user))

        predict_serializer = self.serializer_class(instance=sorted_styles, many=True, context={"request": request})
            
        return Response(predict_serializer.data, status.HTTP_200_OK)


class TestPredictStyleView(APIView):
    serializer_class = serializers.GetTestPredictStyleSerializer

    def post(self, request):
        serializer = self.serializer_class(data=self.request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        
        find_simslar = FindSimilarProducts()
        image = find_simslar._open_imagefield(data["image"])
        predict = find_simslar.extract_test_image(image=image, is_man=data["is_man"], product_n=20)
            
        predict_serializer = serializers.ShowTestPredictStyleSerializer(instance=predict, many=True, context={"request": request})
        
        return Response(predict_serializer.data, status.HTTP_200_OK)


class FindSimilarProductsView(APIView):
    serializer_class = serializers.EmbeddingSerializer

    def post(self, request):
        serializer = self.serializer_class(data=self.request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        
        top_n = data.get("top_n", 20)
        page_n = data.get("page_n", 1)

        # compute how many top results we need to cover the requested page
        max_needed = page_n * top_n
        category = data.get("category", None)
        is_man = data.get("is_man", None)
        color = data.get("color", None)
        # # If category is an integer id, load the Category instance expected by the search function.
        # if category is not None and not isinstance(category, (dict, list)):
        #     try:
        #         # allow strings that are numeric
        #         cat_id = int(category)
        #         from get_data.models import Category as _Category
        #         category = _Category.objects.filter(id=cat_id).first()
        #     except Exception:
        #         # if category is not a valid id, treat as no-category (None)
        #         category = None

        products_all = find_similar_products(json.loads(data["embedding"]), category=category, color=color, is_man=is_man, top_n=max_needed)

        # slice to requested page
        start = (page_n - 1) * top_n
        end = start + top_n
        products_page = products_all[start:end] if products_all else []

        if products_page:
            product_serializer = serializers.ProductSerializer(instance=products_page, many=True, context={"request": request})
            return Response(product_serializer.data, status.HTTP_200_OK)

        return Response({"Products Not Found"}, status.HTTP_204_NO_CONTENT)
