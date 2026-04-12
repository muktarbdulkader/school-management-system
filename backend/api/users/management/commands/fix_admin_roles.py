from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from users.models import Role, UserRole

User = get_user_model()


class Command(BaseCommand):
    help = 'Assign Super_Admin role to superuser and staff users who don\'t have roles'

    def handle(self, *args, **options):
        # Get or create Super_Admin role
        super_admin_role, created = Role.objects.get_or_create(
            name='Super_Admin',
            defaults={
                'description': 'Full system access with all permissions',
                'permissions': 'all'
            }
        )

        if created:
            self.stdout.write(self.style.SUCCESS(f'✓ Created Super_Admin role'))
        else:
            self.stdout.write(f'✓ Super_Admin role already exists')

        # Find all superusers and staff without UserRole
        admin_users = User.objects.filter(is_superuser=True) | User.objects.filter(is_staff=True)

        assigned_count = 0
        for user in admin_users:
            # Check if user already has a role
            if not UserRole.objects.filter(user=user).exists():
                UserRole.objects.create(
                    user=user,
                    role=super_admin_role
                )
                self.stdout.write(self.style.SUCCESS(f'✓ Assigned Super_Admin role to {user.email}'))
                assigned_count += 1
            else:
                existing_roles = list(UserRole.objects.filter(user=user).values_list('role__name', flat=True))
                self.stdout.write(f'  {user.email} already has roles: {", ".join(existing_roles)}')

        if assigned_count > 0:
            self.stdout.write(self.style.SUCCESS(f'\n✅ Successfully assigned Super_Admin role to {assigned_count} user(s)'))
        else:
            self.stdout.write(self.style.WARNING('\n⚠ No users needed role assignment'))

        # Summary
        self.stdout.write(f'\n📊 Summary:')
        self.stdout.write(f'   Total superusers: {User.objects.filter(is_superuser=True).count()}')
        self.stdout.write(f'   Total staff users: {User.objects.filter(is_staff=True).count()}')
        self.stdout.write(f'   Total users with roles: {UserRole.objects.count()}')
