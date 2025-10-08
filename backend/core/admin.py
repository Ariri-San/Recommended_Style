from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _

from django.contrib import admin, messages
from . import models




@admin.register(models.User)
class CustomUserAdmin(UserAdmin):
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (_("Personal info"), {"fields": ("username", "image", "is_man", "image_embedding")}),
        (_("Personal Sizes"), {"fields": ("height", "weight")}),
        (_("Personal Colors"), {"fields": ("hair_color", "skin_color")}),
        (
            _("Permissions"),
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                ),
            },
        ),
        (_("Important dates"), {"fields": ("last_login", "date_joined")}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("username", "password1", "password2"),
            },
        ),
    )
    
    readonly_fields = ["image_embedding"]
    list_display = ("username", "email", "is_active", "is_staff", "date_joined")
    list_filter = ('is_active', 'is_staff', 'is_man')
    search_fields = ["username", "email"]
    ordering = ["-date_joined"]