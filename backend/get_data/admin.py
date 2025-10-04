from django.contrib import admin
from django.utils.html import format_html, urlencode

from . import models
# Register your models here.


admin.site.register(models.Site)
admin.site.register(models.Category)
admin.site.register(models.Color)
# admin.site.register(models.StylePredict)



@admin.register(models.Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ["id", "title", "is_man", "price"]
    readonly_fields = ['thumbnail']

    def thumbnail(self, instance):
        if instance.image != '':
            return format_html(f'<img src="{instance.image}"  width="250px" height="200px" class="thumbnail" />')
        return ''

@admin.register(models.ProductPredict)
class ProductPredictAdmin(admin.ModelAdmin):
    list_display = ["id", "product", "category"]
    readonly_fields = ["product", "version", 'thumbnail']

    def thumbnail(self, instance):
        if instance.product.image != '':
            return format_html(f'<img src="{instance.product.image}" class="thumbnail" />')
        return ''


@admin.register(models.Style)
class StyleAdmin(admin.ModelAdmin):
    list_display = ["id", "title", "is_man"]
    readonly_fields = ['thumbnail', 'skin_color_2', 'hair_color_2']

    def thumbnail(self, instance):
        if instance.image != '':
            return format_html(f'<img src="{instance.image}" class="thumbnail" />')
        return ''
    
    def skin_color_2(self, instance):
        if instance.skin_color != '':
            return format_html(f'<div style="background-color:{instance.skin_color}; width:20px; height:20px"></div>')
        return ''
    
    def hair_color_2(self, instance):
        if instance.hair_color != '':
            return format_html(f'<div style="background-color:{instance.hair_color}; width:20px; height:20px"></div>')
        return ''

@admin.register(models.StylePredict)
class StylePredictAdmin(admin.ModelAdmin):
    list_display = ["version", "last_update", "style"]
    readonly_fields = ['crop_thumbnail', 'thumbnail']

    def thumbnail(self, instance):
        if instance.style.image != '':
            return format_html(f'<img src="{instance.style.image}" class="thumbnail" />')
        return ''
    
    def crop_thumbnail(self, instance):
        if instance.crop_image != '':
            return format_html(f'<img src="{instance.crop_image.url}" class="thumbnail" />')
        return ''
