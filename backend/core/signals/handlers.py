from itertools import islice
from django.conf import settings
from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from core.signals.remove_functions import delete_file_when_delete, delete_file_when_update
from core.models import User


#  DELETE IMAGE OF  -- User --
@receiver(post_delete, sender=User)
def auto_delete_file_user_on_delete(sender, instance, **kwargs):
    delete_file_when_delete(instance, "image")

@receiver(pre_save, sender=User)
def auto_delete_file_user_on_change(sender, instance, **kwargs):
    delete_file_when_update(instance, "image", User)


