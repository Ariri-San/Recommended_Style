from rest_framework import permissions


class MyStylePermission(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.user == request.user or request.user.is_staff
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user.is_authenticated)


class MyStylePredictPermission(permissions.BasePermission):
    def __init__(self, object_user=False) -> None:
        self.object_user = object_user
    
    def has_object_permission(self, request, view, obj):
        return obj.style.user == request.user or request.user.is_staff
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        elif request.method == "POST":
            if self.object_user == request.user:
                return True
            else:
                return False
        return bool(request.user.is_authenticated)
