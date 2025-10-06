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


#  ----------  ProductPredict  ----------
class ProductPredictSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    color = ColorSerializer(read_only=True)
    
    class Meta:
        model = models.ProductPredict
        fields = ['id', 'version', 'category', 'category_score', 'color', 'color_score', 'last_update', 'created_at']


#  ----------  Product  ----------
class ProductSerializer(serializers.ModelSerializer):
    site = SiteSerializer(read_only=True)
    predicts = ProductPredictSerializer(many=True, read_only=True)
    like = serializers.SerializerMethodField()
    likes = serializers.SerializerMethodField()
    
    def get_like(self, product: models.Product):
        if self.context["request"].user.id:
            return product.likes.filter(user=self.context["request"].user).exists()

    def get_likes(self, product: models.Product):
        return product.likes.count()
    
    class Meta:
        model = models.Product
        fields = ['id', 'site', 'is_man', 'title', 'price', 'image', 'predicts',
            'url', 'image_local', 'like', 'likes', 'last_update', 'created_at']


#  ----------  Style  ----------
class StyleSerializer(serializers.ModelSerializer):
    site = SiteSerializer(read_only=True)
    like = serializers.SerializerMethodField()
    likes = serializers.SerializerMethodField()
    
    def get_like(self, product: models.Product):
        if self.context["request"].user.id:
            return product.likes.filter(user=self.context["request"].user).exists()

    def get_likes(self, product: models.Product):
        return product.likes.count()
    
    class Meta:
        model = models.Style
        fields = ['id', 'site', 'id_object', 'title', 'image', 'url', 'image_local', 'is_man',
            'age', 'skin_color', 'hair_color', 'height', 'body_type', 'like', 'likes', 'last_update', 'created_at']


#  ----------  StylePredict  ----------
class StylePredictSerializer(serializers.ModelSerializer):
    style = StyleSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    products = ProductSerializer(many=True, read_only=True)
    
    class Meta:
        model = models.StylePredict
        fields = ['id', 'style', 'category', 'crop_name', 'products', 'crop_image', 'crop_meta', 'last_update', 'created_at']


#  ----------  MyStyle  ----------
class MyStyleSerializer(serializers.ModelSerializer):
    user = SimpleUserSerializer(read_only=True)
    like = serializers.SerializerMethodField()
    likes = serializers.SerializerMethodField()
    
    def get_like(self, product: models.Product):
        if self.context["request"].user.id:
            return product.likes.filter(user=self.context["request"].user).exists()

    def get_likes(self, product: models.Product):
        return product.likes.count()
    
    class Meta:
        model = models.MyStyle
        fields = ['id', 'user', 'image', 'like', 'likes']

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
        fields = ['id', 'style', 'category', 'detected_products', 'product', 'crop_name', 'crop_image', 'bounding_box', 'predict_elapsed', 'last_update', 'created_at']

class UpdateMyStylePredictSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.MyStylePredict
        fields = ['product', 'crop_name']

class SimpleMyStylePredictSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    product = ProductSerializer(read_only=True)
    
    class Meta:
        model = models.MyStylePredict
        fields = ['id', 'category', 'product', 'crop_name', 'crop_image', 'bounding_box', 'last_update', 'created_at']




#  ----------  Custom Serializers  ----------
class StyleAndPredictSerializer(serializers.ModelSerializer):
    predicts = SimpleMyStylePredictSerializer(many=True, read_only=True)
    like = serializers.SerializerMethodField()
    likes = serializers.SerializerMethodField()
    
    def get_like(self, product: models.Product):
        if self.context["request"].user.id:
            return product.likes.filter(user=self.context["request"].user).exists()

    def get_likes(self, product: models.Product):
        return product.likes.count()
    
    class Meta:
        model = models.Style
        fields = ['id', 'site', 'id_object', 'title', 'image', 'url', 'image_local', 'is_man',
            'age', 'skin_color', 'hair_color', 'height', 'body_type', 'like', 'likes', 'predicts']


class MyStyleAndPredictSerializer(serializers.ModelSerializer):
    user = SimpleUserSerializer(read_only=True)
    predicts = SimpleMyStylePredictSerializer(many=True, read_only=True)
    like = serializers.SerializerMethodField()
    likes = serializers.SerializerMethodField()
    
    def get_like(self, product: models.Product):
        if self.context["request"].user.id:
            return product.likes.filter(user=self.context["request"].user).exists()

    def get_likes(self, product: models.Product):
        return product.likes.count()
    
    class Meta:
        model = models.MyStyle
        fields = ['id', 'user', 'image', 'like', 'likes', 'predicts']
