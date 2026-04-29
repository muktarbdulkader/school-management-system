from urllib import request
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action
from django.utils import timezone

from users.models import User, has_model_permission
from .models import BlogCategories, BlogPosts, BlogComments
from .serializers import BlogCategoriesSerializer, BlogPostsSerializer, BlogCommentsSerializer
from django.core.exceptions import PermissionDenied

class BlogCategoriesViewSet(viewsets.ModelViewSet):
    queryset = BlogCategories.objects.all()
    serializer_class = BlogCategoriesSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        branch_id = self.request.query_params.get('branch_id')
        if branch_id and not has_model_permission(user, 'blogcategories', 'view', branch_id):
            raise PermissionDenied("No permission to view blog categories.")
        return self.queryset.all()

    def list(self, request, *args, **kwargs):
        # Ensure default categories exist
        self.create_default_categories()
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'message': 'Categories retrieved successfully',
            'status': 200,
            'data': serializer.data
        })

    def create_default_categories(self):
        """Create default blog categories if they don't exist"""
        default_categories = [
            {'name': 'School', 'description': 'General school news and announcements'},
            {'name': 'Events', 'description': 'School events and activities'},
            {'name': 'Academics', 'description': 'Academic updates and achievements'},
            {'name': 'Sports', 'description': 'Sports news and achievements'},
            {'name': 'Parent Resources', 'description': 'Resources and information for parents'},
        ]

        for cat_data in default_categories:
            BlogCategories.objects.get_or_create(
                name=cat_data['name'],
                defaults={'description': cat_data['description']}
            )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({'success': True, 'message': 'Category created', 'status': 201, 'data': serializer.data}, status=201)

    def perform_create(self, serializer):
        branch_id = self.request.data.get('branch_id')
        if branch_id and not has_model_permission(self.request.user, 'blogcategories', 'add', branch_id):
            raise PermissionDenied("No permission to create categories.")
        serializer.save()

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({'success': True, 'message': 'Category updated', 'status': 200, 'data': serializer.data})

    def perform_update(self, serializer):
        branch_id = self.request.data.get('branch_id')
        if branch_id and not has_model_permission(self.request.user, 'blogcategories', 'change', branch_id):
            raise PermissionDenied("No permission to update categories.")
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({'success': True, 'message': 'Category deleted', 'status': 204, 'data': []}, status=204)

    def perform_destroy(self, instance):
        branch_id = self.request.query_params.get('branch_id')
        if branch_id and not has_model_permission(self.request.user, 'blogcategories', 'delete', branch_id):
            raise PermissionDenied("No permission to delete categories.")
        instance.delete()

