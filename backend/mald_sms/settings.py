import os
from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent
RENDER = os.environ.get("RENDER", False)
# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-ks=847$xw+2ejohsqy=3(xbk1e&b6cx11vj&yk5egtb4#rw3(@')
DEBUG = not RENDER
#🌐HOSTS
ALLOWED_HOSTS = [
    "localhost",
    "127.0.0.1",
    "school-management-backend-nrs9.onrender.com",
]
# 🔒 CSRF (needed for admin login on Render)
CSRF_TRUSTED_ORIGINS = [
    "https://school-management-backend-nrs9.onrender.com",
]
# 🌍 CORS (Frontend)
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",

    "https://school-management-system-frontend-dun.vercel.app",
    "https://school.simbatech.et",
    "https://school-management-system-frontend-4.vercel.app",
    "https://school-management-system-frontend-e.vercel.app",
    "https://school-management-system-frontend-6.vercel.app",
    "https://school-management-system-frontend-6-one.vercel.app",
    "https://school-management-system-tau-eight.vercel.app"

]
#🔒 Cookies (secure only in production)
SESSION_COOKIE_SECURE = RENDER
CSRF_COOKIE_SECURE = RENDER
# 📦 INSTALLED APPS
INSTALLED_APPS = [
    'channels',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django_filters',
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'users',
    'students',
    'teachers',
    'academics.apps.AcademicsConfig',
    'schedule',
    'reports',
    'communication',
    'lessontopics',
    'library',
    'blogs',
    'materials',
    'tasks'
]
#⚙️ MIDDLEWARE
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # for Render
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
# 🌍 URLs
ROOT_URLCONF = 'mald_sms.urls'
# 🧠 Templates
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]
# 🚀 WSGI
WSGI_APPLICATION = 'mald_sms.wsgi.application'
# 🗄 DATABASE
if RENDER:
    import dj_database_url
    DATABASES = {
        'default': dj_database_url.config(default=os.environ.get('DATABASE_URL'))
    }
else:
    # LOCAL (SQLite)
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# 🌐 STATIC FILES
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
# 📁 MEDIA FILES
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
# 🔐 AUTH USER
AUTH_USER_MODEL = 'users.User'
# ⚡️ DRF
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}
# 🔑 JWT
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
}

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD")
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER

