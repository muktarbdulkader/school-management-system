from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Count
from students.models import Student
from users.models import User


class Command(BaseCommand):
    help = 'Find and clean up duplicate student records'

    def add_arguments(self, parser):
        parser.add_argument(
            '--execute',
            action='store_true',
            help='Actually delete duplicates (default is dry-run)',
        )

    def handle(self, *args, **options):
        execute = options['execute']

        if execute:
            self.stdout.write(self.style.WARNING('=' * 60))
            self.stdout.write(self.style.WARNING('EXECUTING CLEANUP - This will permanently delete duplicates!'))
            self.stdout.write(self.style.WARNING('=' * 60))
        else:
            self.stdout.write(self.style.SUCCESS('=' * 60))
            self.stdout.write(self.style.SUCCESS('DRY RUN MODE - No changes will be made'))
            self.stdout.write(self.style.SUCCESS('=' * 60))

        # Find users with multiple student profiles
        users_with_duplicates = User.objects.annotate(
            student_count=Count('student_profile')
        ).filter(student_count__gt=1)

        if not users_with_duplicates.exists():
            self.stdout.write(self.style.SUCCESS('\n✓ No duplicate student records found!'))
            return

        self.stdout.write(f'\nFound {users_with_duplicates.count()} users with duplicate student profiles:\n')

        total_duplicates = 0

        with transaction.atomic():
            for user in users_with_duplicates:
                # Get all student profiles for this user, ordered by ID (oldest first)
                students = Student.objects.filter(user=user).order_by('id')

                self.stdout.write(f'\nUser: {user.full_name} ({user.email})')
                self.stdout.write(f'  Student profiles: {students.count()}')

                # Keep the first (oldest) student record
                keep_student = students.first()
                duplicate_students = students.exclude(id=keep_student.id)

                self.stdout.write(self.style.SUCCESS(f'  ✓ Keeping: {keep_student.student_id} (ID: {keep_student.id})'))

                for dup in duplicate_students:
                    self.stdout.write(self.style.WARNING(f'  ✗ Removing: {dup.student_id} (ID: {dup.id})'))
                    total_duplicates += 1

                    if execute:
                        dup.delete()

            # Check for duplicate student_id values
            duplicate_ids = Student.objects.values('student_id').annotate(
                count=Count('id')
            ).filter(count__gt=1, student_id__isnull=False)

            if duplicate_ids.exists():
                self.stdout.write(self.style.WARNING('\n⚠ Warning: Found duplicate student_id values:'))
                for item in duplicate_ids:
                    students = Student.objects.filter(student_id=item['student_id'])
                    self.stdout.write(f"\n  Student ID: {item['student_id']} (appears {item['count']} times)")
                    for student in students:
                        self.stdout.write(f"    - {student.user.full_name} ({student.user.email}) - UUID: {student.id}")

            if not execute:
                # Rollback in dry run mode
                transaction.set_rollback(True)
                self.stdout.write(f'\n{"[DRY RUN] "}Total duplicates would be removed: {total_duplicates}')
                self.stdout.write(self.style.WARNING('\nTo actually remove duplicates, run: python manage.py cleanup_duplicate_students --execute'))
            else:
                self.stdout.write(self.style.SUCCESS(f'\n✓ Successfully removed {total_duplicates} duplicate student records'))

        self.stdout.write('\n' + '=' * 60)
        self.stdout.write(self.style.SUCCESS('Done!'))
        self.stdout.write('=' * 60)
