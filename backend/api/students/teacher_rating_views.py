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
        """Get ratings for the authenticated teacher using weighted average"""
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
        
        # Calculate weighted average using Bayesian approach
        MIN_RATINGS_FOR_CONFIDENCE = 15
        from teachers.models import Teacher
        
        # Get global average for comparison
        all_teachers_avg = Teacher.objects.aggregate(
            global_avg=Avg('ratings__overall_rating')
        )['global_avg'] or 3.0
        
        avg = stats['avg_overall'] or 0
        n = stats['total_count'] or 0
        
        if n == 0:
            weighted_rating = 0
        else:
            weighted_rating = ((avg * n) + (all_teachers_avg * MIN_RATINGS_FOR_CONFIDENCE)) / (n + MIN_RATINGS_FOR_CONFIDENCE)
        
        serializer = self.get_serializer(ratings, many=True)
        
        return Response({
            'ratings': serializer.data,
            'statistics': {
                'average_overall': round(stats['avg_overall'] or 0, 2),
                'weighted_rating': round(weighted_rating, 2),
                'average_teaching_quality': round(stats['avg_teaching'] or 0, 2),
                'average_communication': round(stats['avg_communication'] or 0, 2),
                'average_subject_knowledge': round(stats['avg_subject'] or 0, 2),
                'total_ratings': stats['total_count'],
            }
        })
    
    @action(detail=False, methods=['get'], url_path='teacher-stats/(?P<teacher_id>[^/.]+)')
    def teacher_stats(self, request, teacher_id=None):
        """Get rating statistics for a specific teacher using weighted average"""
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
                'weighted_rating': 0,
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
        
        # Calculate weighted average using Bayesian approach
        MIN_RATINGS_FOR_CONFIDENCE = 15
        from teachers.models import Teacher
        
        # Get global average for comparison
        all_teachers_avg = Teacher.objects.aggregate(
            global_avg=Avg('ratings__overall_rating')
        )['global_avg'] or 3.0
        
        avg = stats['avg_overall'] or 0
        n = stats['total_count'] or 0
        
        if n == 0:
            weighted_rating = 0
        else:
            weighted_rating = ((avg * n) + (all_teachers_avg * MIN_RATINGS_FOR_CONFIDENCE)) / (n + MIN_RATINGS_FOR_CONFIDENCE)
        
        # Rating breakdown
        rating_breakdown = {}
        for i in range(1, 6):
            rating_breakdown[f'{i}_star'] = ratings.filter(overall_rating__gte=i, overall_rating__lt=i+1).count()
        
        # Recent comments
        recent_comments = ratings.exclude(comment__isnull=True).exclude(comment='').order_by('-created_at')[:5]
        
        return Response({
            'teacher_id': teacher_id,
            'average_rating': round(stats['avg_overall'] or 0, 2),
            'weighted_rating': round(weighted_rating, 2),
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
        """Get ranking of all teachers by their weighted average rating - Admin only
        
        Uses Bayesian average to account for number of ratings, preventing teachers
        with very few ratings from unfairly outranking teachers with many ratings.
        """
        if request.user.role not in ['admin', 'super_admin']:
            return Response(
                {'error': 'Only admins can access teacher rankings'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        from teachers.models import Teacher
        from django.db.models import Avg, Count
        
        # Minimum number of ratings required for a teacher's rating to have full weight
        # Teachers with fewer ratings will be pulled toward the global average
        MIN_RATINGS_FOR_CONFIDENCE = 15
        
        # Get all teachers with their average rating and count
        teachers_with_stats = Teacher.objects.annotate(
            avg_rating=Avg('ratings__overall_rating'),
            total_ratings=Count('ratings')
        )
        
        # Calculate global average rating across all teachers
        global_stats = teachers_with_stats.aggregate(
            global_avg=Avg('avg_rating'),
            total_teachers=Count('id')
        )
        global_average = global_stats['global_avg'] or 3.0  # Default to 3.0 if no ratings
        
        # Calculate weighted average using Bayesian approach
        # weighted_rating = (avg_rating * n + global_avg * m) / (n + m)
        # where n = number of ratings, m = minimum ratings threshold
        teachers_with_weighted = []
        for teacher in teachers_with_stats:
            avg = teacher.avg_rating or 0
            n = teacher.total_ratings or 0
            
            if n == 0:
                weighted_rating = 0
            else:
                weighted_rating = ((avg * n) + (global_average * MIN_RATINGS_FOR_CONFIDENCE)) / (n + MIN_RATINGS_FOR_CONFIDENCE)
            
            teachers_with_weighted.append({
                'teacher': teacher,
                'avg_rating': avg,
                'total_ratings': n,
                'weighted_rating': weighted_rating
            })
        
        # Sort by weighted rating (descending)
        teachers_with_weighted.sort(key=lambda x: x['weighted_rating'], reverse=True)
        
        ranking_data = []
        for rank, data in enumerate(teachers_with_weighted, 1):
            teacher = data['teacher']
            ranking_data.append({
                'rank': rank,
                'teacher_id': str(teacher.id),
                'teacher_name': teacher.user.full_name,
                'subject': teacher.subject.name if teacher.subject else 'N/A',
                'average_rating': round(data['avg_rating'], 2),
                'weighted_rating': round(data['weighted_rating'], 2),
                'total_ratings': data['total_ratings'],
            })
        
        return Response({
            'rankings': ranking_data,
            'total_teachers': len(ranking_data),
            'method': 'weighted_bayesian_average',
            'min_ratings_threshold': MIN_RATINGS_FOR_CONFIDENCE,
            'global_average': round(global_average, 2)
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
