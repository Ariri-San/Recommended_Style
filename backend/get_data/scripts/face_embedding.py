import torch
from facenet_pytorch import MTCNN, InceptionResnetV1
from PIL import Image
import numpy as np


class FaceEmbeddingExtractor:
    """کلاس برای استخراج embedding چهره از تصاویر با استفاده از FaceNet"""
    
    def __init__(self, device=None):
        """
        مقداردهی اولیه مدل‌ها
        
        Args:
            device: دستگاه پردازش (cpu/cuda) - اگر None باشد به صورت خودکار تشخیص داده می‌شود
        """
        self.device = device if device else ('cuda' if torch.cuda.is_available() else 'cpu')
        
        # Initialize MTCNN for face detection and alignment
        self.mtcnn = MTCNN(
            image_size=160,
            margin=20,
            device=self.device
        )
        
        # Load pre-trained InceptionResnetV1 for feature extraction
        self.resnet = InceptionResnetV1(pretrained='vggface2').eval().to(self.device)
    
    def get_embedding(self, image_path):
        """
        استخراج embedding از یک تصویر
        
        Args:
            image_path (str): مسیر فایل تصویر
            
        Returns:
            tuple: (embedding, success, message)
            - embedding: تانسور PyTorch (512 بعدی) یا None
            - success: Boolean نشان‌دهنده موفقیت آمیز بودن عملیات
            - message: پیام توصیفی
        """
        try:
            # بارگذاری تصویر
            img = Image.open(image_path).convert('RGB')
            
            # تشخیص و تراز کردن چهره
            img_cropped = self.mtcnn(img, save_path=None)
            
            if img_cropped is None:
                return None
            
            # محاسبه embedding
            with torch.no_grad():
                img_cropped = img_cropped.to(self.device)
                img_embedding = self.resnet(img_cropped.unsqueeze(0))
            
            return img_embedding.cpu()
            
        except Exception as e:
            return None
    
    def get_embedding_from_pil(self, pil_image):
        """
        استخراج embedding از یک تصویر PIL
        
        Args:
            pil_image (PIL.Image): شیء تصویر PIL
            
        Returns:
            tuple: (embedding, success, message)
        """
        try:
            if pil_image.mode != 'RGB':
                pil_image = pil_image.convert('RGB')
            
            # تشخیص و تراز کردن چهره
            img_cropped = self.mtcnn(pil_image, save_path=None)
            
            if img_cropped is None:
                return None
            
            # محاسبه embedding
            with torch.no_grad():
                img_cropped = img_cropped.to(self.device)
                img_embedding = self.resnet(img_cropped.unsqueeze(0))
            
            return img_embedding.cpu()
            
        except Exception as e:
            return None
    
    def get_multiple_embeddings(self, image_paths):
        """
        استخراج embedding از چندین تصویر
        
        Args:
            image_paths (list): لیستی از مسیرهای تصاویر
            
        Returns:
            list: لیستی از tupleهای (embedding, success, message, image_path)
        """
        results = []
        for path in image_paths:
            embedding, success, message = self.get_embedding(path)
            results.append((embedding, success, message, path))
        return results
