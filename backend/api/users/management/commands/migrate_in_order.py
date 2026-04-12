from django.core.management.base import BaseCommand
from django.core.management import call_command


class Command(BaseCommand):
    help = 'Run migrations in the correct order to avoid dependency issues'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting ordered migration process...'))

        # Step 1: Migrate contenttypes first (required by auth)
        self.stdout.write('Step 1: Migrating contenttypes...')
        call_command('migrate', 'contenttypes', verbosity=1)

        # Step 2: Migrate users app (creates custom User model)
        self.stdout.write('Step 2: Migrating users app...')
        call_command('migrate', 'users', verbosity=1)

        # Step 3: Migrate auth (depends on User model)
        self.stdout.write('Step 3: Migrating auth...')
        call_command('migrate', 'auth', verbosity=1)

        # Step 4: Migrate all remaining apps
        self.stdout.write('Step 4: Migrating all remaining apps...')
        call_command('migrate', verbosity=1)

        self.stdout.write(self.style.SUCCESS('All migrations completed successfully!'))
