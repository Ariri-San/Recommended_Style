import django_filters
from .models import Product, Size, SpecificationKey, OrderItem, Brand, OrderSeller, Category


class ProductFilter(django_filters.FilterSet):
  category_id = django_filters.AllValuesFilter(field_name="category")
  collection_id = django_filters.AllValuesFilter(field_name="category__collection")
  brand_id = django_filters.AllValuesFilter(field_name="brand")
  size_id = django_filters.AllValuesMultipleFilter(field_name="sizes")
  color_id = django_filters.AllValuesMultipleFilter(field_name="colors")
  specifications = django_filters.AllValuesMultipleFilter(field_name="specifications")
  min_price = django_filters.NumberFilter(field_name='unit_price', lookup_expr='gte')
  max_price = django_filters.NumberFilter(field_name='unit_price', lookup_expr='lte')
  is_man = django_filters.BooleanFilter(field_name="is_man")
  available_inventory = django_filters.BooleanFilter(field_name="available_inventory", method='filter_available_products')
  
  def filter_available_products(self, queryset, name, value):
    """
    Filter products based on inventory availability.
    If show_available=True: show only products that have at least one inventory item with number > 0
    If show_available=False: show only products where all inventory items have number = 0
    If not provided: show all products
    """
    if value is not None:
      if value:
        # Show only products with available inventory (at least one item with number > 0)
        return queryset.filter(inventories__number__gt=0).distinct()
      else:
        # Show only products with no available inventory (all items have number = 0)
        # First get products that have at least one inventory item
        products_with_inventory = queryset.filter(inventories__isnull=False).distinct()
        # Then filter out products that have any inventory with number > 0
        return products_with_inventory.exclude(inventories__number__gt=0)
    return queryset
  
  
  class Meta:
    model = Product
    fields = (
      'category_id',
      'collection_id',
      'brand_id',
      'size_id',
      'color_id',
      'specifications',
      'min_price',
      'max_price',
      'is_man',
      'available_inventory',
    )



# class ProductFilter(django_filters.FilterSet):
#   class Meta:
#     model = Product
#     fields = {
#       'category_id': ['exact'],
#       'brand_id': ['exact'],
#       'unit_price': ['gt', 'lt']
#     }


class CategoryFilter(django_filters.FilterSet):
  collection_id = django_filters.AllValuesFilter(field_name="collection")
  brand_id = django_filters.AllValuesFilter(field_name="products__brand")
  
  class Meta:
    model = Category
    fields = (
      'collection_id',
      'brand_id',
    )


class SizeFilter(django_filters.FilterSet):
  class Meta:
    model = Size
    fields = {
      'category_id': ['exact']
    }


class SpecificationKeyFilter(django_filters.FilterSet):
  category_id = django_filters.AllValuesFilter(field_name="category")
  
  class Meta:
    model = SpecificationKey
    fields = (
      'category_id',
    )


class OrderSellerFilter(django_filters.FilterSet):
  payment_status = django_filters.AllValuesFilter(field_name="payment_status")
  
  class Meta:
    model = OrderSeller
    fields = ('payment_status',)


class BrandFilter(django_filters.FilterSet):
  collection_id = django_filters.AllValuesFilter(field_name="collection")

  class Meta:
    model = Brand
    fields = ('collection_id',)