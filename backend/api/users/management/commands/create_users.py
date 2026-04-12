from django.core.management.base import BaseCommand
from django.db import transaction
from users.models import User, Role, UserRole, Branch
from students.models import Student
from teachers.models import Teacher


class Command(BaseCommand):
    help = 'Create sample users with their roles'

    def add_arguments(self, parser):
        parser.add_argument(
            '--role',
            type=str,
            help='Specific role to create user for (e.g., admin, teacher, student, parent)',
        )
        parser.add_argument(
            '--email',
            type=str,
            help='Email for the user',
        )
        parser.add_argument(
            '--name',
            type=str,
            help='Full name for the user',
        )
        parser.add_argument(
            '--password',
            type=str,
            default='password123',
            help='Password for the user (default: password123)',
        )

    def handle(self, *args, **options):
        role_name = options.get('role')
        email = options.get('email')
        name = options.get('name')
        password = options.get('password')

        if role_name and email and name:
            # Create single user with specified role
            self.create_single_user(email, name, password, role_name)
        else:
            # Create sample users for all roles
            self.create_sample_users()

    @transaction.atomic
    def create_single_user(self, email, name, password, role_name):
        """Create a single user with specified role"""
        try:
            role = Role.objects.get(name__iexact=role_name)
        except Role.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'Role "{role_name}" does not exist. Please run create_roles first.')
            )
            return

        # Check if user already exists
        if User.objects.filter(email=email).exists():
            self.stdout.write(
                self.style.WARNING(f'User with email {email} already exists')
            )
            return

        # Create user
        user = User.objects.create_user(
            email=email,
            full_name=name,
            password=password
        )

        # Assign role
        UserRole.objects.create(
            user=user,
            role=role,
            access_level='full',
            assigned_by=None
        )

        self.stdout.write(
            self.style.SUCCESS(f'Created user: {name} ({email}) with role: {role.name}')
        )

    @transaction.atomic
    def create_sample_users(self):
        """Create sample users for all roles"""

        # Ensure roles exist
        if not Role.objects.exists():
            self.stdout.write(
                self.style.ERROR('No roles found. Please run create_roles command first.')
            )
            return

        users_data = [
            {
                'email': 'superadmin@school.com',
                'full_name': 'Super Administrator',
                'password': 'admin123',
                'role': 'Super_Admin',
                'is_staff': True,
                'is_superuser': True
            },
            {
                'email': 'admin@school.com',
                'full_name': 'School Administrator',
                'password': 'admin123',
                'role': 'Admin',
                'is_staff': True
            },
            {
                'email': 'headadmin@school.com',
                'full_name': 'Head Administrator',
                'password': 'admin123',
                'role': 'Head_Admin',
                'is_staff': True
            },
            {
                'email': 'ceo@school.com',
                'full_name': 'Chief Executive Officer',
                'password': 'admin123',
                'role': 'CEO',
                'is_staff': True
            },
            {
                'email': 'teacher1@school.com',
                'full_name': 'John Teacher',
                'password': 'teacher123',
                'role': 'Teacher'
            },
            {
                'email': 'teacher2@school.com',
                'full_name': 'Jane Teacher',
                'password': 'teacher123',
                'role': 'Teacher'
            },
            {
                'email': 'student1@school.com',
                'full_name': 'Alice Student',
                'password': 'student123',
                'role': 'Student'
            },
            {
                'email': 'student2@school.com',
                'full_name': 'Bob Student',
                'password': 'student123',
                'role': 'Student'
            },
            {
                'email': 'parent1@school.com',
                'full_name': 'Mary Parent',
                'password': 'parent123',
                'role': 'Parent'
            },
            {
                'email': 'parent2@school.com',
                'full_name': 'David Parent',
                'password': 'parent123',
                'role': 'Parent'
            },
            {
                'email': 'librarian@school.com',
                'full_name': 'Sarah Librarian',
                'password': 'librarian123',
                'role': 'Librarian'
            },
            {
                'email': 'staff@school.com',
                'full_name': 'General Staff',
                'password': 'staff123',
                'role': 'Staff'
            }
        ]

        created_count = 0
        skipped_count = 0

        for user_data in users_data:
            # Check if user already exists
            if User.objects.filter(email=user_data['email']).exists():
                self.stdout.write(
                    self.style.WARNING(f'User already exists: {user_data["email"]}')
                )
                skipped_count += 1
                continue

            # Get role
            try:
                role = Role.objects.get(name=user_data['role'])
            except Role.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'Role not found: {user_data["role"]}')
                )
                continue

            # Create user
            user = User.objects.create_user(
                email=user_data['email'],
                full_name=user_data['full_name'],
                password=user_data['password']
            )

            # Set staff/superuser flags if specified
            if user_data.get('is_staff'):
                user.is_staff = True
            if user_data.get('is_superuser'):
                user.is_superuser = True
            user.save()

            # Assign role
            UserRole.objects.create(
                user=user,
                role=role,
                access_level='full',
                assigned_by=None
            )

            self.stdout.write(
                self.style.SUCCESS(
                    f'Created: {user.full_name} ({user.email}) - Role: {role.name}'
                )
            )
            created_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'\nSummary: {created_count} users created, {skipped_count} skipped'
            )
        )