class BlogPostsViewSet(viewsets.ModelViewSet):
    queryset = BlogPosts.objects.all()
    serializer_class = BlogPostsSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        branch_id = self.request.query_params.get('branch_id')

        # Check if user is a student or parent
        is_student_or_parent = False
        try:
            from students.models import Student, ParentStudent
            is_student_or_parent = Student.objects.filter(user=user).exists() or \
                                ParentStudent.objects.filter(parent__user=user).exists()
        except:
            pass

        # Superadmins can see everything
        if user.is_superuser:
            return self.queryset.all()

        # If not student/parent, check branch permission
        if not is_student_or_parent:
            if branch_id and not has_model_permission(user, 'blogposts', 'view', branch_id):
                raise PermissionDenied("No permission to view blog posts in this branch.")

        # Authors can see their own posts (even if unpublished)
        # Others can only see published posts
        from django.db.models import Q
        return self.queryset.filter(Q(is_published=True) | Q(author=user))

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'message': 'Posts retrieved successfully',
            'status': 200,
            'data': serializer.data
        })

    def create(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            if serializer.is_valid():
                self.perform_create(serializer)
                return Response({
                    'success': True, 
                    'message': 'Post created successfully', 
                    'status': 201, 
                    'data': serializer.data
                }, status=201)
            else:
                return Response({
                    'success': False,
                    'message': 'Invalid data',
                    'errors': serializer.errors,
                    'status': 400
                }, status=400)
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error creating post: {str(e)}',
                'status': 500,
                'error': str(e)
            }, status=500)

    def perform_create(self, serializer):
        branch_id = self.request.data.get('branch_id')
        if branch_id and not has_model_permission(self.request.user, 'blogposts', 'add', branch_id):
            raise PermissionDenied("No permission to create posts.")

        # Ensure school category exists
        school_category, created = BlogCategories.objects.get_or_create(
            name='School',
            defaults={'description': 'General school news and announcements'}
        )

        # If no category provided, use school category
        category = serializer.validated_data.get('category', school_category)
        if not category:
            category = school_category

        # Auto-publish posts from teachers and admins
        is_published = self.request.user.is_staff or self.request.user.is_superuser

        serializer.save(author=self.request.user, category=category, is_published=is_published)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({'success': True, 'message': 'Post updated', 'status': 200, 'data': serializer.data})

    def perform_update(self, serializer):
        branch_id = self.request.data.get('branch_id')
        if branch_id and not has_model_permission(self.request.user, 'blogposts', 'change', branch_id):
            raise PermissionDenied("No permission to update posts.")
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({'success': True, 'message': 'Post deleted', 'status': 204, 'data': []}, status=204)

    def perform_destroy(self, instance):
        branch_id = self.request.query_params.get('branch_id')
        if branch_id and not has_model_permission(self.request.user, 'blogposts', 'delete', branch_id):
            raise PermissionDenied("No permission to delete posts.")
        instance.delete()

    @action(detail=True, methods=['post'], url_path='grammar-check')
    def grammar_check(self, request, pk=None):
        """AI grammar check for blog post content"""
        from ai_integration.services import get_ai_service
        from ai_integration.models import AIRequest
        instance = self.get_object()
        text = f"{instance.title}\n\n{instance.content}"
        ai_request = AIRequest.objects.create(
            user=request.user, request_type='grammar', input_text=text[:1000], status='processing', error_message=''
        )
        try:
            service = get_ai_service()
            result = service.check_grammar(text)
            ai_request.status = 'completed'
            ai_request.output_text = result.corrected_text
            ai_request.provider = service.__class__.__name__
            ai_request.completed_at = timezone.now()
            ai_request.save()
            return Response({'success': True, 'data': {
                'original_text': result.original_text,
                'corrected_text': result.corrected_text,
                'suggestions': result.suggestions,
                'errors_found': result.errors_found
            }})
        except Exception as e:
            ai_request.status = 'failed'
            ai_request.error_message = str(e)
            ai_request.save()
            return Response({'success': False, 'message': str(e), 'status': 500}, status=500)

    @action(detail=True, methods=['post'], url_path='summarize')
    def summarize(self, request, pk=None):
        """AI generate summary for blog post"""
        from ai_integration.services import get_ai_service
        from ai_integration.models import AIRequest
        instance = self.get_object()
        text = f"{instance.title}\n\n{instance.content}"
        ai_request = AIRequest.objects.create(
            user=request.user, request_type='summarize', input_text=text[:1000], status='processing', error_message=''
        )
        try:
            service = get_ai_service()
            max_length = request.data.get('max_length', 200)
            style = request.data.get('style', 'concise')
            result = service.summarize(text, max_length, style)
            ai_request.status = 'completed'
            ai_request.output_text = result.summary
            ai_request.provider = service.__class__.__name__
            ai_request.completed_at = timezone.now()
            ai_request.save()
            return Response({'success': True, 'data': {
                'summary': result.summary,
                'original_length': result.original_length,
                'summary_length': result.summary_length,
                'key_insights': result.key_insights or []
            }})
        except Exception as e:
            ai_request.status = 'failed'
            ai_request.error_message = str(e)
            ai_request.save()
            return Response({'success': False, 'message': str(e), 'status': 500}, status=500)

    @action(detail=False, methods=['post'], url_path='batch-analyze')
    def batch_analyze(self, request):
        """AI analyze blog posts trends"""
        from ai_integration.utils import batch_ai_analyze
        from ai_integration.models import AIRequest
        queryset = self.get_queryset().filter(status='published')[:20]
        ai_request = AIRequest.objects.create(
            user=request.user, request_type='summarize', input_text='Blog posts analysis', status='processing', error_message=''
        )
        try:
            result = batch_ai_analyze(queryset, 'trends', 'content')
            ai_request.status = 'completed'
            ai_request.output_text = result.summary if result else ''
            ai_request.provider = 'BlogAIBatchAnalyzer'
            ai_request.completed_at = timezone.now()
            ai_request.save()
            return Response({'success': True, 'data': {
                'summary': result.summary if result else 'No analysis',
                'key_insights': result.key_insights if result else [],
                'analyzed_posts': queryset.count()
            }})
        except Exception as e:
            ai_request.status = 'failed'
            ai_request.error_message = str(e)
            ai_request.save()
            return Response({'success': False, 'message': str(e), 'status': 500}, status=500)

class BlogCommentsViewSet(viewsets.ModelViewSet):
    queryset = BlogComments.objects.all()
    serializer_class = BlogCommentsSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        branch_id = self.request.query_params.get('branch_id')

        # Superadmins can see all comments
        if user.is_superuser:
            return self.queryset.all()

        # Filter logic
        from django.db.models import Q
        return self.queryset.filter(
            Q(is_approved=True) | 
            Q(author=user) | 
            Q(post__author=user)
        )

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'message': 'Comments retrieved successfully',
            'status': 200,
            'data': serializer.data
        })

    def create(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            if serializer.is_valid():
                self.perform_create(serializer)
                return Response({
                    'success': True, 
                    'message': 'Comment created successfully. It will be visible after approval.', 
                    'status': 201, 
                    'data': serializer.data
                }, status=201)
            else:
                return Response({
                    'success': False,
                    'message': 'Invalid comment data',
                    'errors': serializer.errors,
                    'status': 400
                }, status=400)
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error creating comment: {str(e)}',
                'status': 500,
                'error': str(e)
            }, status=500)

    def perform_create(self, serializer):
        branch_id = self.request.data.get('branch_id')
        if branch_id and not has_model_permission(self.request.user, 'blogcomments', 'add', branch_id):
            raise PermissionDenied("No permission to create comments.")
        serializer.save(author=self.request.user, is_approved=False)  # Pending approval

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({'success': True, 'message': 'Comment updated', 'status': 200, 'data': serializer.data})

    def perform_update(self, serializer):
        branch_id = self.request.data.get('branch_id')
        if branch_id and not has_model_permission(self.request.user, 'blogcomments', 'change', branch_id):
            raise PermissionDenied("No permission to update comments.")
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({'success': True, 'message': 'Comment deleted', 'status': 204, 'data': []}, status=204)

    def perform_destroy(self, instance):
        branch_id = self.request.query_params.get('branch_id')
        if branch_id and not has_model_permission(self.request.user, 'blogcomments', 'delete', branch_id):
            raise PermissionDenied("No permission to delete comments.")
        instance.delete()
