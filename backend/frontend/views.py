import os
from django.conf import settings
from django.shortcuts import render
from django.views.generic import TemplateView
from django.http import JsonResponse, HttpResponse

# Create your views here.


class FrontendAppView(TemplateView):
    template_name = 'index.html'


def serve_file(request, filename):
    if filename:
        
        file_path = os.path.join(settings.BASE_DIR, 'frontend/build', filename)

        if os.path.exists(file_path):
            if filename.endswith('.json'):
                with open(file_path, 'r') as f:
                    return JsonResponse(f.read(), safe=False)
            else:
                with open(file_path, 'rb') as f:
                    return HttpResponse(f.read(), content_type="application/octet-stream")
        else:
            return render(request, "index.html")