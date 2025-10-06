from decimal import Decimal
import math
from django.db import transaction
from django.db.models import Sum, Min, Max
from rest_framework import serializers

from core.serializers import UserSerializer, SimpleUserSerializer
from . import models



#  ----------  Site  ----------
class SiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Site
        fields = ['id', 'title', 'url', 'description']


#  ----------  Category  ----------
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Category
        fields = ['id', 'title', 'description']


#  ----------  Color  ----------
class ColorSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Color
        fields = ['id', 'title', 'hex_code']


#  ----------  Product  ----------
class ProductSerializer(serializers.ModelSerializer):
    site = SiteSerializer(read_only=True)
    
    class Meta:
        model = models.Product
        fields = ['id', 'site', 'is_man', 'title', 'price', 'image',
            'url', 'image_local', 'last_update', 'created_at']


#  ----------  ProductPredict  ----------
class ProductPredictSerializer(serializers.ModelSerializer):
    product = SiteSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    color = ColorSerializer(read_only=True)
    
    class Meta:
        model = models.ProductPredict
        fields = ['id', 'product', 'version', 'category', 'category_score', 'color', 'color_score', 'image_embedding',
            'image_embedding_dim', 'classification_model', 'classified_at', 'last_update', 'created_at']


#  ----------  Style  ----------
class StyleSerializer(serializers.ModelSerializer):
    site = SiteSerializer(read_only=True)
    
    class Meta:
        model = models.Style
        fields = ['id', 'site', 'id_object', 'title', 'image', 'url', 'image_local', 'is_man',
            'age', 'skin_color', 'hair_color', 'height', 'body_type', 'last_update', 'created_at']


#  ----------  StylePredict  ----------
class StylePredictSerializer(serializers.ModelSerializer):
    style = StyleSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    products = ProductSerializer(many=True, read_only=True)
    
    class Meta:
        model = models.StylePredict
        fields = ['id', 'style', 'category', 'crop_name', 'products', 'version', 'image_embedding', 'image_embedding_dim',
            'prediction_model', 'predicted_at', 'crop_image', 'crop_meta', 'last_update', 'created_at']


#  ----------  MyStyle  ----------
class MyStyleSerializer(serializers.ModelSerializer):
    user = SimpleUserSerializer(read_only=True)
    
    class Meta:
        model = models.MyStyle
        fields = ['id', 'user', 'image']

class CreateMyStyleSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.MyStyle
        fields = ['image']


#  ----------  MyStylePredict  ----------
class MyStylePredictSerializer(serializers.ModelSerializer):
    style = MyStyleSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    detected_products = ProductSerializer(many=True, read_only=True)
    product = ProductSerializer(read_only=True)
    
    class Meta:
        model = models.MyStylePredict
        fields = ['id', 'style', 'category', 'detected_products', 'product', 'crop_name', 'crop_image', 'bounding_box',
            'image_embedding', 'image_embedding_dim', 'prediction_model', 'predict_elapsed', 'last_update', 'created_at']


class UpdateMyStylePredictSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.MyStylePredict
        fields = ['product', 'crop_name']


