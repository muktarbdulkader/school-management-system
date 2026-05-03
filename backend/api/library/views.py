from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated,BasePermission
from communication import models
from .models import Book, LibraryMember, BookBorrowing
from .serializers import BookSerializer, LibraryMemberSerializer, BookBorrowingSerializer, BookBorrowingCreateSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone

from rest_framework.permissions import BasePermission

class IsLibrarian(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        # Check that user is authenticated and has a profile
        return bool(
            user.is_authenticated and
            hasattr(user, 'librarianprofile') and
            user.librarianprofile.is_librarian
        )

class IsNonStudentOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True

        user_roles = getattr(request.user, 'roles', [])
        is_student = any(role.lower() == 'student' for role in user_roles)
        return not is_student

# Create your views here.
class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    permission_classes = [IsAuthenticated, IsNonStudentOrReadOnly]

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({'success': True, 'message': 'OK', 'status': 200, 'data': serializer.data})

    def create(self, request, *args, **kwargs):
        # The IsNonStudentOrReadOnly permission class now handles this logic
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({'success': True, 'message': 'Book added', 'status': 201, 'data': serializer.data}, status=201)

    def perform_create(self, serializer):
        serializer.save(added_by=self.request.user)

    @action(detail=False, methods=['get'], url_path='available')
    def available_books(self, request):
        books = self.queryset.filter(available_copies__gt=0)
        serializer = self.get_serializer(books, many=True)
        return Response({'success': True, 'message': 'OK', 'status': 200, 'data': serializer.data})

    @action(detail=False, methods=['get'], url_path='search')
    def search_books(self, request):
        query = request.query_params.get('q', '')
        books = self.queryset.filter(
            models.Q(title__icontains=query) |
            models.Q(author__icontains=query) |
            models.Q(isbn__icontains=query)
        )
        serializer = self.get_serializer(books, many=True)
        return Response({'success': True, 'message': 'OK', 'status': 200, 'data': serializer.data})


class LibraryMemberViewSet(viewsets.ModelViewSet):
    queryset = LibraryMember.objects.all()
    serializer_class = LibraryMemberSerializer
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({'success': True, 'message': 'OK', 'status': 200, 'data': serializer.data})

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({'success': True, 'message': 'Member created', 'status': 201, 'data': serializer.data}, status=201)


class BookBorrowingViewSet(viewsets.ModelViewSet):
    queryset = BookBorrowing.objects.all()
    serializer_class = BookBorrowingSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return BookBorrowingCreateSerializer
        return BookBorrowingSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({'success': True, 'message': 'OK', 'status': 200, 'data': serializer.data})

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Ensure borrower has a LibraryMember record
        # Auto-create with student as default if not exists
        borrower = serializer.validated_data.get('borrower')
        if not borrower:
            # If borrower not provided, try to get/create from request.user
            from .models import get_or_create_library_member
            try:
                member = get_or_create_library_member(request.user)
                serializer.validated_data['borrower'] = member
            except Exception as e:
                return Response({
                    'success': False,
                    'message': f'Could not create library membership: {str(e)}',
                    'status': 400
                }, status=400)

        # Perform borrowing (Signal handles decrementing)
        borrowing = serializer.save(librarian=request.user)

        return Response({
            'success': True,
            'message': 'Book borrowed successfully',
            'status': 201,
            'data': BookBorrowingSerializer(borrowing).data
        }, status=201)

    @action(detail=True, methods=['post'], url_path='return')
    def return_book(self, request, pk=None):
        borrowing = self.get_object()

        if borrowing.status == 'returned':
            return Response({'success': False, 'message': 'Book already returned'}, status=400)

        if borrowing.status == 'lost':
            return Response({'success': False, 'message': 'Cannot return a lost book. Use lost_book action instead.'}, status=400)

        # Calculate fine before returning
        fine = borrowing.calculate_fine()
        borrowing.return_date = timezone.now().date()
        borrowing.status = 'returned'
        borrowing.fine_amount = fine
        borrowing.save()

        # Update member's total fines
        if fine > 0:
            member = borrowing.borrower
            member.total_fines += fine
            member.save()

        # Build response message based on fine status
        if fine > 0:
            breakdown = borrowing.get_fine_breakdown()
            message = f"Book returned with fine of {fine} Birr. {breakdown['chargeable_days']} chargeable days after {breakdown['grace_days']} day grace period."
        else:
            message = "Book returned successfully. No fine applied."

        return Response({
            'success': True,
            'message': message,
            'status': 200,
            'fine_amount': str(fine),
            'fine_breakdown': borrowing.get_fine_breakdown() if fine > 0 else None,
            'data': BookBorrowingSerializer(borrowing).data
        })

    @action(detail=True, methods=['get'], url_path='check-fine')
    def check_fine(self, request, pk=None):
        """Check what fine would be applied if returned now"""
        borrowing = self.get_object()
        
        if borrowing.status in ['returned', 'lost']:
            return Response({
                'success': True,
                'message': f"Book already {borrowing.status}",
                'status': 200,
                'fine_amount': str(borrowing.fine_amount),
                'data': BookBorrowingSerializer(borrowing).data
            })
        
        fine = borrowing.calculate_fine()
        breakdown = borrowing.get_fine_breakdown()
        
        return Response({
            'success': True,
            'message': f"Current fine if returned now: {fine} Birr",
            'status': 200,
            'would_be_fine': str(fine),
            'days_remaining': max(0, (borrowing.due_date - timezone.now().date()).days),
            'fine_breakdown': breakdown,
            'can_avoid_fine': fine == 0 and borrowing.is_overdue and breakdown['total_days_overdue'] <= breakdown['grace_days'],
            'data': BookBorrowingSerializer(borrowing).data
        })

    @action(detail=True, methods=['post'], url_path='mark-lost')
    def mark_lost(self, request, pk=None):
        """Mark a book as lost with 500 Birr fine"""
        borrowing = self.get_object()
        
        if borrowing.status == 'returned':
            return Response({'success': False, 'message': 'Book already returned'}, status=400)
        
        if borrowing.status == 'lost':
            return Response({'success': False, 'message': 'Book already marked as lost'}, status=400)
        
        # Mark as lost with flat 500 Birr fine
        borrowing.status = 'lost'
        borrowing.fine_amount = 500.00
        borrowing.save()
        
        # Add fine to member's total
        member = borrowing.borrower
        member.total_fines += 500.00
        member.save()
        
        return Response({
            'success': True,
            'message': f"Book marked as lost. 500 Birr fine applied to {member.user.full_name}.",
            'status': 200,
            'fine_amount': '500.00',
            'data': BookBorrowingSerializer(borrowing).data
        })

    @action(detail=False, methods=['get'], url_path='overdue')
    def overdue_books(self, request):
        today = timezone.now().date()
        # Update status for all overdue books first
        overdue_borrowings = BookBorrowing.objects.filter(status='borrowed', due_date__lt=today)
        for borrowing in overdue_borrowings:
            borrowing.check_and_update_overdue_status()
        
        # Return all overdue (including newly updated)
        overdue = self.queryset.filter(status='overdue')
        serializer = self.get_serializer(overdue, many=True)
        
        # Calculate total outstanding fines
        total_fines = sum(b.calculate_fine() for b in overdue)
        
        return Response({
            'success': True, 
            'message': 'OK', 
            'status': 200, 
            'count': len(serializer.data),
            'total_outstanding_fines': str(total_fines),
            'data': serializer.data
        })

    @action(detail=False, methods=['get'], url_path='my_borrowings')
    def my_borrowings(self, request):
        from .models import get_or_create_library_member
        
        # Auto-create library member if not exists (student as default type)
        member = get_or_create_library_member(request.user)
        
        borrowings = self.queryset.filter(borrower=member)
        serializer = self.get_serializer(borrowings, many=True)
        return Response({'success': True, 'message': 'OK', 'status': 200, 'data': serializer.data})
