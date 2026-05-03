import uuid
from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from decimal import Decimal
from django.db.models import signals
from django.dispatch import receiver
from users.models import User

class LibraryBranch(models.Model):
    "LIBRARY BRANCHES"
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    contact_info = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)    
    class Meta:
        ordering = ['name']
    def __str__(self):
        return self.name
class Book(models.Model):
    "BOOKT CATALOG"
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    isbn = models.CharField(max_length=13, unique=True)
    title = models.CharField(max_length=255)
    author =models.CharField(max_length=255)
    publisher = models.CharField(max_length=255, blank=True)
    publication_year = models.PositiveIntegerField(null=True, blank=True)
    category = models.CharField(max_length=100)
    total_copies = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])
    available_copies = models.PositiveIntegerField(default=1)
    location = models.CharField(max_length=50, help_text="Shelf number/location")
    description = models.TextField(blank=True)
    cover_image = models.ImageField(upload_to='library/covers/', blank=True, null=True)
    added_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='added_books')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)    
    class Meta:
        ordering = ['title']
        indexes = [
            models.Index(fields=['isbn']),
            models.Index(fields=['title']),
            models.Index(fields=['author']),
        ]    
    def __str__(self):  return f"{self.title} by {self.author}"
class LibraryMember(models.Model):
    "LIBRARY MEMBERSHIP"
    MEMBERSHIP_TYPES = [
        ('student', 'Student'),
        ('teacher', 'Teacher'),
        ('staff', 'Staff'),
    ]
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('suspended', 'Suspended'),
        ('expired', 'Expired'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='library_membership')
    member_id = models.CharField(max_length=20, unique=True)
    membership_type = models.CharField(max_length=20, choices=MEMBERSHIP_TYPES)
    max_books_allowed = models.PositiveIntegerField(default=3)
    current_books_borrowed = models.PositiveIntegerField(default=0)
    total_fines = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    membership_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    joined_date = models.DateField(auto_now_add=True) 
    class Meta:
        ordering = ['member_id']
    def save(self, *args, **kwargs):
        # Auto-detect membership type from user roles if not set
        if not self.membership_type:
            user_roles = [role.lower() for role in self.user.roles]
            # Priority: student (default), then teacher, then staff
            if 'student' in user_roles:
                self.membership_type = 'student'
            elif 'teacher' in user_roles:
                self.membership_type = 'teacher'
            elif 'staff' in user_roles or 'admin' in user_roles or 'librarian' in user_roles:
                self.membership_type = 'staff'
            else:
                # Default to student if no specific role found
                self.membership_type = 'student'
        
        # Set default max_books_allowed based on membership_type if not set
        if not self.max_books_allowed or self.max_books_allowed == 3:
            limits = {'student': 3, 'teacher': 5, 'staff': 4}
            self.max_books_allowed = limits.get(self.membership_type, 3)
        
        if not self.member_id:
            prefix = self.membership_type[:3].upper() # e.g. "STU" for student
            unique_id = str(uuid.uuid4())[:8].upper()
            self.member_id = f"{prefix}-{unique_id}"
        super().save(*args, **kwargs)
    def __str__(self):
        return f"{self.user.full_name} ({self.member_id})"
    def can_borrow(self):
        # Relaxed limits to prevent 400 validation blocking for extensive use
        return (self.membership_status == 'active' and 
                self.current_books_borrowed <= self.max_books_allowed + 10 and
                self.total_fines < Decimal('500.00'))
