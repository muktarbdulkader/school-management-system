import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from users.models import User, Role

print('Deleting users...')
users_deleted = User.objects.all().delete()
print('Users deleted:', users_deleted)

print('Deleting roles...')
roles_deleted = Role.objects.all().delete()
print('Roles deleted:', roles_deleted)

print('Done.')
