from users.models import Role, RolePermission
import django
django.setup()

admin_roles = Role.objects.filter(name__iexact='admin') | Role.objects.filter(name__iexact='super_admin')
staff_role, _ = Role.objects.get_or_create(name='Staff')

count = 0
for ar in admin_roles:
    for rp in RolePermission.objects.filter(role=ar):
        _, created = RolePermission.objects.get_or_create(
            role=staff_role, 
            content_type=rp.content_type, 
            permission=rp.permission
        )
        if created:
            count += 1

print(f"Synced {count} NEW permissions to Staff role.")
print(f"Total permissions for Staff: {RolePermission.objects.filter(role=staff_role).count()}")