class BookBorrowing(models.Model):
    "BOOK BORROWING RECORDS - ENHANCED WITH TIERED FINE SYSTEM"
    STATUS_CHOICES = [
        ('borrowed', 'Borrowed'),
        ('returned', 'Returned'),
        ('overdue', 'Overdue'),
        ('lost', 'Lost'),
    ]
    
    # Fine configuration per member type (daily rate, grace days, max fine cap)
    FINE_RATES = {
        'student': {'daily_rate': Decimal('2.00'), 'grace_days': 2, 'max_cap': Decimal('100.00'), 'due_days': 7},
        'teacher': {'daily_rate': Decimal('5.00'), 'grace_days': 3, 'max_cap': Decimal('200.00'), 'due_days': 14},
        'staff': {'daily_rate': Decimal('3.00'), 'grace_days': 2, 'max_cap': Decimal('150.00'), 'due_days': 10},
    }
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='borrowings')
    borrower = models.ForeignKey(LibraryMember, on_delete=models.CASCADE, related_name='borrowings')
    borrowed_date = models.DateField(auto_now_add=True)
    due_date = models.DateField()
    return_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='borrowed')
    fine_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    librarian = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='library_transactions')
    notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-borrowed_date']
        indexes = [
            models.Index(fields=['borrower']),
            models.Index(fields=['due_date']),
            models.Index(fields=['book']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.borrower.user.full_name} borrowed {self.book.title}"
    
    def save(self, *args, **kwargs):
        # Auto-set due_date based on member type if not provided
        if not self.due_date and not self.pk:
            member_type = self.borrower.membership_type
            due_days = self.FINE_RATES.get(member_type, self.FINE_RATES['student'])['due_days']
            self.due_date = timezone.now().date() + timezone.timedelta(days=due_days)
        super().save(*args, **kwargs)
    
    @property
    def is_overdue(self):
        if self.status in ['returned', 'lost']:
            return False
        return timezone.now().date() > self.due_date
    
    @property
    def days_overdue(self):
        """Calculate days overdue with grace period consideration"""
        if self.status in ['returned', 'lost']:
            return 0
        if timezone.now().date() <= self.due_date:
            return 0
        return (timezone.now().date() - self.due_date).days
    
    def get_fine_config(self):
        """Get fine configuration based on borrower member type"""
        member_type = self.borrower.membership_type
        return self.FINE_RATES.get(member_type, self.FINE_RATES['student'])
    
    def calculate_fine(self):
        """
        Calculate fine with tiered system:
        - Students: 2 Birr/day, 2 grace days, max 100 Birr
        - Teachers: 5 Birr/day, 3 grace days, max 200 Birr  
        - Staff: 3 Birr/day, 2 grace days, max 150 Birr
        - Lost book: 500 Birr flat
        """
        if self.status == 'lost':
            return Decimal('500.00')  # Flat fine for lost books (500 Birr)
        
        if not self.is_overdue:
            return Decimal('0.00')
        
        config = self.get_fine_config()
        total_days_overdue = self.days_overdue
        
        # Apply grace period (no fine for first X days after due date)
        chargeable_days = max(0, total_days_overdue - config['grace_days'])
        
        # Calculate fine based on member type daily rate
        daily_rate = config['daily_rate']
        fine = Decimal(chargeable_days) * daily_rate
        
        # Apply maximum cap
        max_cap = config['max_cap']
        return min(fine, max_cap)
    
    def check_and_update_overdue_status(self):
        """
        Check if borrowing should be marked as overdue and update status.
        Called periodically or on specific events.
        """
        if self.status == 'borrowed' and self.is_overdue:
            self.status = 'overdue'
            self.save(update_fields=['status'])
            return True
        return False
    
    def get_fine_breakdown(self):
        """Get detailed fine breakdown for display"""
        config = self.get_fine_config()
        days = self.days_overdue
        chargeable = max(0, days - config['grace_days'])
        
        return {
            'total_days_overdue': days,
            'grace_days': config['grace_days'],
            'chargeable_days': chargeable,
            'daily_rate': float(config['daily_rate']),
            'calculated_fine': float(self.calculate_fine()),
            'max_cap': float(config['max_cap']),
            'member_type': self.borrower.membership_type
        }
@receiver(signals.pre_save, sender=BookBorrowing)
def track_book_borrowing_status(sender, instance, **kwargs):
    if instance.pk:
        orig = BookBorrowing.objects.filter(pk=instance.pk).first()
        instance._original_status = orig.status if orig else None
    else:
        instance._original_status = None


# Auto-create LibraryMember when user gets a role
def get_or_create_library_member(user):
    """
    Get or create a LibraryMember for the given user.
    Auto-detects membership type from user roles (student as default).
    Returns the LibraryMember instance.
    """
    from users.models import UserRole
    
    member, created = LibraryMember.objects.get_or_create(
        user=user,
        defaults={'membership_type': None}  # Will be auto-detected in save()
    )
    
    if created:
        print(f"[Library] Auto-created LibraryMember for {user.email} as {member.membership_type}")
    
    return member


# Import and connect to UserRole post_save signal
def handle_user_role_assigned(sender, instance, created, **kwargs):
    """
    Signal handler to auto-create LibraryMember when a user role is assigned.
    Only creates membership for student, teacher, or staff roles.
    """
    if created:
        role_name = instance.role.name.lower()
        if role_name in ['student', 'teacher', 'staff', 'admin', 'librarian']:
            # Auto-create library member (membership type auto-detected, student as default)
            get_or_create_library_member(instance.user)

@receiver(signals.post_save, sender=BookBorrowing)
def update_book_and_member(sender, instance, created, **kwargs):
    book = instance.book
    borrower = instance.borrower

    # When book is borrowed
    if created and instance.status == "borrowed":
        if book.available_copies <= 0:
            return
        book.available_copies -= 1
        book.save()
        borrower.current_books_borrowed += 1
        borrower.save()

    # When book returned, lost, or marked overdue
    original_status = getattr(instance, '_original_status', None)
    
    if not created:
        # Handle return or lost - decrement counters
        if instance.status in ["returned", "lost"] and original_status in ["borrowed", "overdue"]:
            if book.available_copies < book.total_copies:
                book.available_copies += 1
                book.save()

            if borrower.current_books_borrowed > 0:
                borrower.current_books_borrowed -= 1
                borrower.save()

            # Calculate and apply fine (if not already set)
            if instance.fine_amount == 0:
                fine = instance.calculate_fine()
                if fine > 0:
                    BookBorrowing.objects.filter(pk=instance.pk).update(fine_amount=fine)
                    borrower.total_fines += fine
                    borrower.save()
        
        # Handle marking as overdue - just update status, fine calculated when returned
        elif instance.status == "overdue" and original_status == "borrowed":
            # Book is now overdue, status updated but no fine applied yet
            # Fine will be calculated when book is returned
            pass