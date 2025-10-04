import io
import os
import time
from typing import List, Tuple

import requests
from PIL import Image
import torch
import torchvision.transforms as T
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage

from get_data.scripts.color_classifier import ClipColorClassifier


class ClipZeroShotClassifier:
    def __init__(self, device: str = None):
        # self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.device = "cuda"
        # Lazy import to avoid heavy dependency if unused
        try:
            import open_clip
        except ImportError as e:
            raise RuntimeError("open_clip_torch not installed. Install with: pip install open_clip_torch") from e

        self.open_clip = open_clip
        self.model, _, self.preprocess = open_clip.create_model_and_transforms(
            model_name="ViT-B-32", pretrained="laion2b_s34b_b79k"
        )
        self.tokenizer = open_clip.get_tokenizer("ViT-B-32")
        self.model.eval()
        self.model.to(self.device)

    def _download_image(self, url: str) -> Image.Image:
        if os.path.exists(url):
            return Image.open(url).convert("RGB")
        else:
            resp = requests.get(url, timeout=20)
            resp.raise_for_status()
            return Image.open(io.BytesIO(resp.content)).convert("RGB")

    def encode_image(self, image_url: str) -> torch.Tensor:
        image = self._download_image(image_url)
        image_t = self.preprocess(image).unsqueeze(0).to(self.device)
        with torch.no_grad():
            feats = self.model.encode_image(image_t)
            feats = feats / feats.norm(dim=-1, keepdim=True)
        return feats.squeeze(0).cpu()

    def predict(self, image_url: str, type_labels: List[str], color_labels: List[str]) -> Tuple[str, float, str, float, float]:
        start_ts = time.time()
        image = self._download_image(image_url)
        
        image_t = self.preprocess(image).unsqueeze(0).to(self.device)

        with torch.no_grad():
            # Type
            type_text = self.tokenizer([f"a photo of {lbl}" for lbl in type_labels]).to(self.device)
            image_features = self.model.encode_image(image_t)
            text_features = self.model.encode_text(type_text)
            image_features = image_features / image_features.norm(dim=-1, keepdim=True)
            text_features = text_features / text_features.norm(dim=-1, keepdim=True)
            type_logits = 100.0 * image_features @ text_features.T
            type_probs = type_logits.softmax(dim=-1).squeeze(0)
            type_idx = int(type_probs.argmax().item())
            type_label = type_labels[type_idx]
            type_score = float(type_probs[type_idx].item())

            # Color (via dedicated color classifier for separation of concerns)
            color_classifier = ClipColorClassifier(device=self.device)
            color_label, color_score = color_classifier.predict_from_features(image_features, color_labels)

        elapsed = time.time() - start_ts
        
        return {
            "type_label": type_label,
            "type_score": type_score,
            "color_label": color_label,
            "color_score": color_score,
            "elapsed": elapsed,
            "type_probs": type_probs,
        }

    def download_to_media(self, image_url: str, subdir: str, filename_stem: str = None, overwrite: bool = True) -> str:
        resp = requests.get(image_url, timeout=20)
        resp.raise_for_status()
        # Try to infer basic extension
        ext = "jpg"
        ctype = resp.headers.get("Content-Type", "")
        if "png" in ctype:
            ext = "png"
        elif "jpeg" in ctype or "jpg" in ctype:
            ext = "jpg"
        filename_core = filename_stem if filename_stem else str(int(time.time() * 1000))
        filename = f"{filename_core}.{ext}"
        path = f"products/{subdir}/{filename}"
        if overwrite and default_storage.exists(path):
            default_storage.delete(path)
        default_storage.save(path, ContentFile(resp.content))
        return path


DEFAULT_TYPE_LABELS = [
    # Tops & Outerwear
    "Tshirt",
    "Polo shirt",
    "Shirt",
    "Blouse",
    "Tunic",
    "Hoodie",
    "Sweatshirt",
    "Cardigan",
    "Pullover",
    "Sweater",
    "Jacket",
    "Trench coat",
    "Coat",
    "Suit jacket",
    "Blazer",
    "Vest",
    "Mantle",
    "Long coat",
    "Tank top",
    "Camisole",
    "Corset",
    
    # Bottoms
    "Jeans",
    "Trousers",
    "Pants",
    "Joggers",
    "Sweatpants",
    "Leggings",
    "Shorts",
    "Mini skirt",
    "Midi skirt",
    "Long skirt",
    "Pleated skirt",
    
    # One-pieces
    "Dress short",
    "Dress long",
    "Maxi dress",
    "Evening gown",
    "Pinafore",
    "Sarafan",
    "Jumpsuit",
    "Playsuit",
    "Overall",
    "Dungarees",
    "Romper",
    
    # Footwear
    "Sneakers",
    "Dress shoes",
    "Loafers",
    "Heels",
    "Sandals",
    "Flip-flops",
    "Slippers",
    "Boots",
    "Ankle boots",
    "Running shoes",
    "Sports shoes",
    
    # Sports & Homewear
    "Tracksuit",
    "Gym wear",
    "Compression wear",
    "Swimsuit one-piece",
    "Bikini",
    "Swimsuit two-piece",
    "Nightdress",
    "Pajamas",
    "Boxers",
    "Briefs",
    "Bra",
    "Panties",
    "Bodysuit",
    "Thermal underwear",
    "Undershirt",
    
    # Traditional / Special Clothes
    "Chador",
    "Scarf",
    "Shawl",
    "Wrap",
    "Kimono",
    "Abaya",
    "Traditional dress",
    "Costume",
    "Uniform",
    "Ceremonial outfit",
    
    # Kids / Baby Clothes
    "Baby romper",
    "Onesie",
    "Kids dress",
    "Baby set",
    
    # Wearable Accessories
    "Hat",
    "Cap",
    "Beanie",
    "Sunglasses",
    "Belt",
    "Gloves",
    "Mittens",
    "Socks",
    "Stockings",
    "Tie",
    "Bow tie",
    "Ankle strap",
    "Anklet",
    "Necklace",
    "Ring",
    "Earrings",
    "Bracelet",
    "Watch",
    "Hair band",
    "Headband",
    
    # Outerwear & Special Wearables
    "Bag",
    "Raincoat",
    "Windbreaker",
    "Puffer jacket",
    "Leather jacket",
    "Tactical vest",
    "Chest rig",
    "Cover-up",
    "Beachwear"
]


DEFAULT_COLOR_LABELS = [
    "black", "white", "gray", "blue", "red", "green", "yellow", "purple", "brown", "pink", "orange"
]


