"""
URL configuration for mald_sms project.
"""
import sys
import os
from pathlib import Path

# Add api directory to Python path BEFORE any Django imports
BASE_DIR = Path(__file__).resolve().parent.parent
api_path = os.path.join(BASE_DIR, "api")
if api_path not in sys.path:
    sys.path.insert(0, api_path)

from django.contrib import admin
from rest_framework_simplejwt.views import TokenRefreshView
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static
from users.auth_views import CustomTokenObtainPairView, LogoutView

urlpatterns = [
    path('admin/', admin.site.urls),
    # Specific API paths FIRST (before any wildcard 'api/' includes)
    path('api/materials/', include('materials.urls')),
    path('api/communication/', include('communication.urls')),
    path('api/ai/', include('ai_integration.urls')),
    path('api/tasks/', include('tasks.urls')),
    path('api/library/', include('library.urls')),
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/logout/', LogoutView.as_view(), name='logout'),
    # Wildcard 'api/' includes LAST
    path('api/', include('users.urls')),
    path('api/', include('students.urls')),
    path('api/', include('teachers.urls')),
    path('api/', include('academics.urls')),
    path('api/', include('schedule.urls')),
    path('api/', include('lessontopics.urls')),
    path('api/', include('blogs.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)