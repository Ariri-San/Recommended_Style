from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db.models import Q, Exists, OuterRef


from get_data.models import Product, Category, Color, ProductPredict
from get_data.scripts.torch_classifier import (
    ClipZeroShotClassifier,
)

import time
import re
from django.core.files.storage import default_storage


class Command(BaseCommand):
    help = "Classify products' images (type and color) using CLIP zero-shot and save predictions"

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=100, help="Max products to classify (ignored if --id-start/--id-end are used)")
        parser.add_argument("--id-start", type=int, default=None, help="Start Product ID (inclusive)")
        parser.add_argument("--id-end", type=int, default=None, help="End Product ID (inclusive)")
        parser.add_argument("--device", type=str, default=None, help="Force device cuda/cpu")
        parser.add_argument("--reclassify", action="store_true", help="Reclassify even if already classified")
        parser.add_argument("--peredict-version", type=int, default=1, help="Vrsion of peredict")

    def handle(self, *args, **options):
        start_ts = time.time()
        limit = options["limit"]
        id_start = options["id_start"]
        id_end = options["id_end"]
        device = options["device"]
        reclassify = options["reclassify"]
        version = options["peredict_version"]

        # Build queryset by ID range when provided; otherwise fallback to last N
        qs = Product.objects.annotate(
            has_this_version=Exists(
                ProductPredict.objects.filter(product=OuterRef("pk"), version=version)
            )
        ).all()
        if id_start is not None or id_end is not None:
            if id_start is not None:
                qs = qs.filter(pk__gte=id_start)
            if id_end is not None:
                qs = qs.filter(pk__lte=id_end)
            if not reclassify:
                qs = qs.filter(
                    Q(predicts__isnull=True) | Q(has_this_version=False)
                )
            qs = qs.order_by("id")
            self.stdout.write(self.style.WARNING(f"Selecting by ID range: start={id_start} end={id_end}"))
        else:
            if not reclassify:
                qs = qs.filter(
                    Q(predicts__isnull=True) | Q(has_this_version=False)
                )
            qs = qs[:limit]
            self.stdout.write(self.style.WARNING(f"Selecting last {limit} products (unclassified only={not reclassify})"))

        if not qs:
            self.stdout.write(self.style.WARNING("No products to classify."))
            return

        classifier = ClipZeroShotClassifier(device=device)
        # Use Category titles as type labels
        categories = list(Category.objects.all().order_by("title"))
        type_labels = [c.title for c in categories]
        # Use Color titles as color labels (fallback to defaults if table empty)
        colors = list(Color.objects.all().order_by("title"))
        color_labels = [c.title for c in colors] if colors else [
            "black", "white", "gray", "blue", "red", "green", "yellow", "purple", "brown", "pink", "orange"
        ]

        num_ok = 0
        num_fail = 0
        total_image_time = 0.0

        for product in qs:
            try:
                classifier_predict = classifier.predict(
                    image=product.image,
                    type_labels=type_labels,
                    color_labels=color_labels,
                )
                # save image under type-based folder
                safe_type = re.sub(r"[^a-z0-9_-]+", "-", (classifier_predict["type_label"] or "unknown").lower())
                # reuse existing local file if present; otherwise download once
                if product.image_local and product.image_local.name and default_storage.exists(product.image_local.name):
                    local_path = product.image_local.name
                else:
                    local_path = classifier.download_to_media(
                        product.image,
                        subdir=safe_type,
                        filename_stem=str(product.id),
                        overwrite=False,
                    )

                # map labels back to FKs if possible
                predicted_category = next((c for c in categories if c.title == classifier_predict["type_label"]), None)
                predicted_color_obj = next((c for c in colors if c.title == classifier_predict["color_label"]), None) if colors else None

                product.image_local.name = local_path
                
                try:
                    predict = ProductPredict.objects.get(product=product, version=version)
                except:
                    predict = ProductPredict(product=product, version=version)
                
                predict.category = predicted_category
                predict.category_score = classifier_predict["type_score"]
                predict.color = predicted_color_obj
                predict.color_score = classifier_predict["color_score"]
                predict.classification_model = "open_clip ViT-B-32 laion2b_s34b_b79k"
                predict.classified_at = timezone.now()
                # save embedding
                embedding = classifier.encode_image(product.image)
                predict.image_embedding = embedding.tolist()
                predict.image_embedding_dim = len(predict.image_embedding)
                
                product.save(update_fields=[
                    "image_local",
                ])
                predict.save()
                
                num_ok += 1
                total_image_time += classifier_predict["elapsed"]
                self.stdout.write(
                    self.style.SUCCESS(
                        f"OK #{product.id}: category={classifier_predict["type_label"]}({classifier_predict["type_score"]:.2f}) color={classifier_predict["color_label"]}({classifier_predict["color_score"]:.2f}) time={classifier_predict["elapsed"]}"
                    )
                )
            except Exception as e:
                num_fail += 1
                self.stderr.write(self.style.ERROR(f"FAIL #{product.id}: {e}"))

        total_elapsed = time.time() - start_ts
        avg_image_time = (total_image_time / max(num_ok, 1))
        self.stdout.write(
            self.style.SUCCESS(
                f"Done. ok={num_ok} fail={num_fail} total={num_ok+num_fail} job_time={total_elapsed:.2f}s avg_image={avg_image_time:.2f}s"
            )
        )


