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
    "BOOK BORROWING RECORDS"
    STATUS_CHOICES = [
        ('borrowed', 'Borrowed'),
        ('returned', 'Returned'),
        ('overdue', 'Overdue'),
        ('lost', 'Lost'),
    ]
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
    @property
    def is_overdue(self):
        if self.status in ['returned', 'lost']:
            return False
        return timezone.now().date() > self.due_date
    def calculate_fine(self):
        if self.status == 'lost':
            return Decimal('500.00')  # Flat fine for lost books (500 Birr)
        elif self.is_overdue:
            days_overdue = (timezone.now().date() - self.due_date).days
            return Decimal(days_overdue) * Decimal('5.00')  # 5 Birr per day overdue
        return Decimal('0.00')
@receiver(signals.pre_save, sender=BookBorrowing)
def track_book_borrowing_status(sender, instance, **kwargs):
    if instance.pk:
        orig = BookBorrowing.objects.filter(pk=instance.pk).first()
        instance._original_status = orig.status if orig else None
    else:
        instance._original_status = None

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

    # When book returned or lost
    original_status = getattr(instance, '_original_status', None)
    if not created and instance.status in ["returned", "lost"] and original_status == "borrowed":
        if book.available_copies < book.total_copies:
            book.available_copies += 1
            book.save()

        if borrower.current_books_borrowed > 0:
            borrower.current_books_borrowed -= 1
            borrower.save()

        fine = instance.calculate_fine()
        if fine > 0:
            BookBorrowing.objects.filter(pk=instance.pk).update(fine_amount=fine)

            borrower.total_fines += fine
            borrower.save()