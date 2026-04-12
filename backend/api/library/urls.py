from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import BookViewSet, LibraryMemberViewSet, BookBorrowingViewSet
router = DefaultRouter()
router.register(r'books', BookViewSet, basename='books')
router.register(r'members', LibraryMemberViewSet, basename='library-members')
router.register(r'borrowings', BookBorrowingViewSet, basename='borrowings')
urlpatterns = router.urls