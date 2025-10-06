from django.contrib.auth.tokens import default_token_generator
from django.utils.timezone import now
from django.shortcuts import get_object_or_404
from django.contrib.contenttypes.models import ContentType

from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, APIView
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.viewsets import ModelViewSet, GenericViewSet, mixins
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound
from rest_framework.response import Response

from djoser import signals, utils
from djoser.compat import get_user_email
from djoser.conf import settings


from . import models, serializers
from .permissions import IsAdminOrReadOnly

# Create your views here.



class ContentTypeAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(ContentType.objects.order_by("id").values("id", "app_label", "model").all())



# class UserViewSet(ModelViewSet):
#     serializer_class = settings.SERIALIZERS.user
#     queryset = models.User.objects.all()
#     permission_classes = settings.PERMISSIONS.user
#     token_generator = default_token_generator
#     lookup_field = settings.USER_ID_FIELD

#     def permission_denied(self, request, **kwargs):
#         if (
#             settings.HIDE_USERS
#             and request.user.is_authenticated
#             and self.action in ["update", "partial_update", "list", "retrieve"]
#         ):
#             raise NotFound()
#         super().permission_denied(request, **kwargs)

#     def get_queryset(self):
#         user = self.request.user
#         queryset = super().get_queryset()
#         if settings.HIDE_USERS and self.action == "list" and not user.is_staff:
#             queryset = queryset.filter(pk=user.pk)
#         return queryset

#     def get_permissions(self):
#         if self.action == "create":
#             self.permission_classes = settings.PERMISSIONS.user_create
#         elif self.action == "list":
#             self.permission_classes = settings.PERMISSIONS.user_list
#         elif self.action == "reset_password":
#             self.permission_classes = settings.PERMISSIONS.password_reset
#         elif self.action == "reset_password_confirm":
#             self.permission_classes = settings.PERMISSIONS.password_reset_confirm
#         elif self.action == "set_username":
#             self.permission_classes = settings.PERMISSIONS.set_username
#         elif self.action == "destroy" or (
#             self.action == "me" and self.request and self.request.method == "DELETE"
#         ):
#             self.permission_classes = settings.PERMISSIONS.user_delete
#         return super().get_permissions()

#     def get_serializer_class(self):
#         if self.action == "create":
#             if settings.USER_CREATE_PASSWORD_RETYPE:
#                 return settings.SERIALIZERS.user_create_password_retype
#             return settings.SERIALIZERS.user_create
#         elif self.action == "destroy" or (
#             self.action == "me" and self.request and self.request.method == "DELETE"
#         ):
#             return settings.SERIALIZERS.user_delete
#         elif self.action == "reset_password":
#             return settings.SERIALIZERS.password_reset
#         elif self.action == "reset_password_confirm":
#             if settings.PASSWORD_RESET_CONFIRM_RETYPE:
#                 return settings.SERIALIZERS.password_reset_confirm_retype
#             return settings.SERIALIZERS.password_reset_confirm
#         elif self.action == "set_username":
#             if settings.SET_USERNAME_RETYPE:
#                 return settings.SERIALIZERS.set_username_retype
#             return settings.SERIALIZERS.set_username
#         elif self.action == "me":
#             if self.request.method == "GET":
#                 return settings.SERIALIZERS.user
#             return settings.SERIALIZERS.current_user
#         elif self.action == "change_image":
#             return serializers.UserUpdateCustomSerializer

#         return self.serializer_class

#     def get_instance(self):
#         return self.request.user

#     def perform_create(self, serializer, *args, **kwargs):
#         user = serializer.save(*args, **kwargs)
#         signals.user_registered.send(
#             sender=self.__class__, user=user, request=self.request
#         )

#         context = {"user": user}
#         to = [get_user_email(user)]
#         if settings.SEND_ACTIVATION_EMAIL:
#             settings.EMAIL.activation(self.request, context).send(to)
#         elif settings.SEND_CONFIRMATION_EMAIL:
#             settings.EMAIL.confirmation(self.request, context).send(to)

