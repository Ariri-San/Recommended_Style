import os

def delete_file_when_delete(instance, object_selected):
    """
    Deletes file from filesystem
    when corresponding `Model` object is deleted.
    """
    file = getattr(instance, object_selected)
    if file:
        try:
            if os.path.isfile(file.path):
                os.remove(file.path)
        except:
            return False

def delete_file_when_update(instance, object_selected, model):
    """
    Deletes old file from filesystem
    when corresponding `Model` object is updated
    with new file.
    """
    if not instance.pk:
        return False

    try:
        old_file = getattr(model.objects.get(pk=instance.pk), object_selected)
    except model.DoesNotExist:
        return False

    new_file = getattr(instance, object_selected)
    if not old_file == new_file and old_file:
        try:
            if os.path.isfile(old_file.path):
                os.remove(old_file.path)
        except:
            return False
