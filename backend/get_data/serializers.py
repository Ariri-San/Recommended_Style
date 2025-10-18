from decimal import Decimal
import json
from django.db import transaction
from django.db.models import Sum, Min, Max
from rest_framework import serializers

from core.serializers import UserSerializer, SimpleUserSerializer
from .scripts.detect_products import FindSimilarProducts
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



#  ----------  StylePredict  ----------
class StylePredictSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    products = ProductSerializer(many=True, read_only=True)
    bounding_box = serializers.SerializerMethodField(read_only=True)
    
    def get_bounding_box(self, style_predict: models.StylePredict):
        return json.loads(style_predict.crop_meta)["bounding_box"]
    
    class Meta:
        model = models.StylePredict
        fields = ['id', 'style', 'category', 'crop_name', 'products', 'crop_image', 'bounding_box', 'last_update', 'created_at']

class SimpleStylePredictSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    product = ProductSerializer(read_only=True)
    bounding_box = serializers.SerializerMethodField(read_only=True)
    
    def get_bounding_box(self, style_predict: models.StylePredict):
        return json.loads(style_predict.crop_meta)["bounding_box"]
    
    class Meta:
        model = models.StylePredict
        fields = ['id', 'category', 'product', 'crop_name', 'crop_image', 'bounding_box', 'last_update', 'created_at']



#  ----------  Style  ----------
class StyleSerializer(serializers.ModelSerializer):
    site = SiteSerializer(read_only=True)
    predicts = SimpleStylePredictSerializer(many=True, read_only=True)
    like = serializers.SerializerMethodField()
    likes = serializers.SerializerMethodField()
    
    def get_like(self, product: models.Product):
        if self.context["request"].user.id:
            return product.likes.filter(user=self.context["request"].user).exists()

    def get_likes(self, product: models.Product):
        return product.likes.count()
    
    class Meta:
        model = models.Style
        fields = ['id', 'site', 'id_object', 'title', 'image', 'url', 'image_local', 'is_man', 'age', 
            'skin_color', 'hair_color', 'height', 'body_type', 'predicts', 'like', 'likes', 'last_update', 'created_at']

class StyleAndPredictSerializer(serializers.ModelSerializer):
    predicts = StylePredictSerializer(many=True, read_only=True)
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



#  ----------  MyStylePredict  ----------
class MyStylePredictSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    detected_products = ProductSerializer(many=True, read_only=True)
    product = ProductSerializer(read_only=True)
    bounding_box = serializers.SerializerMethodField(read_only=True)
    
    def get_bounding_box(self, style_predict: models.MyStylePredict):
        return json.loads(style_predict.bounding_box)
    
    class Meta:
        model = models.MyStylePredict
        fields = ['id', 'category', 'product', 'crop_name', 'crop_image', 'bounding_box', 'predict_elapsed', 'detected_products', 'last_update', 'created_at']

class UpdateMyStylePredictSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.MyStylePredict
        fields = ['product', 'crop_name']

class SimpleMyStylePredictSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    product = ProductSerializer(read_only=True)
    bounding_box = serializers.SerializerMethodField(read_only=True)
    
    def get_bounding_box(self, style_predict: models.MyStylePredict):
        return json.loads(style_predict.bounding_box)
    
    class Meta:
        model = models.MyStylePredict
        fields = ['id', 'category', 'product', 'crop_name', 'crop_image', 'bounding_box', 'last_update', 'created_at']



#  ----------  MyStyle  ----------
class MyStyleSerializer(serializers.ModelSerializer):
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
        fields = ['id', 'user', 'image', 'predicts', 'like', 'likes']

class CreateMyStyleSerializer(serializers.ModelSerializer):
    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        my_style = super().create(validated_data)
        find_simslar = FindSimilarProducts()
        find_simslar.extract_image(my_style)
        return my_style
    
    def update(self, my_style, validated_data):
        validated_data["user"] = self.context["request"].user
        my_style = super().update(my_style ,validated_data)
        find_simslar = FindSimilarProducts()
        find_simslar.extract_image(my_style)
        return my_style
    
    class Meta:
        model = models.MyStyle
        fields = ['image']

class MyStyleAndPredictSerializer(serializers.ModelSerializer):
    user = SimpleUserSerializer(read_only=True)
    predicts = MyStylePredictSerializer(many=True, read_only=True)
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



#  ----------  Custom Serializers  ----------
class UpdateCropMyStylePredictSerializer(serializers.Serializer):
    x1 = serializers.IntegerField()
    y1 = serializers.IntegerField()
    x2 = serializers.IntegerField()
    y2 = serializers.IntegerField()
    predict_id = serializers.IntegerField()
    
    class Meta:
        fields = ['x1', 'y1', 'x2', 'y2', 'predict_id']

class CreateCropMyStylePredictSerializer(serializers.Serializer):
    x1 = serializers.IntegerField()
    y1 = serializers.IntegerField()
    x2 = serializers.IntegerField()
    y2 = serializers.IntegerField()
    style_id = serializers.IntegerField()
    
    class Meta:
        fields = ['x1', 'y1', 'x2', 'y2', 'style_id']


class GetTestPredictStyleSerializer(serializers.Serializer):
    is_man = serializers.BooleanField()
    image = serializers.ImageField()
    
    class Meta:
        fields = ['is_man', 'image']

class ShowTestPredictStyleSerializer(serializers.Serializer):
    category = serializers.CharField(read_only=True)
    predict_elapsed = serializers.DurationField(read_only=True)
    crop_name = serializers.CharField(read_only=True)
    crop_image = serializers.CharField(read_only=True)
    bounding_box = serializers.JSONField(read_only=True)
    products = ProductSerializer(many=True, read_only=True)

    class Meta:
        fields = ['category', 'predict_elapsed', 'crop_name', 'crop_image', 'bounding_box', 'products']