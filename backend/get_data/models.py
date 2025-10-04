from sys import version
from django.db import models

# Create your models here.


class Site(models.Model):
    title = models.CharField(max_length=255, unique=True)
    url = models.CharField(max_length=511)
    description = models.TextField(null=True, blank=True)
    
    def __str__(self) -> str:
        return self.title


class Category(models.Model):
    title = models.CharField(max_length=255, unique=True)
    description = models.TextField(null=True, blank=True)
    
    def __str__(self) -> str:
        return self.title


class Color(models.Model):
    title = models.CharField(max_length=64, unique=True)
    hex_code = models.CharField(max_length=7, null=True, blank=True)
    
    def __str__(self) -> str:
        return self.title


class Product(models.Model):
    site = models.ForeignKey(Site, on_delete=models.PROTECT, related_name='products')
    is_man = models.BooleanField(default=True, null=True, blank=True)
    title = models.CharField(max_length=511)
    price = models.BigIntegerField()
    image = models.URLField()
    url = models.URLField(blank=True)
    image_local = models.ImageField(upload_to="products/none_group", null=True, blank=True)
    last_update = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return self.title
    
    class Meta:
        ordering = ['id']


class ProductPredict(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='predicts')
    version = models.IntegerField()
    # AI predictions (normalized to FKs)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    category_score = models.FloatField(null=True, blank=True)
    color = models.ForeignKey(Color, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    color_score = models.FloatField(null=True, blank=True)
    # Image embedding for similarity search
    image_embedding = models.JSONField(null=True, blank=True)
    image_embedding_dim = models.IntegerField(null=True, blank=True)
    classification_model = models.CharField(max_length=64, null=True, blank=True)
    classified_at = models.DateTimeField(null=True, blank=True)
    last_update = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.version}:{self.product.title}"
    
    class Meta:
        ordering = ['version']
        unique_together = [['product', 'version']]


class Style(models.Model):
    site = models.ForeignKey(Site, on_delete=models.PROTECT, related_name='styles')
    id_object = models.PositiveBigIntegerField(unique=True)
    title = models.CharField(max_length=511)
    image = models.URLField()
    url = models.URLField(blank=True)
    image_local = models.ImageField(upload_to="styles/images", null=True, blank=True)
    
    # personal attributes
    is_man = models.BooleanField(default=True, null=True, blank=True)
    age = models.IntegerField(null=True, blank=True)
    skin_color = models.CharField(max_length=7, null=True, blank=True)
    hair_color = models.CharField(max_length=7, null=True, blank=True)
    height = models.FloatField(null=True, blank=True)
    body_type = models.CharField(max_length=50, null=True, blank=True)

    last_update = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return self.title
    
    class Meta:
        ordering = ['id']


class StylePredict(models.Model):
    style = models.ForeignKey(Style, on_delete=models.CASCADE, related_name='predicts')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='style_predicts')
    products = models.ManyToManyField(Product, related_name='style_predicts')
    version = models.IntegerField(default=1)
    image_embedding = models.JSONField(null=True, blank=True)
    image_embedding_dim = models.IntegerField(null=True, blank=True)
    prediction_model = models.CharField(max_length=64, null=True, blank=True)
    predicted_at = models.DateTimeField(null=True, blank=True)
    # NEW: store the crop image file for this StylePredict
    crop_image = models.ImageField(upload_to="styles/crops", null=True, blank=True)
    # NEW: optional meta (bbox, score, category)
    crop_meta = models.JSONField(null=True, blank=True)
    last_update = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['version']

    def __str__(self):
        return f"{self.version}:{self.style.title}"