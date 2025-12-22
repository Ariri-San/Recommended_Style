from django.contrib import admin
from django.utils.html import format_html, urlencode
from django.urls import reverse

from . import models
# Register your models here.


admin.site.register(models.Site)
admin.site.register(models.Color)
# admin.site.register(models.StylePredict)

@admin.register(models.Category)
class CategoryAdmin(admin.ModelAdmin):
    search_fields = ['title']

@admin.register(models.Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ["id", "title", "is_man", "price"]
    readonly_fields = ['thumbnail']
    list_filter = ['is_man', 'predicts__category']
    search_fields = ['title', 'predicts__category__title']

    def thumbnail(self, instance):
        if instance.image != '':
            return format_html(f'<img src="{instance.image}"  width="250px" height="200px" class="thumbnail" />')
        return ''

@admin.register(models.ProductPredict)
class ProductPredictAdmin(admin.ModelAdmin):
    list_display = ["id", "product", "category"]
    readonly_fields = ["product", "version", 'thumbnail']
    list_filter = ['category']
    search_fields = ['predict__title', 'category__title']
    

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
            return format_html(f'<img src="{instance.image}" width="100%" height="300" class="thumbnail" />')
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
    list_filter = ['products__predicts__category']
    
    def product_thumbnails(self, instance, num_rows=2):
        products = instance.products.all()
        if not products.exists():
            return "—"

        # تقسیم محصولات به ردیف‌ها
        total = len(products)
        rows = []
        per_row = (total + num_rows - 1) // num_rows  # تقسیم مساوی

        for i in range(0, total, per_row):
            row = products[i:i + per_row]
            items = []
            for p in row:
                if p.image:
                    url = reverse("admin:get_data_product_change", args=[p.id])
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
                            <a href="{url}" style="display:flex; align-items:center; text-decoration:none; color:inherit;">
                                <img src="{p.image}" width="60" height="60" style="object-fit:cover;border-radius:6px;margin-right:10px;" />
                                <span style="font-size:14px;color:#333;">{p.name if hasattr(p, 'name') else str(p)}</span>
                            </a>
                        </div>
                    """)
            rows.append(f'<div style="display:flex; flex-wrap:wrap; margin-bottom:4px; justify-content:space-around;">{"".join(items)}</div>')

        return format_html("".join(rows))

    def thumbnail(self, instance):
        if instance.style.image_local != '':
            return format_html(f'<img src="{instance.style.image_local.url}" width="100%" height="300" class="thumbnail" />')
        return ''
    
    def crop_thumbnail(self, instance):
        if instance.crop_image != '':
            return format_html(f'<img src="{instance.crop_image.url}" width="100%" height="300" class="thumbnail" />')
        return ''



@admin.register(models.MyStyle)
class MyStyleAdmin(admin.ModelAdmin):
    list_display = ["id", "user"]
    readonly_fields = ['thumbnail']

    def thumbnail(self, instance):
        if instance.image != '':
            return format_html(f'<img src="{instance.image.url}" width="100%" height="300" class="thumbnail" />')
        return ''



@admin.register(models.MyStylePredict)
class MyStylePredictAdmin(admin.ModelAdmin):
    list_display = ["id", "last_update", "style_id", "style_username", "style_user_is_man"]
    readonly_fields = ['crop_thumbnail', 'thumbnail', 'product_thumbnails']
    filter_horizontal = ("detected_products",)
    list_filter = ['style__user__is_man', 'detected_products__predicts__category']
    
    def style_id(self, obj):
        return obj.style.id
    
    @admin.display(description='Style UserName')
    def style_username(self, obj):
        return obj.style.user.username
    
    @admin.display(boolean=True, description='Is Man')
    def style_user_is_man(self, obj):
        return obj.style.user.is_man
    
    def product_thumbnails(self, instance, num_rows=2):
        products = instance.detected_products.all()
        if not products.exists():
            return "—"

        # تقسیم محصولات به ردیف‌ها
        total = len(products)
        rows = []
        per_row = (total + num_rows - 1) // num_rows  # تقسیم مساوی

        for i in range(0, total, per_row):
            row = products[i:i + per_row]
            items = []
            for p in row:
                if p.image:
                    url = reverse("admin:get_data_product_change", args=[p.id])
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
                            <a href="{url}" style="display:flex; align-items:center; text-decoration:none; color:inherit;">
                                <img src="{p.image}" width="60" height="60" style="object-fit:cover;border-radius:6px;margin-right:10px;" />
                                <span style="font-size:14px;color:#333;">{p.name if hasattr(p, 'name') else str(p)}</span>
                            </a>
                        </div>
                    """)
            rows.append(f'<div style="display:flex; flex-wrap:wrap; margin-bottom:4px; justify-content:space-around;">{"".join(items)}</div>')

        return format_html("".join(rows))

    def thumbnail(self, instance):
        if instance.style.image != '':
            return format_html(f'<img src="{instance.style.image.url}" width="100%" height="300" class="thumbnail" />')
        return ''
    
    def crop_thumbnail(self, instance):
        if instance.crop_image != '':
            return format_html(f'<img src="{instance.crop_image.url}" width="100%" height="300" class="thumbnail" />')
        return ''