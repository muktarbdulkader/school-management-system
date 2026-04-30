import os
from pathlib import Path
from datetime import timedelta
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent
RENDER = os.environ.get("RENDER", False)
# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-ks=847$xw+2ejohsqy=3(xbk1e&b6cx11vj&yk5egtb4#rw3(@')
DEBUG = not RENDER
#🌐HOSTS
ALLOWED_HOSTS = [
    "localhost",
    "127.0.0.1",
]

RENDER_EXTERNAL_HOSTNAME = os.environ.get('RENDER_EXTERNAL_HOSTNAME')
if RENDER_EXTERNAL_HOSTNAME:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)

# 🔒 CSRF (needed for admin login on Render)
CSRF_TRUSTED_ORIGINS = []
if RENDER_EXTERNAL_HOSTNAME:
    CSRF_TRUSTED_ORIGINS.append(f"https://{RENDER_EXTERNAL_HOSTNAME}")
# 🌍 CORS (Frontend)
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",

    "https://school-management-system-five-sable.vercel.app",
    "https://school.simbatech.et",
     

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
    'tasks',
    'ai_integration'
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
        'default': dj_database_url.config(
            default=os.environ.get('DATABASE_URL'),
            conn_max_age=600,  # Keep connections alive for 10 minutes
            conn_health_checks=True,  # Health check connections before reuse
        )
    }
    # Memory optimizations for Render
    DATABASES['default']['OPTIONS'] = {
        'connect_timeout': 10,
    }
else:
    # LOCAL (SQLite)
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
            'OPTIONS': {
                'timeout': 20,
            }
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
EMAIL_HOST_USER = config("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = config("EMAIL_HOST_PASSWORD", default="")
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER

# 🧠 Memory Optimizations for Render (512MB limit)
if RENDER:
    import gc
    # Enable garbage collection tuning
    gc.set_threshold(700, 10, 10)
    
    # Limit file upload size to prevent memory exhaustion
    DATA_UPLOAD_MAX_MEMORY_SIZE = 5242880  # 5MB
    FILE_UPLOAD_MAX_MEMORY_SIZE = 5242880  # 5MB
    
    # Optimize Django's internal caches
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'unique-snowflake',
            'OPTIONS': {
                'MAX_ENTRIES': 100,  # Limit cache size
                'CULL_FREQUENCY': 3,  # Cull 1/3 of entries when max reached
            }
        }
    }
    
    # Disable debug toolbar in production (saves memory)
    DEBUG_TOOLBAR_CONFIG = {
        'SHOW_TOOLBAR_CALLBACK': lambda request: False,
    }
else:
    # Local development settings
    DATA_UPLOAD_MAX_MEMORY_SIZE = 26214400  # 25MB
    FILE_UPLOAD_MAX_MEMORY_SIZE = 26214400  # 25MB

# 🤖 AI Integration Settings
AI_PROVIDER = os.environ.get('AI_PROVIDER', 'mock')  # 'openai', 'gemini', 'groq', 'mock'
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', '')
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
GROQ_API_KEY = os.environ.get('GROQ_API_KEY', '')

# AI Rate Limiting (requests per user per day)
AI_RATE_LIMIT = int(os.environ.get('AI_RATE_LIMIT', '100'))
AI_DAILY_GRAMMAR_LIMIT = int(os.environ.get('AI_DAILY_GRAMMAR_LIMIT', '50'))
AI_DAILY_SUMMARIZE_LIMIT = int(os.environ.get('AI_DAILY_SUMMARIZE_LIMIT', '30'))
