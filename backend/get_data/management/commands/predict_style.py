from django.core.management.base import BaseCommand
from django.db import transaction
from django.conf import settings

import os
from PIL import Image
import numpy as np
import json
from django.utils import timezone
import torch
import torchvision.transforms as transforms
import torchvision.models as models
from torchvision.models.detection import fasterrcnn_resnet50_fpn, FasterRCNN_ResNet50_FPN_Weights
from torchvision.models.detection import keypointrcnn_resnet50_fpn, KeypointRCNN_ResNet50_FPN_Weights
from sklearn.metrics.pairwise import cosine_similarity
import torch.nn as nn
import torch.nn.functional as F_torch

from get_data.models import Style, Product, StylePredict, Category, ProductPredict

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
            if not style.image_local or not os.path.exists(style.image_local.path):
                self.stdout.write(f"Skipping Style {style.id}, no image")
                continue

            image_path = style.image_local.path
            self.stdout.write(f"Processing Style {style.id}")
            detected_products_info = self._detect_products(image_path, style.id)

            full_embedding, full_dim = self._generate_embedding(image_path)

            with transaction.atomic():
                if options.get('refresh'):
                    StylePredict.objects.filter(style=style, version=version).delete()
                
                personal_attr = self._extract_personal_attributes(image_path)
                
                if personal_attr:
                    style.is_man = personal_attr['gender'] == 'male'
                    style.age = personal_attr['age']
                    style.skin_color = personal_attr['skin_color']
                    style.hair_color = personal_attr['hair_color']
                    style.height = personal_attr['height']
                    style.body_type = personal_attr['body_type']
                    style.save()
                
                for idx, prod_info in enumerate(detected_products_info):
                    crop_embedding, crop_dim = self._generate_embedding(prod_info['image_crop'])
                    similar_products = self._find_similar_products(crop_embedding, crop_dim, prod_info.get('category_name'))

                    sp = StylePredict.objects.create(
                        style=style,
                        version=version,
                        prediction_model='FasterRCNN_ResNet50_FPN + ResNet50',
                        predicted_at=timezone.now(),
                        image_embedding=json.dumps(crop_embedding.tolist()),
                        image_embedding_dim=crop_dim,
                        crop_meta=json.dumps({
                            'bounding_box': prod_info['bounding_box'],
                        })
                    )

                    if similar_products:
                        sp.products.set(similar_products)

                # Update Style level info (mean or first crop)

            self.stdout.write(f"Finished Style {style.id}")

    def _load_models(self):
        # Object detection
        weights = FasterRCNN_ResNet50_FPN_Weights.DEFAULT
        self.object_model = fasterrcnn_resnet50_fpn(weights=weights).to(self.device).eval()
        self.object_preprocess = weights.transforms()

        # Keypoint
        kp_weights = KeypointRCNN_ResNet50_FPN_Weights.COCO_V1
        self.kp_model = keypointrcnn_resnet50_fpn(weights=kp_weights).to(self.device).eval()
        self.kp_preprocess = kp_weights.transforms()

        # Feature extractor
        resnet = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V2)
        self.feature_extractor = nn.Sequential(*(list(resnet.children())[:-1])).to(self.device).eval()
        feat_dim = 2048

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

    def _detect_products(self, image_path, style_id):
        image = Image.open(image_path).convert('RGB')
        tensor = self.object_preprocess(image).to(self.device)
        with torch.no_grad():
            preds = self.object_model([tensor])[0]

        detected = []
        for i, score in enumerate(preds['scores']):
            if score < 0.8: continue
            box = preds['boxes'][i].cpu().numpy().astype(int)
            crop = image.crop((box[0], box[1], box[2], box[3]))
            label = int(preds['labels'][i].item())
            category_name = str(label)
            
            # --- مسیر ذخیره ---
            crop_dir = os.path.join(settings.MEDIA_ROOT, "style_crops", str(style_id))
            os.makedirs(crop_dir, exist_ok=True)
            crop_filename = f"crop_{i+1}.jpg"
            crop_path = os.path.join(crop_dir, crop_filename)
            crop.save(crop_path)
            
            detected.append({'image_crop': crop, 'bounding_box': box.tolist(), 'category_name': category_name})
        return detected

    def _generate_embedding(self, img_input):
        img = Image.open(img_input).convert('RGB') if isinstance(img_input,str) else img_input
        t = self.transform(img).unsqueeze(0).to(self.device)
        with torch.no_grad():
            emb = self.feature_extractor(t).squeeze().cpu().numpy().reshape(-1)
        return emb, emb.shape[0]

    def _find_similar_products(self, query_emb, emb_dim, category_name=None):
        qs = ProductPredict.objects.all() if not category_name else ProductPredict.objects.filter(category__title__iexact=category_name)
        db_embs = []
        db_products = []
        for pp in qs:
            if pp.image_embedding and pp.image_embedding_dim == emb_dim:
                try:
                    e = json.loads(pp.image_embedding)
                    db_embs.append(e)
                    db_products.append(pp.product)
                except: continue
        if not db_embs: return []
        sims = cosine_similarity([query_emb], np.array(db_embs))[0]
        top_idx = sims.argsort()[-10:][::-1]
        return [db_products[i] for i in top_idx]

    def _extract_personal_attributes(self, img_input):
        img = img_input if isinstance(img_input, Image.Image) else Image.open(img_input).convert('RGB')
        t = self.transform(img).unsqueeze(0).to(self.device)

        with torch.no_grad():
            feat = self.feature_extractor(t).squeeze(-1).squeeze(-1)  # (2048,)

            # gender
            gender_out = self.gender_model(feat.unsqueeze(0))
            gender = ['female', 'male'][torch.argmax(gender_out).item()]

            # age
            age_out = self.age_model(feat.unsqueeze(0))
            print(age_out)
            age = float(age_out.item())

            # skin color (RGB)
            skin_out = self.skin_model(feat.unsqueeze(0))   # (1,3)
            skin_out = skin_out.squeeze().detach().cpu().numpy()  # → (3,)
            skin_color = f"rgb{tuple(int(x) for x in skin_out.tolist())}"

        # Keypoint for height/body_type
        kp_t = self.kp_preprocess(img).unsqueeze(0).to(self.device)
        with torch.no_grad():
            kp = self.kp_model(kp_t)[0]

        height, body_type, hair_color = None, None, None
        if len(kp['keypoints']) > 0:
            ys = kp['keypoints'][0][:, 1].cpu().numpy()
            top_y, bottom_y = ys.min(), ys.max()
            height = round((bottom_y - top_y) / 1000 * 170, 1)

            box = kp['boxes'][0].cpu().numpy()
            ratio = (box[2] - box[0]) / (bottom_y - top_y + 1e-5)
            body_type = 'slim' if ratio < 0.25 else 'average' if ratio < 0.35 else 'plus-size'

            head_y = int(ys.min())
            img_np = np.array(img)
            patch = img_np[max(0, head_y - 40):head_y + 40, :, :]
            if patch.size > 0:
                c = patch.mean(axis=(0, 1))
                hair_color = f"rgb({int(c[0])},{int(c[1])},{int(c[2])})"

        return {
            'gender': gender,
            'age': age,
            'skin_color': skin_color,
            'hair_color': hair_color,
            'height': height,
            'body_type': body_type
        }
