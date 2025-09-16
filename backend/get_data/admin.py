from django.contrib import admin
from django.utils.html import format_html, urlencode

from . import models
# Register your models here.


admin.site.register(models.Site)
admin.site.register(models.Category)
admin.site.register(models.Color)


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
    readonly_fields = ['thumbnail']

    def thumbnail(self, instance):
        if instance.image != '':
            return format_html(f'<img src="{instance.image}" class="thumbnail" />')
        return ''