from django.core.management.base import BaseCommand
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth.models import Permission
from users.models import Role, RolePermission


class Command(BaseCommand):
    help = 'Create all system roles with their permissions'

    def handle(self, *args, **kwargs):
        roles_data = [
            {
                'name': 'Super_Admin',
                'description': 'Full system access with all permissions',
                'permissions': 'all'
            },
            {
                'name': 'Admin',
                'description': 'Administrative access with most permissions',
                'permissions': 'all'
            },
            {
                'name': 'Head_Admin',
                'description': 'Head administrator with elevated permissions',
                'permissions': 'all'
            },
            {
                'name': 'CEO',
                'description': 'Chief Executive Officer with full oversight',
                'permissions': 'all'
            },
            {
                'name': 'Teacher',
                'description': 'Teaching staff with access to academic features',
                'permissions': [
                    'lessontopics',
                    'schedule',
                    'academics',
                    'materials',
                    'tasks',
                    'students',
                    'communication'
                ]
            },
            {
                'name': 'Student',
                'description': 'Student with limited access to view content',
                'permissions': [
                    'schedule',
                    'materials',
                    'library',
                    'tasks',
                    'blogs'
                ]
            },
            {
                'name': 'Parent',
                'description': 'Parent with access to student information',
                'permissions': [
                    'students',
                    'schedule',
                    'academics',
                    'communication'
                ]
            },
            {
                'name': 'Librarian',
                'description': 'Library staff with access to library management',
                'permissions': [
                    'library',
                    'students',
                    'teachers'
                ]
            },
            {
                'name': 'Staff',
                'description': 'General staff member',
                'permissions': [
                    'students',
                    'teachers',
                    'schedule'
                ]
            }
        ]

        for role_data in roles_data:
            role, created = Role.objects.get_or_create(
                name=role_data['name'],
                defaults={'description': role_data['description']}
            )

            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'Created role: {role.name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Role already exists: {role.name}')
                )

            # Assign permissions
            if role_data['permissions'] == 'all':
                # Grant all permissions for admin roles
                all_permissions = Permission.objects.all()
                for perm in all_permissions:
                    RolePermission.objects.get_or_create(
                        role=role,
                        content_type=perm.content_type,
                        permission=perm
                    )
                self.stdout.write(
                    self.style.SUCCESS(f'  Assigned all permissions to {role.name}')
                )
            else:
                # Grant specific app permissions
                for app_label in role_data['permissions']:
                    content_types = ContentType.objects.filter(app_label=app_label)
                    for ct in content_types:
                        permissions = Permission.objects.filter(content_type=ct)
                        for perm in permissions:
                            RolePermission.objects.get_or_create(
                                role=role,
                                content_type=ct,
                                permission=perm
                            )
                self.stdout.write(
                    self.style.SUCCESS(
                        f'  Assigned {len(role_data["permissions"])} app permissions to {role.name}'
                    )
                )

        self.stdout.write(
            self.style.SUCCESS('\nAll roles created successfully!')
        )
