from django.core import validators
from django.core.exceptions import ValidationError
from django.utils.deconstruct import deconstructible
from django.utils.translation import gettext_lazy as _


@deconstructible
class CustomUsernameValidator(validators.RegexValidator):
    regex = r"^[\w-]+\Z"
    message = _(
        "نام کاربری را درست وارد کنید فقط حروف انگلیسی و "
        "اعداد و کارکتر های '-' , '_' قابل استفاده است!"
    )
    flags = 0


def validate_file_size(file):
    max_size_mb = 10

    if file.size > max_size_mb * 1024 * 1024:
        raise ValidationError(f'Files cannot be larger than {max_size_mb}MB!')
