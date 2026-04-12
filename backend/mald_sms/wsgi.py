"""
WSGI config for mald_sms project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/wsgi/
"""

import os
import sys
from pathlib import Path

# Add api directory to Python path (works for both local and Docker)
BASE_DIR = Path(__file__).resolve().parent.parent
api_path = os.path.join(BASE_DIR, "api")
if api_path not in sys.path:
    sys.path.insert(0, api_path)
    print(f"DEBUG wsgi.py: Added {api_path} to sys.path", flush=True)
else:
    print(f"DEBUG wsgi.py: {api_path} already in sys.path", flush=True)

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mald_sms.settings')

application = get_wsgi_application()
