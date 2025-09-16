from django.core.management.base import BaseCommand

from get_data.models import Category, Color
from get_data.scripts.torch_classifier import DEFAULT_TYPE_LABELS, DEFAULT_COLOR_LABELS


class Command(BaseCommand):
    help = "Seed default Category and Color records if they do not exist"

    def add_arguments(self, parser):
        parser.add_argument("--only", choices=["categories", "colors", "all"], default="all",
                            help="What to seed: categories, colors, or all")

    def handle(self, *args, **options):
        only = options["only"]
        created_categories = 0
        created_colors = 0

        if only in ("categories", "all"):
            for title in DEFAULT_TYPE_LABELS:
                _, created = Category.objects.get_or_create(title=title)
                if created:
                    created_categories += 1
            self.stdout.write(self.style.SUCCESS(
                f"Categories seeded. Created: {created_categories}, Total now: {Category.objects.count()}"
            ))

        if only in ("colors", "all"):
            for title in DEFAULT_COLOR_LABELS:
                _, created = Color.objects.get_or_create(title=title)
                if created:
                    created_colors += 1
            self.stdout.write(self.style.SUCCESS(
                f"Colors seeded. Created: {created_colors}, Total now: {Color.objects.count()}"
            ))

