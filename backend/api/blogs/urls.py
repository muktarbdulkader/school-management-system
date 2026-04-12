from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BlogCategoriesViewSet, BlogPostsViewSet, BlogCommentsViewSet

router = DefaultRouter()
router.register(r'blog_categories', BlogCategoriesViewSet)
router.register(r'blog_posts', BlogPostsViewSet)
router.register(r'blog_comments', BlogCommentsViewSet)

urlpatterns = [
    path('', include(router.urls)),
]