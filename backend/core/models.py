from concurrent.futures import ThreadPoolExecutor, as_completed
from PIL import Image, ExifTags
from io import BytesIO
import os
import numpy as np
from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.core.files import File
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

from colorfield.fields import ColorField

from get_data.scripts.face_embedding import FaceEmbeddingExtractor
from .validators import CustomUsernameValidator, validate_file_size



def compress_image(image, size_kb=300, quality=30):
    if not image:
        return None

    try:
        if image.size > size_kb * 1024:
            im = Image.open(image)

            # Fix rotation based on EXIF
            try:
                for orientation in ExifTags.TAGS.keys():
                    if ExifTags.TAGS[orientation] == 'Orientation':
                        break

                exif = im._getexif()
                if exif and orientation in exif:
                    if exif[orientation] == 3:
                        im = im.rotate(180, expand=True)
                    elif exif[orientation] == 6:
                        im = im.rotate(270, expand=True)
                    elif exif[orientation] == 8:
                        im = im.rotate(90, expand=True)
            except Exception:
                pass

            # Transparency check
            has_transparency = False
            if im.mode in ('RGBA', 'LA'):
                alpha = im.split()[-1]
                has_transparency = alpha.getextrema()[0] < 255
            elif im.mode == 'P' and im.info.get('transparency') is not None:
                has_transparency = True

            im_io = BytesIO()
            if has_transparency:
                im.save(im_io, format='PNG', optimize=True)
                ext = "png"
            else:
                if im.mode != 'RGB':
                    im = im.convert('RGB')
                im.save(im_io, format='JPEG', quality=quality, optimize=True)
                ext = "jpg"

            filename = os.path.basename(image.name)
            filename_without_ext = os.path.splitext(filename)[0]
            new_filename = f"{filename_without_ext}_compressed.{ext}"

            new_image = File(im_io, name=new_filename)
            return new_image

        return image
    except Exception as e:
        print(f"Error in image compression: {e}")
        return image


def is_number(value):
    numbers = [str(num) for num in range(10)]
    for char in value:
        if char not in numbers:
            raise ValidationError(_("%(value)s is not number"), params={"value": value})


#  ----------  Classes  ----------
class User(AbstractUser):
    username = models.CharField(
        _("username"),
        max_length=255,
        unique=True,
        help_text=_(
            "حداکثر کارکتر 150 تا است و فقط اعداد و حروف و '_' و '-' قابل استفاده است."
        ),
        validators=[CustomUsernameValidator()],
        error_messages={
            "unique": _("یک کاربر با این اسم ساخته شده است!"),
        },
    )
    
    is_man = models.BooleanField(verbose_name=_("جنسیت"), blank=True, null=True)
    email = models.EmailField(verbose_name=_("ایمیل"), blank=True, null=True)
    image = models.ImageField(verbose_name=_("عکس پروفایل"), upload_to="core/users", blank=True, null=True)
    height = models.DecimalField(max_digits=5, decimal_places=2, help_text='قد کاربر', blank=True, null=True)
    weight = models.DecimalField(max_digits=5, decimal_places=2, help_text='وزن کاربر', blank=True, null=True)
    hair_color = ColorField(blank=True, null=True, help_text='رنگ مو')
    skin_color = ColorField(blank=True, null=True, help_text='رنگ پوست')
    birth_day = models.DateField(blank=True, null=True, help_text='تاریخ تولد')
    image_embedding = models.JSONField(null=True, blank=True)
    is_show = models.BooleanField(default=True)
    
    def save(self, *args, **kwargs):
        # if not self.image:
        #     return super(User, self).save(*args, **kwargs)

        # face_embedding_extractor = FaceEmbeddingExtractor()

        # # فایل رو یکبار کامل بخون و کپی بگیر
        # self.image.seek(0)
        # img_bytes = self.image.read()

        # img_stream_1 = BytesIO(img_bytes)
        # img_stream_2 = BytesIO(img_bytes)

        # results = {}

        # with ThreadPoolExecutor(max_workers=2) as executor:
        #     futures = {
        #         executor.submit(face_embedding_extractor.get_embedding, img_stream_1): 'embedding',
        #         executor.submit(compress_image, File(img_stream_2, name=self.image.name)): 'compressed'
        #     }

        #     for future in as_completed(futures):
        #         task_name = futures[future]
        #         try:
        #             result = future.result(timeout=60)
        #             results[task_name] = result
        #         except Exception as e:
        #             print(f"Worker error in {task_name}: {e}")

        # if 'compressed' in results:
        #     self.image = results['compressed']

        # if 'embedding' in results:
        #     self.image_embedding = json.dumps(results['embedding'].tolist())

        self.image = compress_image(self.image)
        return super().save(*args, **kwargs)
    
    def __str__(self) -> str:
        return str(self.username)