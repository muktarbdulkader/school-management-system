from django.core.management.base import BaseCommand
from users.models import User, Role

class Command(BaseCommand):
    help = 'Deletes all users and roles'

    def handle(self, *args, **options):
        self.stdout.write('Deleting users...')
        user_deleted, _ = User.objects.all().delete()
        self.stdout.write(f'Users deleted: {user_deleted}')

        self.stdout.write('Deleting roles...')
        role_deleted, _ = Role.objects.all().delete()
        self.stdout.write(f'Roles deleted: {role_deleted}')

        self.stdout.write(self.style.SUCCESS('Successfully deleted all users and roles'))
