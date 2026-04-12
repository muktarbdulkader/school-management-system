"""
Library Management Admin
"""
from django.contrib import admin
from .models import Book, LibraryMember, BookBorrowing


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'isbn', 'category', 'total_copies', 'available_copies']
    list_filter = ['category', 'publication_year']
    search_fields = ['title', 'author', 'isbn']
    ordering = ['title']


@admin.register(LibraryMember)
class LibraryMemberAdmin(admin.ModelAdmin):
    list_display = ['member_id', 'user', 'membership_type', 'current_books_borrowed', 'total_fines', 'membership_status']
    list_filter = ['membership_type', 'membership_status']
    search_fields = ['member_id', 'user__full_name', 'user__email']


@admin.register(BookBorrowing)
class BookBorrowingAdmin(admin.ModelAdmin):
    list_display = ['book', 'borrower', 'borrowed_date', 'due_date', 'return_date', 'status', 'fine_amount']
    list_filter = ['status', 'borrowed_date', 'due_date']
    search_fields = ['book__title', 'borrower__user__full_name']
    date_hierarchy = 'borrowed_date'
