from django.shortcuts import render
from rest_framework import serializers
from users.serializers import UserSerializer
from .models import Book, LibraryMember, BookBorrowing
class BookSerializer(serializers.ModelSerializer):
    available = serializers.SerializerMethodField()
    added_by_name = serializers.CharField(source='added_by.full_name', read_only=True)

    class Meta:
        model = Book
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'added_by']

    def get_available(self, obj):
        return obj.available_copies > 0
class LibraryMemberSerializer(serializers.ModelSerializer):
    user_name=serializers.CharField(source='user.full_name', read_only=True)
    user_email=serializers.CharField(source='user.email', read_only=True)
    can_borrow=serializers.BooleanField(read_only=True)
    class Meta:
        model = LibraryMember
        fields = '__all__'
        read_only_fields = ['id', 'current_books_borrowed', 'total_fines', 'joined_date']

class BookBorrowingSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source='book.title', read_only=True)
    borrower_name = serializers.CharField(source='borrower.user.full_name', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    calculated_fine = serializers.SerializerMethodField()

    class Meta:
        model = BookBorrowing
        fields = '__all__'
        read_only_fields = ['id', 'borrowed_date', 'librarian']

    def get_calculated_fine(self, obj):
        return str(obj.calculate_fine())
class BookBorrowingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model=BookBorrowing
        fields=['book', 'borrower', 'due_date', 'notes']
    def validate(self, data):
        Borrower=data.get('borrower')
        book=data.get('book')
        if not Borrower.can_borrow():
            raise serializers.ValidationError("Member cannot borrow books (suspended, max limit, or high fines)")
        if book.available_copies <= 0:
            raise serializers.ValidationError("Book is not available")
        return data