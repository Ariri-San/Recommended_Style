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
    readonly_fields = ['crop_thumbnail', 'thumbnail', 'product_thumbnails']
    filter_horizontal = ("products",)
    
    def product_thumbnails(self, instance):
        products = instance.products.all()
        
        if not products:
            return "-"
        
        items = []
        for p in products:
            if p.image:
                items.append(f"""
                    <div style="
                        display:flex;
                        align-items:center;
                        margin-bottom:8px;
                        border:1px solid #eee;
                        padding:6px;
                        border-radius:8px;
                        background-color:#fafafa;
                    ">
                        <img src="{p.image}" width="60" height="60" 
                             style="object-fit:cover;border-radius:6px;margin-right:10px;" />
                        <span style="font-size:14px;color:#333;">{p.name if hasattr(p, 'name') else str(p)}</span>
                    </div>
                """)

        return format_html("".join(items))

    def thumbnail(self, instance):
        if instance.style.image_local != '':
            return format_html(f'<img src="{instance.style.image_local.url}" class="thumbnail" />')
        return ''
    
    def crop_thumbnail(self, instance):
        if instance.crop_image != '':
            return format_html(f'<img src="{instance.crop_image.url}" class="thumbnail" />')
        return ''
