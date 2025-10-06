from rest_framework import serializers
from django.apps import apps
from .models import LikedItem



class LikedItemSerializer(serializers.ModelSerializer):
    content_type = serializers.SerializerMethodField()
    object = serializers.SerializerMethodField()
    
    def get_object(self, liked_item: LikedItem):
        object_id = liked_item.object_id
        content_type = liked_item.content_type
        model_content = apps.get_model(content_type.app_label, content_type.model)
        
        try:
            object_liked = model_content.objects.get(id=object_id)
            
            # Get Image and ID of Object
            id = object_liked.id
            image = object_liked.image
            
             # Get Title of Object
            if content_type.model  == "mystyle":
                title = object_liked.user.username
            else:
                title = object_liked.title
            
            request = self.context.get("request")
            image_url = request.build_absolute_uri(image.url)
            
            return {"id": id, "title": title, "image": image_url}
        except:
                return "همچین آبجکتی وجود ندارد"
    
    def get_content_type(self, liked_item: LikedItem):
        content_type = liked_item.content_type
        return {"id": content_type.id, "app_label": content_type.app_label, "model": content_type.model}
    
    class Meta:
        model = LikedItem
        fields = ['id', 'user', 'object_id', 'object', 'content_type']
        read_only_fields = ['user']


class CreateLikedItemSerializer(serializers.ModelSerializer):
    def validate_content_type(self, content_type):
        models = [
            'style',
            'product',
            'mystyle',
        ]
        
        if content_type.model not in models:
            raise serializers.ValidationError("این مدل قابل ذخیره شدن نیست!")
        return content_type
    
    def validate(self, liked_item):
        object_id = liked_item["object_id"]
        content_type = liked_item["content_type"]
        model_content = apps.get_model(content_type.app_label, content_type.model)
        
        if not model_content.objects.filter(id=object_id).exists():
            raise serializers.ValidationError({"object_id": "آبجکتی با این آیدی وجود ندارد"})
        return liked_item
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
    
    class Meta:
        model = LikedItem
        fields = ['id', 'user', 'object_id', 'content_type']
        read_only_fields = ['user']