#     def perform_update(self, serializer, *args, **kwargs):
#         super().perform_update(serializer, *args, **kwargs)
#         user = serializer.instance
#         signals.user_updated.send(
#             sender=self.__class__, user=user, request=self.request
#         )

#         # should we send activation email after update?
#         if settings.SEND_ACTIVATION_EMAIL and not user.is_active:
#             context = {"user": user}
#             to = [get_user_email(user)]
#             settings.EMAIL.activation(self.request, context).send(to)

#     def destroy(self, request, *args, **kwargs):
#         instance = self.get_object()
#         serializer = self.get_serializer(instance, data=request.data)
#         serializer.is_valid(raise_exception=True)

#         if instance == request.user:
#             utils.logout_user(self.request)
#         self.perform_destroy(instance)
#         return Response(status=status.HTTP_204_NO_CONTENT)

#     @action(["get", "put", "patch", "delete"], detail=False)
#     def me(self, request, *args, **kwargs):
#         self.get_object = self.get_instance
#         if request.method == "GET":
#             return self.retrieve(request, *args, **kwargs)
#         elif request.method == "PUT":
#             return self.update(request, *args, **kwargs)
#         elif request.method == "PATCH":
#             return self.partial_update(request, *args, **kwargs)
#         elif request.method == "DELETE":
#             return self.destroy(request, *args, **kwargs)


#     @action(["post"], detail=False)
#     def reset_password(self, request, *args, **kwargs):
#         serializer = self.get_serializer(data=request.data)
#         serializer.is_valid(raise_exception=True)
#         user = serializer.get_user()

#         if user:
#             context = {"user": user}
#             to = [get_user_email(user)]
#             settings.EMAIL.password_reset(self.request, context).send(to)

#         return Response(status=status.HTTP_204_NO_CONTENT)

#     @action(["post"], detail=False)
#     def reset_password_confirm(self, request, *args, **kwargs):
#         serializer = self.get_serializer(data=request.data)
#         serializer.is_valid(raise_exception=True)

#         serializer.user.set_password(serializer.data["new_password"])
#         if hasattr(serializer.user, "last_login"):
#             serializer.user.last_login = now()
#         serializer.user.save()

#         if settings.PASSWORD_CHANGED_EMAIL_CONFIRMATION:
#             context = {"user": serializer.user}
#             to = [get_user_email(serializer.user)]
#             settings.EMAIL.password_changed_confirmation(self.request, context).send(to)
#         return Response(status=status.HTTP_204_NO_CONTENT)

#     @action(["post"], detail=False, url_path=f"set_{models.User.USERNAME_FIELD}")
#     def set_username(self, request, *args, **kwargs):
#         serializer = self.get_serializer(data=request.data)
#         serializer.is_valid(raise_exception=True)
#         user = self.request.user
#         new_username = serializer.data["new_" + models.User.USERNAME_FIELD]

#         setattr(user, models.User.USERNAME_FIELD, new_username)
#         user.save()
#         if settings.USERNAME_CHANGED_EMAIL_CONFIRMATION:
#             context = {"user": user}
#             to = [get_user_email(user)]
#             settings.EMAIL.username_changed_confirmation(self.request, context).send(to)
#         return Response(status=status.HTTP_204_NO_CONTENT)
    
    
#     @action(["post"], detail=False, url_path=f"change_image")
#     def change_image(self, request, *args, **kwargs):
#         user = self.request.user
        
#         if user.id:
#             serializer = self.get_serializer(data=request.data)
#             serializer.is_valid(raise_exception=True)
            
#             new_user = serializer.save()
#             new_user_serializer = serializers.UserSerializer(new_user)
            
#             return Response(new_user_serializer.data, status=status.HTTP_200_OK)
#         return Response(status=status.HTTP_401_UNAUTHORIZED)


