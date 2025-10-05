from django.apps import AppConfig


class GetDataConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "get_data"

    def ready(self) -> None:
        import get_data.signals.handlers
