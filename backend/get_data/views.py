from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, APIView
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.viewsets import ModelViewSet, GenericViewSet, mixins
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend

from core.permissions import IsAdminOrReadOnly


# Create your views here.


class SpecificationKeyViewSet(mixins.ListModelMixin, GenericViewSet):
    # queryset = models.SpecificationKey.objects.all()
    # serializer_class = serializers.SpecificationKeySerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    # filterset_class = SpecificationKeyFilter
    search_fields = ['title', 'description']
