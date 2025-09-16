from typing import List, Tuple

import torch


class ClipColorClassifier:
    def __init__(self, device: str = None):
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
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

    def predict_from_features(self, image_features: torch.Tensor, color_labels: List[str]) -> Tuple[str, float]:
        with torch.no_grad():
            color_text = self.tokenizer([f"{lbl} color" for lbl in color_labels]).to(self.device)
            color_text_features = self.model.encode_text(color_text)
            color_text_features = color_text_features / color_text_features.norm(dim=-1, keepdim=True)
            color_logits = 100.0 * image_features @ color_text_features.T
            color_probs = color_logits.softmax(dim=-1).squeeze(0)
            color_idx = int(color_probs.argmax().item())
            return color_labels[color_idx], float(color_probs[color_idx].item())
