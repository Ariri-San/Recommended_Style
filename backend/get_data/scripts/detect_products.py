from ast import Dict
from django.db import transaction
from django.conf import settings
from django.utils import timezone
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage


import shutil
import os
import base64
import time
from datetime import timedelta
from PIL import Image, ImageOps
import numpy as np
import json
import requests
import torch
import cv2
import io
import torchvision.transforms as transforms
from sklearn.metrics.pairwise import cosine_similarity
from collections import OrderedDict

from schp.networks import resnet101
from get_data.scripts.torch_classifier import ClipZeroShotClassifier
from get_data.models import Style, Product, StylePredict, Category, ProductPredict, Color, MyStyle, MyStylePredict


_MODELS_CACHE = {}


class FindSimilarProducts:
    def __init__(self):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self._load_models()
        self._define_transforms()
    
    
    def create_predict_from_crop(self, my_style: MyStyle, bbox: Dict, my_style_predict=None) -> MyStylePredict:
        start_time = time.time()
        
        image = self._open_imagefield(my_style.image)
        x1, x2 = bbox["x1"], bbox["x2"]
        y1, y2 = bbox["y1"], bbox["y2"]
        width, height = image.size

        # محدود کردن مختصات به داخل مرز تصویر
        x1 = max(0, min(x1, width))
        y1 = max(0, min(y1, height))
        x2 = max(0, min(x2, width))
        y2 = max(0, min(y2, height))

        # اطمینان از اینکه ناحیه مثبت است
        if x2 <= x1 or y2 <= y1:
            raise ValueError(f"Invalid crop box: ({x1}, {y1}, {x2}, {y2})")
        
        print(f"Processing Style {my_style.id} in [[{x1}, {y1}], [{x2}, {y2}]]")
        
        # crop کردن تصویر
        roi_img = np.array(image)[y1:y2+1, x1:x2+1]
        H, W, _ = roi_img.shape
        # ماسک کامل (همه سفید) برای پس‌زمینه شفاف
        roi_mask = np.ones((H, W), dtype=np.uint8) * 255
        
        pil_crop = Image.fromarray(roi_img).convert("RGBA")
        pil_crop.putalpha(Image.fromarray(roi_mask))
        
        # مسیر ذخیره crop
        crop_dir = os.path.join(settings.MEDIA_ROOT, "my_styles/crops", str(my_style.id))
        os.makedirs(crop_dir, exist_ok=True)
        crop_filename = f"manual_crop_{x1}_{y1}_{x2}_{y2}.png"
        crop_path = os.path.join(crop_dir, crop_filename)
        pil_crop.save(crop_path)
        
        # دسته‌بندی و رنگ
        categories = list(Category.objects.all().order_by("title"))
        type_labels = [c.title for c in categories]
        colors = list(Color.objects.all().order_by("title"))
        color_labels = [c.title for c in colors]
        
        classifier_predict = self.classifier.predict(
            image=pil_crop,
            type_labels=type_labels,
            color_labels=color_labels,
        )
        predicted_category = next((c for c in categories if c.title == classifier_predict["type_label"]), None)
        
        # embedding
        embedding = self.classifier.encode_image(pil_crop)
        image_embedding = embedding.tolist()
        
        # پیدا کردن محصولات مشابه
        similar_products = self._find_similar_products(image_embedding, len(image_embedding), predicted_category, my_style.user.is_man, 50)

        elapsed_seconds = time.time() - start_time
        elapsed_duration = timedelta(seconds=elapsed_seconds)
        # ایجاد MyStylePredict
        if my_style_predict and my_style_predict.style == my_style:
            style_predict = MyStylePredict.objects.get(id=my_style_predict.id)
            style_predict.category = predicted_category
            style_predict.predict_elapsed = elapsed_duration
            style_predict.crop_name = f"manual_crop_{x1}_{y1}_{x2}_{y2}"
            style_predict.crop_image = crop_path
            style_predict.image_embedding = json.dumps(image_embedding)
            style_predict.image_embedding_dim = len(categories)
            style_predict.bounding_box = json.dumps({"x1": x1, "y1": y1, "x2": x2, "y2": y2})
            style_predict.save()
        else:
            style_predict = MyStylePredict.objects.create(
                style=my_style,
                category=predicted_category,
                prediction_model='ViT-B-32 laion2b_s34b_b79k',
                predict_elapsed=elapsed_duration,
                crop_name=f"manual_crop_{x1}_{y1}_{x2}_{y2}",
                crop_image=crop_path,
                image_embedding=json.dumps(image_embedding),
                image_embedding_dim=len(categories),
                bounding_box=json.dumps({"x1": x1, "y1": y1, "x2": x2, "y2": y2})
            )
        
        style_predict.detected_products.set(similar_products)
        
        print(f"Finished Style {my_style.id}")
        
        return style_predict
        
    
    def extract_image(self, my_style: MyStyle) -> list[MyStylePredict]:
        print(f"Processing Style {my_style.id}")
        image = self._open_imagefield(my_style.image)
        
        # # DElete Predicts of Style
        # crop_dir = os.path.join(settings.MEDIA_ROOT, "my_styles/crops", str(my_style.id))
        # if os.path.exists(crop_dir):
        #     shutil.rmtree(crop_dir)
        # os.makedirs(crop_dir, exist_ok=True)
        
        with transaction.atomic():
            MyStylePredict.objects.filter(style=my_style).delete()
            detected_products_info = self._detect_products(image)
            
            for idx, prod_info in enumerate(detected_products_info):
                start_time = time.time()
                
                # Use Category titles as type labels
                categories = list(Category.objects.all().order_by("title"))
                type_labels = [c.title for c in categories]
                # Use Color titles as color labels (fallback to defaults if table empty)
                colors = list(Color.objects.all().order_by("title"))
                color_labels = [c.title for c in colors]
                
                classifier_predict = self.classifier.predict(
                    image=prod_info["image"],
                    type_labels=type_labels,
                    color_labels=color_labels,
                )
                predicted_category = next((c for c in categories if c.title == classifier_predict["type_label"]), None)
                embedding = self.classifier.encode_image(prod_info["image"])
                image_embedding = embedding.tolist()
                similar_products = self._find_similar_products(image_embedding, len(image_embedding), predicted_category, my_style.user.is_man, 50)

                crop_filename = f"{prod_info['category_name']}.png"
                crop_rel_path = os.path.join("my_styles/crops", str(my_style.id), crop_filename)
                crop_rel_path = self._save_crop_image(prod_info["image"], crop_rel_path)
                
                elapsed_seconds = time.time() - start_time
                elapsed_duration = timedelta(seconds=elapsed_seconds)
                
                style_predict = MyStylePredict.objects.create(
                    style=my_style,
                    category=predicted_category,
                    prediction_model='ViT-B-32 laion2b_s34b_b79k',
                    predict_elapsed=elapsed_duration,
                    crop_name=prod_info['category_name'],
                    crop_image=crop_rel_path,
                    image_embedding=json.dumps(image_embedding),
                    image_embedding_dim=len(categories),
                    bounding_box=json.dumps(prod_info['bounding_box'])
                )

                style_predict.detected_products.set(similar_products)

        print(f"Finished Style {my_style.id}")
    
    
    def extract_test_image(self, image: Image, is_man=None, product_n=30) -> list[MyStylePredict]:
        print(f"Processing test")
        
        crops = []
        
        with transaction.atomic():
            detected_products_info = self._detect_products(image)
            
            for idx, prod_info in enumerate(detected_products_info):
                start_time = time.time()
                
                # Use Category titles as type labels
                categories = list(Category.objects.all().order_by("title"))
                type_labels = [c.title for c in categories]
                # Use Color titles as color labels (fallback to defaults if table empty)
                colors = list(Color.objects.all().order_by("title"))
                color_labels = [c.title for c in colors]
                
                classifier_predict = self.classifier.predict(
                    image=prod_info['image'],
                    type_labels=type_labels,
                    color_labels=color_labels,
                )
                predicted_category = next((c for c in categories if c.title == classifier_predict["type_label"]), None)
                embedding = self.classifier.encode_image(prod_info['image'])
                image_embedding = embedding.tolist()
                similar_products = self._find_similar_products(image_embedding, len(image_embedding), is_man=is_man, top_n=product_n)

                elapsed_seconds = time.time() - start_time
                elapsed_duration = timedelta(seconds=elapsed_seconds)
                
                # Convert Pil Image to Base64
                buffer = io.BytesIO()
                prod_info['image'].thumbnail((512, 512))
                prod_info['image'].save(buffer, format="PNG", quality=70)
                img_str = base64.b64encode(buffer.getvalue()).decode("utf-8")
                
                crops.append({
                    "category": predicted_category,
                    "predict_elapsed": elapsed_duration,
                    "crop_name": prod_info['category_name'],
                    "crop_image": f"data:image/png;base64,{img_str}",
                    "bounding_box": json.dumps(prod_info['bounding_box']),
                    "products": similar_products
                })

        print(f"Finished Style Test")
        
        return crops
        

    def _load_models(self):
        global _MODELS_CACHE
        if _MODELS_CACHE.get('schp_model') is None:
            # مدل رو بدون pretrained اولیه بساز
            self.schp_model = resnet101(pretrained=None, num_classes=18)
            
            ckpt_path = os.path.join("backend", "schp", "checkpoints", "exp-schp-201908301523-atr.pth")
            # If checkpoint file missing, try to download from a configured URL (settings.SCHP_CHECKPOINT_URL
            # or env var SCHP_CHECKPOINT_URL). This allows repositories to avoid committing large checkpoint files.
            if not os.path.exists(ckpt_path):
                download_url = getattr(settings, "SCHP_CHECKPOINT_URL", None) or os.environ.get("SCHP_CHECKPOINT_URL")
                if download_url:
                    try:
                        os.makedirs(os.path.dirname(ckpt_path), exist_ok=True)
                        print(f"Checkpoint not found locally. Downloading from {download_url} ...")
                        with requests.get(download_url, stream=True, timeout=120) as r:
                            r.raise_for_status()
                            with open(ckpt_path, "wb") as fh:
                                for chunk in r.iter_content(chunk_size=8192):
                                    if chunk:
                                        fh.write(chunk)
                        print(f"Downloaded checkpoint to {ckpt_path}")
                    except Exception as e:
                        print(f"Failed to download checkpoint from {download_url}: {e}")
                else:
                    print(f"Checkpoint not found at {ckpt_path} and no SCHP_CHECKPOINT_URL configured. Continuing without weights.")

            if os.path.exists(ckpt_path):
                try:
                    checkpoint = torch.load(ckpt_path, map_location=self.device)
                    # Some checkpoints store a dict with "state_dict", others are raw state_dicts
                    state_dict = checkpoint.get("state_dict", checkpoint) if isinstance(checkpoint, dict) else checkpoint
                    new_state_dict = OrderedDict()
                    for k, v in state_dict.items():
                        name = k.replace("module.", "")  # پاک کردن module.
                        new_state_dict[name] = v
                    self.schp_model.load_state_dict(new_state_dict, strict=False)
                except Exception as e:
                    print(f"Failed to load checkpoint {ckpt_path}: {e}. Continuing without loading weights.")
            else:
                # No checkpoint available; continue with uninitialized model (as before).
                pass

            # مدل رو ببر روی GPU یا CPU و eval کن
            self.schp_model.to(self.device).eval()
            
            self.classifier = ClipZeroShotClassifier(device=self.device)
            # Cache models so subsequent instances reuse them (avoid re-loading heavy weights)
            _MODELS_CACHE['schp_model'] = self.schp_model
            _MODELS_CACHE['classifier'] = self.classifier
            # Optionally cache frequently used DB lists to avoid per-request queries
            try:
                self._categories_cache = list(Category.objects.all().order_by("title"))
                self._colors_cache = list(Color.objects.all().order_by("title"))
            except Exception:
                # If DB isn't ready (e.g., migrations), fall back to empty lists
                self._categories_cache = []
                self._colors_cache = []
        else:
            self.schp_model = _MODELS_CACHE['schp_model']
            self.classifier = _MODELS_CACHE['classifier']


    def _define_transforms(self):
        self.transform = transforms.Compose([
            transforms.Resize(224),
            transforms.CenterCrop(224),   # یا Pad تا مربع بشه
            transforms.ToTensor(),
            transforms.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225])
        ])
    
    
    def _open_imagefield(self, image_field):
        """Open a Django ImageField and apply EXIF orientation."""
        with image_field.open('rb') as f:
            img = Image.open(f)
            # Apply EXIF orientation to fix rotation
            img = ImageOps.exif_transpose(img)
            img.load()  # Ensure file is fully read before closing
        return img.convert("RGB")
    
    
    def _save_crop_image(self, pil_img, rel_path: str) -> str:
        """
        Save a PIL image to Django's default storage (local or remote).
        Returns the saved file path (relative to MEDIA_ROOT).
        """
        buf = io.BytesIO()
        pil_img.save(buf, format="PNG")
        buf.seek(0)
        saved_path = default_storage.save(rel_path, ContentFile(buf.read()))
        return saved_path


    def _detect_products(self, image):
        # image = self._open_imagefield(image_path)
        np_img = np.array(image)
        H, W, _ = np_img.shape

        preprocess = transforms.Compose([
            transforms.Resize((512, 512)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406],
                                std=[0.229, 0.224, 0.225])
        ])
        inp = preprocess(image).unsqueeze(0).to(self.device)

        with torch.no_grad():
            out = self.schp_model(inp)
            if isinstance(out, (list, tuple)):
                out = out[0]
                if isinstance(out, (list, tuple)):
                    out = out[0]
            parsing = out.squeeze(0).cpu().numpy().argmax(0)

        label_groups = {
            "hat": [1],
            "sunglasses": [3],
            "upper-clothes": [4],
            "pants": [6],
            "dress": [7],
            "belt": [8],
            "shoes": [9, 10],
        }
        min_pixels_by_class = {"sunglasses": 300, "hat": 700}
        default_min_pixels = 2000
        detected = []

        for cname, labels in label_groups.items():
            mask = np.zeros_like(parsing, dtype=np.uint8)
            for lb in labels:
                mask = mask | (parsing == lb).astype(np.uint8)
            if mask.sum() == 0:
                continue

            mask_resized = cv2.resize(mask, (W, H), interpolation=cv2.INTER_NEAREST).astype(np.uint8)
            mask_resized = (mask_resized * 255).astype(np.uint8)

            pixel_count = int(np.count_nonzero(mask_resized))
            if pixel_count < min_pixels_by_class.get(cname, default_min_pixels):
                print(f"Discarding {cname} (pixels={pixel_count} < {default_min_pixels})")
                continue

            kernel_size = 20 if cname == "shoes" else 5
            kernel = np.ones((kernel_size, kernel_size), np.uint8)
            mask_resized = cv2.dilate(mask_resized, kernel, iterations=1)

            ys, xs = np.where(mask_resized > 0)
            if len(xs) == 0 or len(ys) == 0:
                continue

            x1, x2 = xs.min(), xs.max()
            y1, y2 = ys.min(), ys.max()

            roi_img = np_img[y1:y2+1, x1:x2+1]
            roi_mask = mask_resized[y1:y2+1, x1:x2+1].astype(np.uint8)

            # تبدیل BGR → RGB و افزودن آلفا
            pil_img = Image.fromarray(roi_img).convert("RGBA")
            pil_img.putalpha(Image.fromarray(roi_mask))

            detected.append({
                "image": pil_img,
                "bounding_box": {"x1": int(x1), "y1": int(y1), "x2": int(x2), "y2": int(y2)},
                "category_name": cname
            })

        return detected

    def _build_product_embeddings_cache(self, emb_dim, category=None, is_man=None):
        """
        Build (and cache) normalized embeddings matrix and product list for a given embedding dim,
        optionally filtered by category and is_man. This avoids reloading/parsing DB embeddings each call.
        """
        global _MODELS_CACHE
        cache_root = _MODELS_CACHE.setdefault('product_embs', {})
        cat_id = 'all' if category is None else getattr(category, 'id', str(category))
        is_man_key = 'any' if is_man is None else int(is_man)
        key = f"{emb_dim}_{cat_id}_{is_man_key}"
        if key in cache_root:
            entry = cache_root[key]
            return entry['embs'], entry['products']

        qs = ProductPredict.objects.all() if is_man is None else ProductPredict.objects.filter(product__is_man=is_man)
        if category:
            qs = qs.filter(category=category)

        embs = []
        products = []
        for p in qs:
            # Preserve original behavior: if model stored image_embedding_dim, respect it
            if hasattr(p, "image_embedding_dim") and p.image_embedding_dim is not None:
                if p.image_embedding_dim != emb_dim:
                    continue
            if not getattr(p, "image_embedding", None):
                continue
            raw_emb = p.image_embedding
            vec = None
            # Accept several formats: JSON string, Python list, numpy array
            if isinstance(raw_emb, str):
                try:
                    vec = np.array(json.loads(raw_emb), dtype=np.float32)
                except Exception:
                    try:
                        vec = np.array(eval(raw_emb), dtype=np.float32)
                    except Exception:
                        # unable to parse, skip
                        continue
            elif isinstance(raw_emb, (list, tuple)):
                vec = np.array(raw_emb, dtype=np.float32)
            elif isinstance(raw_emb, np.ndarray):
                vec = raw_emb.astype(np.float32)
            else:
                # unknown format, skip
                continue
            if vec is None or vec.shape[0] != emb_dim:
                continue
            norm = np.linalg.norm(vec)
            if norm == 0:
                continue
            vec = vec / norm
            embs.append(vec)
            products.append(p.product)

        if not embs:
            cache_root[key] = {'embs': None, 'products': []}
            return None, []

        emb_matrix = np.vstack(embs)  # shape (N, D)
        cache_root[key] = {'embs': emb_matrix, 'products': products}
        return emb_matrix, products


    def _generate_embedding(self, img_input):
        img = Image.open(img_input).convert('RGB') if isinstance(img_input,str) else img_input
        t = self.transform(img).unsqueeze(0).to(self.device)
        with torch.no_grad():
            emb = self.feature_extractor(t).squeeze().cpu().numpy().reshape(-1)
        return emb, emb.shape[0]

    def _find_similar_products(self, query_emb, emb_dim, category=None, is_man=None, top_n=30):
        # Use cached embedding matrix if available (faster than per-row JSON parsing + sklearn)
        emb_matrix, products = self._build_product_embeddings_cache(emb_dim, category=category, is_man=is_man)
        if emb_matrix is None:
            return []

        q = np.array(query_emb, dtype=np.float32)
        qnorm = np.linalg.norm(q)
        if qnorm == 0:
            return []
        q = q / qnorm  # ensure unit vector for cosine similarity -> dot product

        # fast dot product: (N, D) dot (D,) -> (N,)
        sims = emb_matrix.dot(q)

        # use argpartition for faster top-k when N large
        N = sims.shape[0]
        if top_n < N:
            idxs = np.argpartition(-sims, top_n)[:top_n]
            # sort the top indexes
            idxs = idxs[np.argsort(-sims[idxs])]
        else:
            idxs = np.argsort(-sims)

        return [products[i] for i in idxs]
