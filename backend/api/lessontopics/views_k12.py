# ====================  Continuous Assessment ViewSets ====================
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from teachers.models import TeacherAssignment
from .models import ContinuousAssessment, SkillsAssessment, TeacherComment, StudentRank
from .serializers import (
    ContinuousAssessmentSerializer, SkillsAssessmentSerializer,
    TeacherCommentSerializer, StudentRankSerializer
)


class ContinuousAssessmentViewSet(viewsets.ModelViewSet):
    """ViewSet for K-12 Continuous Assessment (quizzes, homework, participation)"""
    queryset = ContinuousAssessment.objects.all()
    serializer_class = ContinuousAssessmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = self.queryset.select_related('student', 'teacher_assignment', 'term')

        # Filter by query params
        student_id = self.request.query_params.get('student_id')
        class_id = self.request.query_params.get('class_id')
        subject_id = self.request.query_params.get('subject_id')
        term_id = self.request.query_params.get('term_id')
        ca_type = self.request.query_params.get('ca_type')

        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if class_id:
            queryset = queryset.filter(teacher_assignment__class_fk_id=class_id)
        if subject_id:
            queryset = queryset.filter(teacher_assignment__subject_id=subject_id)
        if term_id:
            queryset = queryset.filter(term_id=term_id)
        if ca_type:
            queryset = queryset.filter(ca_type=ca_type)

        # Role-based filtering
        if user.is_superuser:
            return queryset
        elif hasattr(user, 'teacher'):
            return queryset.filter(teacher_assignment__teacher=user.teacher)
        elif hasattr(user, 'student'):
            return queryset.filter(student=user.student)
        elif hasattr(user, 'parent'):
            student_ids = user.parent.parentstudent_set.values_list('student_id', flat=True)
            return queryset.filter(student_id__in=student_ids)

        return queryset.none()

    def perform_create(self, serializer):
        serializer.save(recorded_by=self.request.user)


class SkillsAssessmentViewSet(viewsets.ModelViewSet):
    """ViewSet for K-12 Skills Assessment (communication, teamwork, discipline)"""
    queryset = SkillsAssessment.objects.all()
    serializer_class = SkillsAssessmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = self.queryset.select_related('student', 'teacher_assignment', 'term')

        student_id = self.request.query_params.get('student_id')
        class_id = self.request.query_params.get('class_id')
        term_id = self.request.query_params.get('term_id')

        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if class_id:
            queryset = queryset.filter(teacher_assignment__class_fk_id=class_id)
        if term_id:
            queryset = queryset.filter(term_id=term_id)

        # Role-based filtering
        if user.is_superuser:
            return queryset
        elif hasattr(user, 'teacher'):
            return queryset.filter(teacher_assignment__teacher=user.teacher)
        elif hasattr(user, 'student'):
            return queryset.filter(student=user.student)
        elif hasattr(user, 'parent'):
            student_ids = user.parent.parentstudent_set.values_list('student_id', flat=True)
            return queryset.filter(student_id__in=student_ids)

        return queryset.none()

    def perform_create(self, serializer):
        serializer.save(assessed_by=self.request.user)


class TeacherCommentViewSet(viewsets.ModelViewSet):
    """ViewSet for Teacher Comments on student report cards"""
    queryset = TeacherComment.objects.all()
    serializer_class = TeacherCommentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = self.queryset.select_related('student', 'teacher_assignment', 'term')

        student_id = self.request.query_params.get('student_id')
        term_id = self.request.query_params.get('term_id')

        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if term_id:
            queryset = queryset.filter(term_id=term_id)

        # Role-based filtering
        if user.is_superuser:
            return queryset
        elif hasattr(user, 'teacher'):
            return queryset.filter(teacher_assignment__teacher=user.teacher)
        elif hasattr(user, 'student'):
            return queryset.filter(student=user.student)
        elif hasattr(user, 'parent'):
            student_ids = user.parent.parentstudent_set.values_list('student_id', flat=True)
            return queryset.filter(student_id__in=student_ids)

        return queryset.none()

    def perform_create(self, serializer):
        serializer.save(recorded_by=self.request.user)


class StudentRankViewSet(viewsets.ModelViewSet):
    """ViewSet for Student Class Ranking/Position"""
    queryset = StudentRank.objects.all()
    serializer_class = StudentRankSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = self.queryset.select_related('student', 'class_fk', 'section', 'term')

        class_id = self.request.query_params.get('class_id')
        section_id = self.request.query_params.get('section_id')
        term_id = self.request.query_params.get('term_id')
        student_id = self.request.query_params.get('student_id')

        if class_id:
            queryset = queryset.filter(class_fk_id=class_id)
        if section_id:
            queryset = queryset.filter(section_id=section_id)
        if term_id:
            queryset = queryset.filter(term_id=term_id)
        if student_id:
            queryset = queryset.filter(student_id=student_id)

        # Role-based filtering
        if user.is_superuser:
            return queryset
        elif hasattr(user, 'teacher'):
            teacher_classes = TeacherAssignment.objects.filter(teacher=user.teacher).values_list('class_fk_id', flat=True)
            return queryset.filter(class_fk_id__in=teacher_classes)
        elif hasattr(user, 'student'):
            return queryset.filter(student=user.student)
        elif hasattr(user, 'parent'):
            student_ids = user.parent.parentstudent_set.values_list('student_id', flat=True)
            return queryset.filter(student_id__in=student_ids)

        return queryset.none()

    @action(detail=False, methods=['post'])
    def calculate_ranks(self, request):
        """Calculate and update student ranks for a class/section/term"""
        class_id = request.data.get('class_id')
        section_id = request.data.get('section_id')
        term_id = request.data.get('term_id')

        if not all([class_id, term_id]):
            return Response({'error': 'class_id and term_id are required'}, status=400)

        from .management.commands.generate_report_cards import calculate_ranks_for_class
        calculate_ranks_for_class(class_id, section_id, term_id)

        return Response({'message': 'Ranks calculated successfully'})
