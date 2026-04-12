from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    BranchAccessViewSet, BranchViewSet, RolePermissionViewSet, RoleViewSet, 
    UserProfileViewSet, UserRegistrationViewSet, UserRoleViewSet, UserViewSet,
    initialize_system, system_status
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='users')
router.register(r'register', UserRegistrationViewSet, basename='register')
router.register(r'profiles', UserProfileViewSet, basename='userprofile')
router.register(r'roles', RoleViewSet)
router.register(r'user_roles', UserRoleViewSet)
router.register(r'branches', BranchViewSet)
router.register(r'user_branch_access', BranchAccessViewSet)
router.register(r'role_permissions', RolePermissionViewSet)

urlpatterns = [
    path('setup/initialize/', initialize_system, name='initialize-system'),
    path('setup/status/', system_status, name='system-status'),
] + router.urls
