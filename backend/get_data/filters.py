import django_filters
from .models import Product, Style, MyStyle


class ProductFilter(django_filters.FilterSet):
    def filter_category(self, queryset, name, value):
        """اگر category_id نامعتبر بود، لیست خالی بده به جای ارور"""
        return queryset.filter(predicts__category_id=value) if value else queryset

    def filter_color(self, queryset, name, value):
        """برای رنگ هم مشابه"""
        return queryset.filter(predicts__color_id=value) if value else queryset
    
    category_id = django_filters.NumberFilter(method='filter_category')
    color_id = django_filters.NumberFilter(method='filter_color')
    site_id = django_filters.NumberFilter(field_name="site_id")
    min_price = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='price', lookup_expr='lte')
    is_man = django_filters.BooleanFilter(field_name="is_man")

    class Meta:
        model = Product
        fields = (
            'category_id',
            'color_id',
            'site_id',
            'min_price',
            'max_price',
            'is_man',
        )



class StyleFilter(django_filters.FilterSet):
  is_man = django_filters.BooleanFilter(field_name="is_man")
  site_id = django_filters.AllValuesMultipleFilter(field_name="site")
  
  class Meta:
    model = Style
    fields = (
      'is_man',
      'site_id',
    )


class MyStyleFilter(django_filters.FilterSet):
  user_id = django_filters.BooleanFilter(field_name="user")
  
  class Meta:
    model = MyStyle
    fields = (
      'user_id',
    )
