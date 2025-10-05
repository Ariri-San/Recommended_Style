from itertools import islice
from django.conf import settings
from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from core.signals.remove_functions import delete_file_when_delete, delete_file_when_update
from ..models import Product, Style, StylePredict, MyStyle, MyStylePredict


#  DELETE IMAGE OF  -- Product --
@receiver(post_delete, sender=Product)
def auto_delete_file_user_on_delete(sender, instance, **kwargs):
    delete_file_when_delete(instance, "image_local")

@receiver(pre_save, sender=Product)
def auto_delete_file_user_on_change(sender, instance, **kwargs):
    delete_file_when_update(instance, "image_local", Product)


#  DELETE IMAGE OF  -- Style --
@receiver(post_delete, sender=Style)
def auto_delete_file_user_on_delete(sender, instance, **kwargs):
    delete_file_when_delete(instance, "image_local")

@receiver(pre_save, sender=Style)
def auto_delete_file_user_on_change(sender, instance, **kwargs):
    delete_file_when_update(instance, "image_local", Style)


#  DELETE IMAGE OF  -- StylePredict --
@receiver(post_delete, sender=StylePredict)
def auto_delete_file_user_on_delete(sender, instance, **kwargs):
    delete_file_when_delete(instance, "crop_image")

@receiver(pre_save, sender=StylePredict)
def auto_delete_file_user_on_change(sender, instance, **kwargs):
    delete_file_when_update(instance, "crop_image", StylePredict)


#  DELETE IMAGE OF  -- MyStyle --
@receiver(post_delete, sender=MyStyle)
def auto_delete_file_user_on_delete(sender, instance, **kwargs):
    delete_file_when_delete(instance, "image")

@receiver(pre_save, sender=MyStyle)
def auto_delete_file_user_on_change(sender, instance, **kwargs):
    delete_file_when_update(instance, "image", MyStyle)


#  DELETE IMAGE OF  -- MyStylePredict --
@receiver(post_delete, sender=MyStylePredict)
def auto_delete_file_user_on_delete(sender, instance, **kwargs):
    delete_file_when_delete(instance, "crop_image")

@receiver(pre_save, sender=MyStylePredict)
def auto_delete_file_user_on_change(sender, instance, **kwargs):
    delete_file_when_update(instance, "crop_image", MyStylePredict)
