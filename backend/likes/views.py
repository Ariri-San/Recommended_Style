from rest_framework import status
from rest_framework.viewsets import ModelViewSet, GenericViewSet, mixins
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import LikedItem
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from core.pagination import DefaultPagination
from .filters import LikedItemFilter
from .serializers import LikedItemSerializer, CreateLikedItemSerializer

# Create your views here.



class LikedItemViewSet(GenericViewSet,
            mixins.CreateModelMixin,
            mixins.DestroyModelMixin,
            mixins.ListModelMixin):
    
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_class = LikedItemFilter
    pagination_class = DefaultPagination

    
    def get_serializer_class(self):
        if self.request.method == "POST":
            return CreateLikedItemSerializer
        return LikedItemSerializer
    
    def get_queryset(self):
        return LikedItem.objects.filter(user=self.request.user)
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        like = LikedItem.objects.filter(object_id=serializer.validated_data["object_id"], content_type=serializer.validated_data["content_type"], user=request.user)
        
        if like.exists():
            like.delete()
            return Response({"data": serializer.data, "like": False}, status=status.HTTP_200_OK)
        
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response({"data": serializer.data, "like": True}, status=status.HTTP_201_CREATED, headers=headers)
