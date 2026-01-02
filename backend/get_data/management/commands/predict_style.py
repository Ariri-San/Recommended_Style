from django.core.management.base import BaseCommand
from django.db import transaction
from django.conf import settings
from django.utils import timezone
from django.core.files.base import ContentFile

from io import BytesIO
import uuid
import requests
import os
from PIL import Image, ImageOps
import numpy as np
import json
import torch
import cv2
import time
import torchvision.transforms as transforms
import torchvision.models as models
from torchvision.models.detection import fasterrcnn_resnet50_fpn, FasterRCNN_ResNet50_FPN_Weights
from torchvision.models.detection import keypointrcnn_resnet50_fpn, KeypointRCNN_ResNet50_FPN_Weights
from sklearn.metrics.pairwise import cosine_similarity
import torch.nn as nn
import torch.nn.functional as F_torch
from collections import OrderedDict
# from deepface import DeepFace
# import mediapipe as mp

from schp.networks import resnet101
from get_data.scripts.detect_products import FindSimilarProducts
from get_data.scripts.torch_classifier import ClipZeroShotClassifier
from get_data.models import MyStyle, Style, Product, StylePredict, Category, ProductPredict, Color

# --- Classifiers ---
class GenderClassifier(nn.Module):
    def __init__(self, input_dim):
        super().__init__()
        self.fc = nn.Linear(input_dim, 2)
    def forward(self, x):
        return self.fc(x)

class AgeClassifier(nn.Module):
    def __init__(self, input_dim):
        super().__init__()
        self.fc = nn.Linear(input_dim, 1)  # عددی
    def forward(self, x):
        return self.fc(x)

class SkinToneClassifier(nn.Module):
    def __init__(self, input_dim):
        super().__init__()
        self.fc = nn.Linear(input_dim, 3)  # RGB پیش‌بینی‌شده
    def forward(self, x):
        return self.fc(x)

# def estimate_skin_color(img_path):
#     mp_face = mp.solutions.face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.5)
#     img = cv2.imread(img_path)
#     rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
#     result = mp_face.process(rgb)
#     if not result.detections:
#         return None
#     for det in result.detections:
#         box = det.location_data.relative_bounding_box
#         h, w, _ = img.shape
#         x1, y1, x2, y2 = int(box.xmin*w), int(box.ymin*h), int((box.xmin+box.width)*w), int((box.xmin+box.height)*h)
#         face_crop = img[y1:y2, x1:x2]
#         if face_crop.size == 0:
#             return None
#         avg = face_crop.mean(axis=(0,1))
#         return f"rgb({int(avg[2])},{int(avg[1])},{int(avg[0])})"
#     return None


