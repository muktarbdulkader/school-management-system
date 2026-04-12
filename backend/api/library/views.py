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

        borrowing.return_date = timezone.now().date()
        borrowing.status = 'returned'
        borrowing.save()

        return Response({
            'success': True,
            'message': 'Book returned successfully',
            'status': 200,
            'data': BookBorrowingSerializer(borrowing).data
        })

    @action(detail=False, methods=['get'], url_path='overdue')
    def overdue_books(self, request):
        today = timezone.now().date()
        overdue = self.queryset.filter(status='borrowed', due_date__lt=today)
        serializer = self.get_serializer(overdue, many=True)
        return Response({'success': True, 'message': 'OK', 'status': 200, 'data': serializer.data})

    @action(detail=False, methods=['get'], url_path='my_borrowings')
    def my_borrowings(self, request):
        try:
            member = LibraryMember.objects.get(user=request.user)
            borrowings = self.queryset.filter(borrower=member)
            serializer = self.get_serializer(borrowings, many=True)
            return Response({'success': True, 'message': 'OK', 'status': 200, 'data': serializer.data})
        except LibraryMember.DoesNotExist:
            return Response({'success': False, 'message': 'Not a library member', 'status': 404}, status=404)
