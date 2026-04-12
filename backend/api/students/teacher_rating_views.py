from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Avg, Count
from .models import TeacherRating
from .teacher_rating_serializers import (
    TeacherRatingSerializer, 
    TeacherRatingCreateSerializer,
    TeacherRatingStatsSerializer
)
from .models import Parent, Student

class TeacherRatingViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing teacher ratings by parents
    """
    permission_classes = [permissions.IsAuthenticated]
    queryset = TeacherRating.objects.all()
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return TeacherRatingCreateSerializer
        return TeacherRatingSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        # Parents can see their own ratings
        if hasattr(user, 'parent_profile'):
            return TeacherRating.objects.filter(parent=user.parent_profile)
        
        # Teachers can see ratings for themselves
        if hasattr(user, 'teacher_profile'):
            return TeacherRating.objects.filter(teacher=user.teacher_profile)
        
        # Admins can see all ratings
        if any(r.lower() in ['admin', 'super_admin'] for r in user.roles):
            return TeacherRating.objects.all()
        
        return TeacherRating.objects.none()
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        # Set the parent to the current user's parent profile if they have one
        # Superadmins and staff may not have parent profiles
        try:
            parent = self.request.user.parent_profile
            serializer.save(parent=parent)
        except AttributeError:
            # User doesn't have a parent profile (e.g., superadmin)
            # Don't set parent field - it will be null
            serializer.save(parent=None)
    
    @action(detail=False, methods=['get'], url_path='my-ratings')
    def my_ratings(self, request):
        """Get ratings for the authenticated teacher"""
        if not hasattr(request.user, 'teacher_profile'):
            return Response(
                {'error': 'Only teachers can access this endpoint'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        teacher = request.user.teacher_profile
        ratings = TeacherRating.objects.filter(teacher=teacher)
        
        # Calculate statistics
        stats = ratings.aggregate(
            avg_overall=Avg('overall_rating'),
            avg_teaching=Avg('teaching_quality'),
            avg_communication=Avg('communication'),
            avg_subject=Avg('subject_knowledge'),
            total_count=Count('id')
        )
        
        serializer = self.get_serializer(ratings, many=True)
        
        return Response({
            'ratings': serializer.data,
            'statistics': {
                'average_overall': round(stats['avg_overall'] or 0, 2),
                'average_teaching_quality': round(stats['avg_teaching'] or 0, 2),
                'average_communication': round(stats['avg_communication'] or 0, 2),
                'average_subject_knowledge': round(stats['avg_subject'] or 0, 2),
                'total_ratings': stats['total_count'],
            }
        })
    
    @action(detail=False, methods=['get'], url_path='teacher-stats/(?P<teacher_id>[^/.]+)')
    def teacher_stats(self, request, teacher_id=None):
        """Get rating statistics for a specific teacher"""
        # Only admin and teachers themselves can see this
        if not (request.user.role in ['admin', 'super_admin'] or 
                (hasattr(request.user, 'teacher_profile') and 
                 str(request.user.teacher_profile.id) == teacher_id)):
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        ratings = TeacherRating.objects.filter(teacher_id=teacher_id)
        
        if not ratings.exists():
            return Response({
                'teacher_id': teacher_id,
                'average_rating': 0,
                'total_ratings': 0,
                'message': 'No ratings yet'
            })
        
        stats = ratings.aggregate(
            avg_overall=Avg('overall_rating'),
            avg_teaching=Avg('teaching_quality'),
            avg_communication=Avg('communication'),
            avg_subject=Avg('subject_knowledge'),
            avg_punctuality=Avg('punctuality'),
            avg_behavior=Avg('behavior_management'),
            total_count=Count('id')
        )
        
        # Rating breakdown
        rating_breakdown = {}
        for i in range(1, 6):
            rating_breakdown[f'{i}_star'] = ratings.filter(overall_rating__gte=i, overall_rating__lt=i+1).count()
        
        # Recent comments
        recent_comments = ratings.exclude(comment__isnull=True).exclude(comment='').order_by('-created_at')[:5]
        
        return Response({
            'teacher_id': teacher_id,
            'average_rating': round(stats['avg_overall'] or 0, 2),
            'total_ratings': stats['total_count'],
            'detailed_averages': {
                'teaching_quality': round(stats['avg_teaching'] or 0, 2),
                'communication': round(stats['avg_communication'] or 0, 2),
                'subject_knowledge': round(stats['avg_subject'] or 0, 2),
                'punctuality': round(stats['avg_punctuality'] or 0, 2) if stats['avg_punctuality'] else None,
                'behavior_management': round(stats['avg_behavior'] or 0, 2) if stats['avg_behavior'] else None,
            },
            'rating_breakdown': rating_breakdown,
            'recent_comments': [
                {
                    'parent_name': r.parent.user.full_name,
                    'comment': r.comment,
                    'rating': r.overall_rating,
                    'date': r.created_at.isoformat()
                }
                for r in recent_comments
            ]
        })
    
    @action(detail=False, methods=['get'], url_path='all-teachers-ranking')
    def all_teachers_ranking(self, request):
        """Get ranking of all teachers by their average rating - Admin only"""
        if request.user.role not in ['admin', 'super_admin']:
            return Response(
                {'error': 'Only admins can access teacher rankings'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        from teachers.models import Teacher
        from django.db.models import Avg, Count
        
        teachers = Teacher.objects.annotate(
            avg_rating=Avg('ratings__overall_rating'),
            total_ratings=Count('ratings')
        ).order_by('-avg_rating')
        
        ranking_data = []
        for rank, teacher in enumerate(teachers, 1):
            ranking_data.append({
                'rank': rank,
                'teacher_id': str(teacher.id),
                'teacher_name': teacher.user.full_name,
                'subject': teacher.subject.name if teacher.subject else 'N/A',
                'average_rating': round(teacher.avg_rating or 0, 2),
                'total_ratings': teacher.total_ratings,
            })
        
        return Response({
            'rankings': ranking_data,
            'total_teachers': len(ranking_data)
        })

class TeacherRatingByParentView(viewsets.ViewSet):
    """
    View for parents to rate teachers
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def list(self, request):
        """Get all teachers that can be rated by this parent"""
        if not hasattr(request.user, 'parent_profile'):
            return Response(
                {'error': 'Only parents can rate teachers'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        parent = request.user.parent_profile
        
        # Get all students linked to this parent
        from .models import ParentStudent
        parent_students = ParentStudent.objects.filter(parent=parent).select_related('student')
        
        teachers_data = []
        seen_teachers = set()
        
        for ps in parent_students:
            student = ps.student
            if not student.grade or not student.section:
                continue
            
            # Get teachers for this student's grade/section from schedule
            from schedule.models import Schedule
            schedules = Schedule.objects.filter(
                grade=student.grade,
                section=student.section
            ).select_related('teacher', 'subject')
            
            for schedule in schedules:
                if schedule.teacher and schedule.teacher.id not in seen_teachers:
                    seen_teachers.add(schedule.teacher.id)
                    
                    # Check if parent has already rated this teacher for this student
                    existing_rating = TeacherRating.objects.filter(
                        parent=parent,
                        teacher=schedule.teacher,
                        student=student
                    ).first()
                    
                    teachers_data.append({
                        'teacher_id': str(schedule.teacher.id),
                        'teacher_name': schedule.teacher.user.full_name,
                        'subject': schedule.subject.name if schedule.subject else 'N/A',
                        'student_id': str(student.id),
                        'student_name': student.user.full_name,
                        'already_rated': existing_rating is not None,
                        'existing_rating': TeacherRatingSerializer(existing_rating).data if existing_rating else None
                    })
        
        return Response(teachers_data)
