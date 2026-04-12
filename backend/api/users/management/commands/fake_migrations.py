from django.core.management.base import BaseCommand
from django.db import connection

class Command(BaseCommand):
    help = 'Mark migrations as applied if tables already exist'

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            # Check if users_librarianprofile table exists
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'users_librarianprofile'
                );
            """)
            table_exists = cursor.fetchone()[0]

            if table_exists:
                # Mark the migration as applied
                cursor.execute("""
                    INSERT INTO django_migrations (app, name, applied)
                    VALUES ('users', '0002_librarianprofile', NOW())
                    ON CONFLICT DO NOTHING;
                """)
                self.stdout.write(self.style.SUCCESS('✅ Marked users.0002_librarianprofile as applied'))
            else:
                self.stdout.write(self.style.WARNING('⚠️  Table does not exist, migration will run normally'))
