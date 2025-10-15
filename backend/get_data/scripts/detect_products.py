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
            
            # حذف "module." از کلیدهای state_dict
            checkpoint = torch.load("backend/schp/checkpoints/exp-schp-201908301523-atr.pth", map_location=self.device)
            state_dict = checkpoint["state_dict"]
            new_state_dict = OrderedDict()
            for k, v in state_dict.items():
                name = k.replace("module.", "")  # پاک کردن module.
                new_state_dict[name] = v

            self.schp_model.load_state_dict(new_state_dict, strict=False)

            # مدل رو ببر روی GPU یا CPU و eval کن
            self.schp_model.to(self.device).eval()
            
            self.classifier = ClipZeroShotClassifier(device=self.device)
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


    def _generate_embedding(self, img_input):
        img = Image.open(img_input).convert('RGB') if isinstance(img_input,str) else img_input
        t = self.transform(img).unsqueeze(0).to(self.device)
        with torch.no_grad():
            emb = self.feature_extractor(t).squeeze().cpu().numpy().reshape(-1)
        return emb, emb.shape[0]

    def _find_similar_products(self, query_emb, emb_dim, category=None, is_man=None, top_n=30):
        product_predicts = ProductPredict.objects.all() if not is_man else ProductPredict.objects.filter(product__is_man=is_man)
        product_predicts = product_predicts if not category else product_predicts.filter(category=category)
        
        db_embs = []
        db_products = []
        for product_predict in product_predicts:
            if product_predict.image_embedding and product_predict.image_embedding_dim == emb_dim:
                # print(product_predict.image_embedding_dim)
                # print(emb_dim)
                try:
                    db_embs.append(product_predict.image_embedding)
                    db_products.append(product_predict.product)
                except: continue
        if not db_embs: return []
        
        sims = cosine_similarity([query_emb], np.array(db_embs))[0]
        top_idx = sims.argsort()[-top_n:][::-1]
        
        return [db_products[i] for i in top_idx]
