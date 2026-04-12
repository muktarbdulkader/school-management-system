# create_superuser.py

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mald_sms.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

email = os.getenv("DJANGO_SUPERUSER_EMAIL", "admin@gmail.com")
password = os.getenv("DJANGO_SUPERUSER_PASSWORD", "admin123")
full_name = os.getenv("DJANGO_SUPERUSER_FULL_NAME", "Admin User")  # Corrected here
if not User.objects.filter(email=email).exists():
    print(f"Creating superuser {email}")
    User.objects.create_superuser(
        email=email,
        password=password,
        full_name=full_name  # ✅ Pass full_name here
    )
else:
    print(f"Superuser {email} already exists")
    if not User.objects.filter(email=email, is_superuser=True).exists():
        print(f"updating {email} to superuser")
        user = User.objects.get(email=email)
        user.is_superuser = True
        user.save()
