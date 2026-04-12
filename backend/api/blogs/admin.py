from django.contrib import admin

from users.models import UserBranchAccess
from .models import BlogCategories, BlogPosts, BlogComments

class BlogCommentsInline(admin.TabularInline):
    model = BlogComments
    extra = 1
    show_change_link = True

@admin.register(BlogCategories)
class BlogCategoriesAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'description')
    search_fields = ('name', 'description')
    readonly_fields = ('id',)

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        if not request.user.is_superuser:
            accessible_branches = UserBranchAccess.objects.filter(user=request.user).values_list('branch_id', flat=True)
            queryset = queryset.filter(id__in=BlogPosts.objects.filter(category_id__in=queryset).values_list('category_id', flat=True))
        return queryset

@admin.register(BlogPosts)
class BlogPostsAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'author', 'published_date', 'is_published')
    list_filter = ('is_published', 'category', 'published_date')
    search_fields = ('title', 'content', 'author__full_name')
    readonly_fields = ('id', 'published_date', 'updated_date')
    inlines = [BlogCommentsInline]

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        if not request.user.is_superuser:
            accessible_branches = UserBranchAccess.objects.filter(user=request.user).values_list('branch_id', flat=True)
            queryset = queryset.filter(author__branch_id__in=accessible_branches)
        return queryset

@admin.register(BlogComments)
class BlogCommentsAdmin(admin.ModelAdmin):
    list_display = ('id', 'post', 'author', 'created_date', 'is_approved')
    list_filter = ('is_approved', 'created_date')
    search_fields = ('content', 'author__user_id__full_name')
    readonly_fields = ('id', 'created_date')

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        if not request.user.is_superuser:
            accessible_branches = UserBranchAccess.objects.filter(user=request.user).values_list('branch_id', flat=True)
            queryset = queryset.filter(post__author__branch_id__in=accessible_branches)
        return queryset
