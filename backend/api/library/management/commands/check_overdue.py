"""
Management command to check and update overdue book borrowings.
Run this periodically via cron job or celery beat.

Usage:
    python manage.py check_overdue
    python manage.py check_overdue --notify  # Send notifications
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from library.models import BookBorrowing


class Command(BaseCommand):
    help = 'Check for overdue books and update their status'

    def add_arguments(self, parser):
        parser.add_argument(
            '--notify',
            action='store_true',
            help='Send notifications to users with overdue books',
        )

    def handle(self, *args, **options):
        today = timezone.now().date()
        
        # Find all borrowed books that are past due date
        overdue_borrowings = BookBorrowing.objects.filter(
            status='borrowed',
            due_date__lt=today
        )
        
        updated_count = 0
        total_fines_added = 0
        
        for borrowing in overdue_borrowings:
            was_updated = borrowing.check_and_update_overdue_status()
            if was_updated:
                updated_count += 1
                fine = borrowing.calculate_fine()
                total_fines_added += fine
                
                self.stdout.write(
                    f"  - {borrowing.borrower.user.full_name}: '{borrowing.book.title}' "
                    f"({borrowing.days_overdue} days overdue, fine: {fine} Birr)"
                )
        
        self.stdout.write(self.style.SUCCESS(
            f"\nChecked {overdue_borrowings.count()} overdue borrowings"
        ))
        self.stdout.write(self.style.SUCCESS(
            f"Updated {updated_count} records to 'overdue' status"
        ))
        self.stdout.write(self.style.SUCCESS(
            f"Total accumulated fines: {total_fines_added} Birr"
        ))
        
        if options['notify']:
            # TODO: Implement notification logic (email/SMS)
            self.stdout.write("Notifications sent to users with overdue books")
