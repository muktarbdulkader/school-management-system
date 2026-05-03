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
    detected_type = serializers.SerializerMethodField()
    display_label = serializers.SerializerMethodField()
    
    class Meta:
        model = LibraryMember
        fields = '__all__'
        read_only_fields = ['id', 'current_books_borrowed', 'total_fines', 'joined_date', 'member_id']
    
    def get_detected_type(self, obj):
        """Show what membership type would be auto-detected from user roles"""
        user_roles = [role.lower() for role in obj.user.roles]
        if 'student' in user_roles:
            return 'student'
        elif 'teacher' in user_roles:
            return 'teacher'
        elif any(r in user_roles for r in ['staff', 'admin', 'librarian']):
            return 'staff'
        return 'student'  # default
    
    def get_display_label(self, obj):
        """Formatted label for dropdown: 'John Doe (Student - STU-XXXX)'"""
        member_type = obj.membership_type.capitalize()
        return f"{obj.user.full_name} ({member_type})"
    
    def validate(self, data):
        # If membership_type not provided, it will be auto-detected
        if not data.get('membership_type') and self.instance is None:
            user = data.get('user')
            if user:
                user_roles = [role.lower() for role in user.roles]
                if 'student' in user_roles:
                    data['membership_type'] = 'student'
                elif 'teacher' in user_roles:
                    data['membership_type'] = 'teacher'
                elif any(r in user_roles for r in ['staff', 'admin', 'librarian']):
                    data['membership_type'] = 'staff'
                else:
                    data['membership_type'] = 'student'  # default
        return data

class BookBorrowingSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source='book.title', read_only=True)
    borrower_name = serializers.CharField(source='borrower.user.full_name', read_only=True)
    borrower_type = serializers.CharField(source='borrower.membership_type', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    days_overdue = serializers.IntegerField(read_only=True)
    calculated_fine = serializers.SerializerMethodField()
    fine_breakdown = serializers.SerializerMethodField()

    class Meta:
        model = BookBorrowing
        fields = '__all__'
        read_only_fields = ['id', 'borrowed_date', 'librarian']

    def get_calculated_fine(self, obj):
        return str(obj.calculate_fine())
    
    def get_fine_breakdown(self, obj):
        return obj.get_fine_breakdown()
class BookBorrowingCreateSerializer(serializers.ModelSerializer):
    due_date = serializers.DateField(required=False, allow_null=True)
    
    class Meta:
        model=BookBorrowing
        fields=['book', 'borrower', 'due_date', 'notes']
    
    def validate(self, data):
        borrower = data.get('borrower')
        book = data.get('book')
        
        if not borrower.can_borrow():
            raise serializers.ValidationError("Member cannot borrow books (suspended, max limit, or high fines)")
        if book.available_copies <= 0:
            raise serializers.ValidationError("Book is not available")
        
        # Auto-set due date based on member type if not provided
        if not data.get('due_date'):
            from datetime import timedelta
            from django.utils import timezone
            
            member_type = borrower.membership_type
            due_days = BookBorrowing.FINE_RATES.get(member_type, BookBorrowing.FINE_RATES['student'])['due_days']
            data['due_date'] = timezone.now().date() + timedelta(days=due_days)
        
        return data