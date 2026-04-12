from django.core.management.base import BaseCommand
from users.models import User

class Command(BaseCommand):
    help = 'Set password for a user by email'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='User email')
        parser.add_argument('password', type=str, help='New password')

    def handle(self, *args, **options):
        email = options['email']
        password = options['password']

        try:
            user = User.objects.get(email=email)
            user.set_password(password)
            user.save()

            self.stdout.write(self.style.SUCCESS(f'✅ Password changed for {email}'))
            self.stdout.write(f'   Staff: {user.is_staff}')
            self.stdout.write(f'   Superuser: {user.is_superuser}')

        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'❌ User not found: {email}'))
            self.stdout.write('\nAvailable users:')
            for u in User.objects.all():
                self.stdout.write(f'  - {u.email}')
