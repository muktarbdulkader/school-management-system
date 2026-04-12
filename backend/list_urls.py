import os
import django
from django.urls import get_resolver

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mald_sms.settings')
django.setup()

def show_urls(url_patterns, prefix=''):
    for pattern in url_patterns:
        if hasattr(pattern, 'url_patterns'):
            show_urls(pattern.url_patterns, prefix + pattern.pattern.enrollment_path if hasattr(pattern.pattern, 'enrollment_path') else prefix + str(pattern.pattern))
        else:
            print(f"{prefix}{pattern.pattern}")

resolver = get_resolver()
show_urls(resolver.url_patterns)