class Command(BaseCommand):
    help = 'Predicts personal attributes and product matches for Styles.'

    def add_arguments(self, parser):
        parser.add_argument('--start_id', type=int, default=None)
        parser.add_argument('--end_id', type=int, default=None)
        parser.add_argument('--refresh', action='store_true', help='Delete old predictions and recreate')
        parser.add_argument('--predict-version', type=int, default=0, help='Specify version for predictions')

    def handle(self, *args, **options):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self._load_models()
        self._define_transforms()

        version = options.get('predict_version')
        start_id = options.get('start_id')
        end_id = options.get('end_id')

        qs = Style.objects.all().order_by('id')
        if start_id:
            qs = qs.filter(id__gte=start_id)
        if end_id:
            qs = qs.filter(id__lte=end_id)

        for style in qs:
            style_predicts = StylePredict.objects.filter(style=style, version=version)
            if style_predicts.exists():
                if options.get('refresh'):
                    style_predicts.delete()
                    self.stdout.write(f"StylePredict of Style {style.id} Deleted")
                else:
                    self.stdout.write(f"Style {style.id} Passed")
                    continue

            # اگر تصویر لوکال وجود ندارد، سعی کن دانلودش کنی
            if not style.image_local or not os.path.exists(style.image_local.path):
                if style.image:
                    content = self.download_image(style.image)
                    if content:
                        file_name = f"{uuid.uuid4().hex}.jpg"
                        style.image_local.save(file_name, ContentFile(content), save=True)
                        print(f"Downloaded image for Style {style.id}")
                    else:
                        print(f"Failed to download image for Style {style.id}")
                        continue

            self.stdout.write(f"Processing Style {style.id}")
            image = self._open_imagefield(style.image_local)
            detected_products_info = self._detect_products(image)

            full_embedding, full_dim = self._generate_embedding(style.image_local)

            with transaction.atomic():
                
                # personal_attr = self._extract_personal_attributes(image_path)
                
                # if personal_attr:
                #     style.is_man = personal_attr['gender'] == 'male'
                #     style.age = personal_attr['age']
                #     style.skin_color = personal_attr['skin_color']
                #     style.hair_color = personal_attr['hair_color']
                #     style.height = personal_attr['height']
                #     style.body_type = personal_attr['body_type']
                #     style.save()
                
                for idx, prod_info in enumerate(detected_products_info):
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
                    # print(len(categories))
                    # print(classifier_predict["type_probs"])
                    predicted_category = next((c for c in categories if c.title == classifier_predict["type_label"]), None)
                    predicted_color_obj = next((c for c in colors if c.title == classifier_predict["color_label"]), None) if colors else None
                    
                    embedding = self.classifier.encode_image(prod_info['image'])
                    image_embedding = embedding.tolist()
                    similar_products = self._find_similar_products(image_embedding, len(image_embedding), predicted_category, style.is_man, 50)
                    
                    img_io = BytesIO()
                    prod_info['image'].save(img_io, format='PNG')
                    img_content = ContentFile(img_io.getvalue(), name=f"{uuid.uuid4().hex}.png")

                    style_predict = StylePredict.objects.create(
                        style=style,
                        version=version,
                        category=predicted_category,
                        color = predicted_color_obj,
                        color_score = classifier_predict["color_score"],
                        prediction_model='ViT-B-32 laion2b_s34b_b79k',
                        predicted_at=timezone.now(),
                        crop_image=img_content,
                        crop_name=prod_info['category_name'],
                        image_embedding=json.dumps(image_embedding),
                        image_embedding_dim=len(categories),
                        crop_meta=json.dumps({
                            'bounding_box': prod_info['bounding_box'],
                        })
                    )

                    if similar_products:
                        style_predict.products.set(similar_products)
                    else:
                        style_predict.products.set([])
                    style_predict.save()

                # Update Style level info (mean or first crop)

            self.stdout.write(f"Finished Style {style.id}")
    
    # def handle(self, *args, **options):
    #     find_simslar = FindSimilarProducts()
    #     # find_simslar.extract_image(MyStyle.objects.get(id=1))
    #     find_simslar.create_predict_from_crop(MyStyle.objects.get(id=1), {"x1": 1375, "y1": 2386, "x2": 2758, "y2": 4371})
    
    def download_image(self, url, max_retries=2, timeout=10):
        for attempt in range(max_retries):
            try:
                response = requests.get(url, timeout=timeout)
                if response.status_code == 200:
                    return response.content
                else:
                    print(f"HTTP {response.status_code}")
            except requests.exceptions.RequestException as e:
                print(f"Attempt {attempt+1} failed: {e}")
                time.sleep(3)  # صبر قبل از تلاش بعدی
        return None

    def _load_models(self):
        # Object detection
        # weights = FasterRCNN_ResNet50_FPN_Weights.DEFAULT
        # self.object_model = fasterrcnn_resnet50_fpn(weights=weights).to(self.device).eval()
        # self.object_preprocess = weights.transforms()
        
        # مدل رو بدون pretrained اولیه بساز
        self.schp_model = resnet101(pretrained=None, num_classes=18)

        # چک‌پوینت آموزش‌دیده رو لود کن
        
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


        # Keypoint
        kp_weights = KeypointRCNN_ResNet50_FPN_Weights.COCO_V1
        self.kp_model = keypointrcnn_resnet50_fpn(weights=kp_weights).to(self.device).eval()
        self.kp_preprocess = kp_weights.transforms()

        # Feature extractor
        resnet = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V2)
        self.feature_extractor = nn.Sequential(*(list(resnet.children())[:-1])).to(self.device).eval()
        feat_dim = 2048
        
        self.classifier = ClipZeroShotClassifier(device=self.device)

        # Attribute models
        self.gender_model = GenderClassifier(feat_dim).to(self.device).eval()
        self.age_model = AgeClassifier(feat_dim).to(self.device).eval()
        self.skin_model = SkinToneClassifier(feat_dim).to(self.device).eval()

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
        default_min_pixels = 1000
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



    def _generate_embedding(self, image_path):
        image = self._open_imagefield(image_path)
        t = self.transform(image).unsqueeze(0).to(self.device)
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

    # def _extract_personal_attributes(self, img_input):
    #     img = img_input if isinstance(img_input, Image.Image) else Image.open(img_input).convert('RGB')
    #     t = self.transform(img).unsqueeze(0).to(self.device)

    #     with torch.no_grad():
    #         feat = self.feature_extractor(t).squeeze(-1).squeeze(-1)  # (2048,)
            
    #         # Gender, Age
    #         try:
    #             # ساخت مدل سبک‌تر
    #             model = DeepFace.build_model("Facenet")

    #             analysis = DeepFace.analyze(
    #                 img_path=img_input,
    #                 actions=['age','gender'],
    #                 enforce_detection=False,
    #                 detector_backend='retinaface',
    #                 models={"age": model, "gender": model}
    #             )
    #             age = analysis[0]['age']
    #             gender = analysis[0]['gender'].lower()
    #         except Exception as e:
    #             gender_out = self.gender_model(feat.unsqueeze(0))
    #             gender = ['female', 'male'][torch.argmax(gender_out).item()]
    #             age_out = self.age_model(feat.unsqueeze(0))
    #             age = float(age_out.item())
    #             print("DeepFace failed:", e)

    #         # Mediapipe → skin tone
    #         try:
    #             skin_color = estimate_skin_color(img_input)
    #         except Exception as e:
    #             skin_out = self.skin_model(feat.unsqueeze(0))   # (1,3)
    #             skin_out = skin_out.squeeze().detach().cpu().numpy()  # → (3,)
    #             skin_color = f"rgb{tuple(int(x) for x in skin_out.tolist())}"
    #             print("Skin color failed:", e)


    #     # Keypoint for height/body_type
    #     kp_t = self.kp_preprocess(img).unsqueeze(0).to(self.device)
    #     with torch.no_grad():
    #         kp = self.kp_model(kp_t)[0]

    #     height, body_type, hair_color = None, None, None
    #     if len(kp['keypoints']) > 0:
    #         ys = kp['keypoints'][0][:, 1].cpu().numpy()
    #         top_y, bottom_y = ys.min(), ys.max()
    #         height = round((bottom_y - top_y) / 1000 * 170, 1)

    #         box = kp['boxes'][0].cpu().numpy()
    #         ratio = (box[2] - box[0]) / (bottom_y - top_y + 1e-5)
    #         body_type = 'slim' if ratio < 0.25 else 'average' if ratio < 0.35 else 'plus-size'

    #         head_y = int(ys.min())
    #         img_np = np.array(img)
    #         patch = img_np[max(0, head_y - 40):head_y + 40, :, :]
    #         if patch.size > 0:
    #             c = patch.mean(axis=(0, 1))
    #             # hair_color = f"rgb({int(c[0])},{int(c[1])},{int(c[2])})"
    #             hair_color = f"rgb({int(c[2])},{int(c[1])},{int(c[0])})"

    #     return {
    #         'gender': gender,
    #         'age': age,
    #         'skin_color': skin_color,
    #         'hair_color': hair_color,
    #         'height': height,
    #         'body_type': body_type
    #     }
