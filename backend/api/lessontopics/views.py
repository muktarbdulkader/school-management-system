from rest_framework import viewsets, status
from rest_framework.decorators import action
from django.utils import timezone
from django.db import transaction
from django.db.models import Q
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from teachers.models import TeacherAssignment
from schedule.models import Exam
from students.models import ParentStudent, Student
from teachers.models import Teacher
from users.models import UserRole, has_model_permission
from schedule.views import is_teacher
from .serializers import (
    AssignmentsSerializer, ExamResultsSerializer, LearningObjectivesSerializer,
    LessonActivitiesSerializer, LessonPlanEvaluationsSerializer, LessonPlanObjectivesSerializer,
    LessonPlansSerializer, ObjectiveCategoriesSerializer, ObjectiveSubunitsSerializer,
    ObjectiveUnitsSerializer, StudentAssignmentsSerializer,
    ReportCardSerializer, ReportCardSubjectSerializer, CurriculumMappingSerializer,
    ClassUnitProgressSerializer, ClassSubunitProgressSerializer,
    ContinuousAssessmentSerializer, SkillsAssessmentSerializer, TeacherCommentSerializer, StudentRankSerializer
)
from .models import (
    Assignments, ExamResults, LearningObjectives, LessonActivities,
    LessonPlanEvaluations, LessonPlanObjectives, LessonPlans,
    ObjectiveCategories, ObjectiveSubunits, ObjectiveUnits, StudentAssignments,
    ReportCard, ReportCardSubject, CurriculumMapping, ClassUnitProgress, ClassSubunitProgress,
    ContinuousAssessment, SkillsAssessment, TeacherComment, StudentRank
)
import logging
logger = logging.getLogger(__name__)

class ObjectiveCategoriesViewSet(viewsets.ModelViewSet):
    queryset = ObjectiveCategories.objects.all()
    serializer_class = ObjectiveCategoriesSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        import logging
        logger = logging.getLogger(__name__)
        
        user = self.request.user
        branch_id = self.request.query_params.get('branch_id')
        
        logger.info(f"get_queryset - User: {user}, branch_id: {branch_id}")
        
        # Superusers see all
        if user.is_superuser:
            logger.info("User is superuser, returning all categories")
            if branch_id:
                return self.queryset.filter(class_fk__branch_id=branch_id)
            return self.queryset.all()
        
        # For teachers and regular users - return ALL categories
        # Categories are filtered at the API level by subject/class, not here
        all_count = self.queryset.count()
        logger.info(f"Returning ALL {all_count} categories")
        return self.queryset.all()

    def list(self, request, *args, **kwargs):
        """Return categories in the expected format with success flag"""
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'message': 'Categories fetched successfully',
            'status': 200,
            'data': serializer.data
        })

    def create(self, request, *args, **kwargs):
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"Creating category with data: {request.data}")
        logger.info(f"User: {request.user}, is_superuser: {request.user.is_superuser}")
        
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            logger.error(f"Validation errors: {serializer.errors}")
            # Return validation errors properly
            return Response({
                'success': False,
                'message': 'Validation failed',
                'status': 400,
                'data': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            self.perform_create(serializer)
            logger.info(f"Category created successfully: {serializer.data}")
            return Response({
                'success': True,
                'message': 'Category created successfully',
                'status': 201,
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error creating category: {str(e)}")
            return Response({
                'success': False,
                'message': str(e),
                'status': 400,
                'data': {'error': str(e)}
            }, status=status.HTTP_400_BAD_REQUEST)

    def is_administrative_user(self, user):
        """Helper to check if user has admin, super_admin, or staff roles"""
        if user.is_superuser:
            return True
        user_roles = list(user.userrole_set.values_list('role__name', flat=True))
        admin_roles = ['admin', 'super_admin', 'superadmin', 'staff', 'head_admin', 'ceo']
        return any(role.lower() in admin_roles for role in user_roles)

    def perform_create(self, serializer):
        import logging
        logger = logging.getLogger(__name__)
        
        user = self.request.user
        branch_id = self.request.data.get('branch_id')
        subject_id = self.request.data.get('subject_id')
        
        logger.info(f"perform_create - User: {user}, subject_id: {subject_id}, branch_id: {branch_id}")

        # 1. Admin/Staff Access
        if self.is_administrative_user(user):
            logger.info("User is admin/staff, saving category")
            serializer.save(created_by=user)
            return

        # 2. Teacher Access (Subject-based)
        from teachers.models import Teacher, TeacherAssignment
        try:
            teacher = Teacher.objects.get(user=user)
            logger.info(f"Found teacher: {teacher}")
            if subject_id:
                assignments = TeacherAssignment.objects.filter(teacher=teacher, subject_id=subject_id)
                logger.info(f"Teacher assignments for subject {subject_id}: {assignments.count()}")
                if assignments.exists():
                    logger.info("Teacher has assignment for this subject, saving category")
                    serializer.save(created_by=user)
                    return
                else:
                    logger.warning(f"Teacher {teacher} has no assignment for subject {subject_id}")
        except Teacher.DoesNotExist:
            logger.warning(f"No Teacher profile found for user {user}")
            pass

        # 3. Explicit Model Permission Check (Fallback)
        if branch_id and not has_model_permission(user, 'objectivescategories', 'add', branch_id):
            raise PermissionDenied("No permission to create categories.")

        logger.info("Saving category (fallback)")
        serializer.save(created_by=user)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            'success': True,
            'message': 'Category updated successfully',
            'status': 200,
            'data': serializer.data
        })

    def perform_update(self, serializer):
        branch_id = self.request.data.get('branch_id')
        if branch_id and not has_model_permission(self.request.user, 'objectivescategories', 'change', branch_id):
            raise PermissionDenied("No permission to update categories.")
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({
            'success': True,
            'message': 'Category deleted successfully',
            'status': 204,
            'data': []
        }, status=status.HTTP_204_NO_CONTENT)

    def perform_destroy(self, instance):
        branch_id = self.request.query_params.get('branch_id')
        if branch_id and not has_model_permission(self.request.user, 'objectivescategories', 'delete', branch_id):
            raise PermissionDenied("No permission to delete categories.")
        instance.delete()

class ObjectiveUnitsViewSet(viewsets.ModelViewSet):
    queryset = ObjectiveUnits.objects.all()
    serializer_class = ObjectiveUnitsSerializer
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        """Return units in the expected format with success flag"""
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'message': 'Units fetched successfully',
            'status': 200,
            'data': serializer.data
        })

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Validation failed',
                'status': 400,
                'data': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        self.perform_create(serializer)
        return Response({
            'success': True,
            'message': 'Unit created successfully',
            'status': 201,
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)

    def get_queryset(self):
        user = self.request.user
        branch_id = self.request.query_params.get('branch_id')
        subject_id = self.request.query_params.get('subject_id')
        
        queryset = self.queryset
        
        # Filter by subject_id if provided
        if subject_id:
            queryset = queryset.filter(category_id__subject_id=subject_id)
        
        # Superusers see all
        if user.is_superuser:
            if branch_id:
                return queryset.filter(category_id__class_fk__branch_id=branch_id)
            return queryset.all()
        
        # Check if user is a teacher
        from teachers.models import Teacher, TeacherAssignment
        try:
            teacher = Teacher.objects.get(user=user)
            # Teachers can see units for their assigned classes/subjects
            teacher_assignments = TeacherAssignment.objects.filter(teacher=teacher)
            class_ids = teacher_assignments.values_list('class_fk_id', flat=True).distinct()
            subject_ids = teacher_assignments.values_list('subject_id', flat=True).distinct()
            
            return queryset.filter(
                Q(category_id__class_fk_id__in=class_ids) | Q(category_id__subject_id__in=subject_ids) |
                Q(created_by=user) | Q(created_by__isnull=True)
            ).distinct()
        except Teacher.DoesNotExist:
            pass
        
        # Admin/Staff with branch permission
        if branch_id and not has_model_permission(user, 'objectiveunits', 'view', branch_id):
            raise PermissionDenied("No permission to view units.")
        
        # Show both global and user-created units
        return queryset.filter(Q(created_by=user) | Q(created_by__isnull=True))

    @action(detail=False, methods=['get'], url_path='teachers_class_units/(?P<class_id>[^/.]+)/(?P<section_id>[^/.]+)/(?P<subject_id>[^/.]+)')
    def teachers_class_units(self, request, class_id=None, section_id=None, subject_id=None):
        """
        Fetch units for a specific class, section, and subject assigned to a teacher.
        Formats the output as expected by the TeachClassUnits frontend component.
        """
        from academics.models import Class, Section, Subject
        from .models import ClassUnitProgress, ClassSubunitProgress

        try:
            class_obj = Class.objects.get(id=class_id)
            section_obj = Section.objects.get(id=section_id) if section_id and section_id != 'null' else None
            subject_obj = Subject.objects.get(id=subject_id)
        except Exception:
            return Response({'success': False, 'message': 'Invalid IDs', 'status': 400})

        units = ObjectiveUnits.objects.filter(
            category_id__subject_id=subject_id
        ).select_related('category_id')

        # Compute progress and group units
        completed_units = []
        current_units = []
        upcoming_units = []

        for unit in units:
            unit_prog = ClassUnitProgress.objects.filter(
                class_id=class_obj, section_id=section_obj, subject_id=subject_obj, unit_id=unit
            ).first()

            is_completed = unit_prog.is_completed if unit_prog else False
            is_current = unit_prog.is_current if unit_prog else False

            subunits = ObjectiveSubunits.objects.filter(unit_id=unit)

            subunits_data = []
            completed_subs = 0
            for i, sub in enumerate(subunits):
                sub_prog = ClassSubunitProgress.objects.filter(
                    class_id=class_obj, section_id=section_obj, subject_id=subject_obj, subunit_id=sub
                ).first()
                sub_completed = sub_prog.is_completed if sub_prog else False
                if sub_completed: completed_subs += 1

                subunits_data.append({
                    'id': str(sub.id),
                    'name': sub.name,
                    'order': i + 1,
                    'is_completed': sub_completed,
                    'completed_objectives': 0,
                    'total_objectives': 0,
                    'completion_percentage': 100 if sub_completed else 0
                })

            completion_pct = 100 if is_completed else (int(completed_subs / len(subunits_data) * 100) if subunits_data else 0)

            unit_data = {
                'id': str(unit.id),
                'name': unit.name,
                'category': unit.category_id.name,
                'order': 1, # Mock ordering
                'is_completed': is_completed,
                'is_current': is_current,
                'completion_percentage': completion_pct,
                'completed_objectives': 0,
                'total_objectives': 0,
                'subunits': subunits_data
            }

            if is_completed:
                completed_units.append(unit_data)
            elif is_current:
                current_units.append(unit_data)
            else:
                upcoming_units.append(unit_data)

        # Ensure at least one current unit if none exists and there are upcoming
        if not current_units and upcoming_units:
            u = upcoming_units.pop(0)
            u['is_current'] = True
            current_units.append(u)

        response_data = {
            'class': {'id': class_id, 'name': class_obj.grade},
            'section': {'id': section_id, 'name': section_obj.name if section_obj else 'All'} if section_obj else None,
            'subject': {'id': subject_id, 'name': subject_obj.name},
            'summary': {
                'total_units': len(units),
                'completed_units': len(completed_units),
                'current_units': len(current_units),
                'upcoming_units': len(upcoming_units),
                'overall_completion': int((len(completed_units) / len(units) * 100)) if len(units) > 0 else 0
            },
            'units': {
                'completed': completed_units,
                'current': current_units,
                'upcoming': upcoming_units
            }
        }

        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': response_data
        })

    @action(detail=False, methods=['post'], url_path='set_current_unit/(?P<class_id>[^/.]+)/(?P<section_id>[^/.]+)/(?P<unit_id>[^/.]+)')
    def set_current_unit(self, request, class_id=None, section_id=None, unit_id=None):
        from .models import ClassUnitProgress
        # Clear other current units
        ClassUnitProgress.objects.filter(
            class_id=class_id, section_id=section_id if section_id != 'null' else None, subject_id=ObjectiveUnits.objects.get(id=unit_id).category_id.subject_id
        ).update(is_current=False)

        prog, _ = ClassUnitProgress.objects.get_or_create(
            class_id_id=class_id,
            section_id_id=section_id if section_id != 'null' else None,
            subject_id=ObjectiveUnits.objects.get(id=unit_id).category_id.subject_id,
            unit_id_id=unit_id
        )
        prog.is_current = True
        prog.save()
        return Response({'success': True, 'message': 'Status updated'})

    @action(detail=False, methods=['post'], url_path='mark_unit_completed/(?P<class_id>[^/.]+)/(?P<section_id>[^/.]+)/(?P<unit_id>[^/.]+)')
    def mark_unit_completed(self, request, class_id=None, section_id=None, unit_id=None):
        from .models import ClassUnitProgress, ClassSubunitProgress, LessonPlans
        from django.utils import timezone
        
        # Get or create progress record
        prog, created = ClassUnitProgress.objects.get_or_create(
            class_id_id=class_id,
            section_id_id=section_id if section_id != 'null' else None,
            subject_id=ObjectiveUnits.objects.get(id=unit_id).category_id.subject_id,
            unit_id_id=unit_id
        )
        
        # Toggle completion status
        prog.is_completed = not prog.is_completed
        prog.is_current = False if prog.is_completed else prog.is_current
        if prog.is_completed:
            prog.completed_at = timezone.now()
        else:
            prog.completed_at = None
        prog.save()
        
        # Get unit details
        unit = ObjectiveUnits.objects.get(id=unit_id)
        
        # Get subunits and their completion status
        subunits = ObjectiveSubunits.objects.filter(unit=unit)
        subunit_data = []
        completed_subunits = 0
        
        for sub in subunits:
            sub_prog = ClassSubunitProgress.objects.filter(
                class_id_id=class_id,
                section_id_id=section_id if section_id != 'null' else None,
                subunit=sub
            ).first()
            
            is_completed = sub_prog.is_completed if sub_prog else False
            if is_completed:
                completed_subunits += 1
            
            # Get lesson plans for this subunit
            lessons = LessonPlans.objects.filter(
                class_fk_id=class_id,
                subunit=sub
            ).select_related('created_by', 'created_by__teacher', 'created_by__teacher__user')
            
            lesson_data = []
            for lesson in lessons:
                lesson_data.append({
                    'lesson_id': str(lesson.id),
                    'lesson_aims': lesson.lesson_aims,
                    'duration': lesson.duration,
                    'teacher_name': lesson.created_by.teacher.user.full_name if lesson.created_by and lesson.created_by.teacher and lesson.created_by.teacher.user else 'Unknown',
                    'created_at': lesson.created_at.isoformat() if lesson.created_at else None,
                })
            
            subunit_data.append({
                'subunit_id': str(sub.id),
                'subunit_name': sub.name,
                'is_completed': is_completed,
                'completed_at': sub_prog.completed_at.isoformat() if sub_prog and sub_prog.completed_at else None,
                'lessons': lesson_data
            })
        
        # Calculate progress
        total_subunits = len(subunits)
        completion_percentage = int((completed_subunits / total_subunits * 100)) if total_subunits > 0 else (100 if prog.is_completed else 0)
        
        return Response({
            'success': True,
            'message': f"Unit {'completed' if prog.is_completed else 'marked as incomplete'}",
            'unit_progress': {
                'unit_id': str(unit_id),
                'unit_name': unit.name,
                'is_completed': prog.is_completed,
                'completed_at': prog.completed_at.isoformat() if prog.completed_at else None,
                'completed_subunits': completed_subunits,
                'total_subunits': total_subunits,
                'completion_percentage': completion_percentage,
                'subunits': subunit_data
            }
        })

    def is_administrative_user(self, user):
        """Helper to check if user has admin, super_admin, or staff roles"""
        if user.is_superuser:
            return True
        user_roles = list(user.userrole_set.values_list('role__name', flat=True))
        admin_roles = ['admin', 'super_admin', 'superadmin', 'staff', 'head_admin', 'ceo']
        return any(role.lower() in admin_roles for role in user_roles)

    def create(self, request, *args, **kwargs):
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"Creating unit with request data: {request.data}")
        logger.info(f"category_id type: {type(request.data.get('category_id'))}, value: {request.data.get('category_id')}")
        
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            logger.error(f"Unit validation errors: {serializer.errors}")
            return Response({
                'success': False,
                'message': 'Validation failed',
                'status': 400,
                'data': serializer.errors
            }, status=400)
        
        self.perform_create(serializer)
        return Response({'success': True, 'message': 'Unit created', 'status': 201, 'data': serializer.data}, status=201)

    def perform_create(self, serializer):
        user = self.request.user
        branch_id = self.request.data.get('branch_id')

        # 1. Admin/Staff Access
        if self.is_administrative_user(user):
            serializer.save(created_by=user)
            return

        # 2. Teacher Access (Subject-based)
        from teachers.models import Teacher, TeacherAssignment
        try:
            teacher = Teacher.objects.get(user=user)
            category_id = self.request.data.get('category_id')
            if category_id:
                # Get the subject from the category
                category = ObjectiveCategories.objects.filter(id=category_id).first()
                if category and TeacherAssignment.objects.filter(teacher=teacher, subject=category.subject).exists():
                    serializer.save(created_by=user)
                    return
        except Teacher.DoesNotExist:
            pass

        # 3. Explicit Model Permission Check (Fallback)
        if branch_id and not has_model_permission(user, 'objectiveunits', 'add', branch_id):
            raise PermissionDenied("No permission to create units.")

        serializer.save(created_by=user)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({'success': True, 'message': 'Unit updated', 'status': 200, 'data': serializer.data})

    def perform_update(self, serializer):
        branch_id = self.request.data.get('branch_id')
        if branch_id and not has_model_permission(self.request.user, 'objectiveunits', 'change', branch_id):
            raise PermissionDenied("No permission to update units.")
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({'success': True, 'message': 'Unit deleted', 'status': 204, 'data': []}, status=204)

    def perform_destroy(self, instance):
        branch_id = self.request.query_params.get('branch_id')
        if branch_id and not has_model_permission(self.request.user, 'objectiveunits', 'delete', branch_id):
            raise PermissionDenied("No permission to delete units.")
        instance.delete()

class ObjectiveSubunitsViewSet(viewsets.ModelViewSet):
    queryset = ObjectiveSubunits.objects.all()
    serializer_class = ObjectiveSubunitsSerializer
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        """Return subunits in the expected format with success flag"""
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'message': 'Subunits fetched successfully',
            'status': 200,
            'data': serializer.data
        })

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Validation failed',
                'status': 400,
                'data': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        self.perform_create(serializer)
        return Response({
            'success': True,
            'message': 'Sub-unit created successfully',
            'status': 201,
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)

    def get_queryset(self):
        user = self.request.user
        branch_id = self.request.query_params.get('branch_id')
        unit_id = self.request.query_params.get('unit_id')
        
        queryset = self.queryset
        
        # Filter by unit_id if provided
        if unit_id:
            queryset = queryset.filter(unit_id=unit_id)
        
        # Superusers see all
        if user.is_superuser:
            if branch_id:
                return queryset.filter(unit_id__category_id__class_fk__branch_id=branch_id)
            return queryset.all()
        
        # Check if user is a teacher
        from teachers.models import Teacher, TeacherAssignment
        try:
            teacher = Teacher.objects.get(user=user)
            # Teachers can see subunits for their assigned classes/subjects
            teacher_assignments = TeacherAssignment.objects.filter(teacher=teacher)
            class_ids = teacher_assignments.values_list('class_fk_id', flat=True).distinct()
            subject_ids = teacher_assignments.values_list('subject_id', flat=True).distinct()
            
            return queryset.filter(
                Q(unit_id__category_id__class_fk_id__in=class_ids) | Q(unit_id__category_id__subject_id__in=subject_ids) |
                Q(created_by=user) | Q(created_by__isnull=True)
            ).distinct()
        except Teacher.DoesNotExist:
            pass
        
        # Admin/Staff with branch permission
        if branch_id and not has_model_permission(user, 'objectivesubunits', 'view', branch_id):
            raise PermissionDenied("No permission to view subunits.")
        
        # Show both global and user-created subunits
        return queryset.filter(Q(created_by=user) | Q(created_by__isnull=True))

    def is_administrative_user(self, user):
        """Helper to check if user has admin, super_admin, or staff roles"""
        if user.is_superuser:
            return True
        user_roles = list(user.userrole_set.values_list('role__name', flat=True))
        admin_roles = ['admin', 'super_admin', 'superadmin', 'staff', 'head_admin', 'ceo']
        return any(role.lower() in admin_roles for role in user_roles)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({'success': True, 'message': 'SubUnit created', 'status': 201, 'data': serializer.data}, status=201)

    def perform_create(self, serializer):
        user = self.request.user
        branch_id = self.request.data.get('branch_id')

        # 1. Admin/Staff Access
        if self.is_administrative_user(user):
            serializer.save(created_by=user)
            return

        # 2. Teacher Access (Unit-based)
        from teachers.models import Teacher, TeacherAssignment
        try:
            teacher = Teacher.objects.get(user=user)
            unit_id = self.request.data.get('unit_id')
            if unit_id:
                # Get the subject through unit -> category -> subject
                unit = ObjectiveUnits.objects.filter(id=unit_id).select_related('category__subject').first()
                if unit and unit.category and unit.category.subject:
                    if TeacherAssignment.objects.filter(teacher=teacher, subject=unit.category.subject).exists():
                        serializer.save(created_by=user)
                        return
        except Teacher.DoesNotExist:
            pass

        # 3. Explicit Model Permission Check (Fallback)
        if branch_id and not has_model_permission(user, 'objectivesubunits', 'add', branch_id):
            raise PermissionDenied("No permission to create subunits.")

        serializer.save(created_by=user)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({'success': True, 'message': 'SubUnit updated', 'status': 200, 'data': serializer.data})

    def perform_update(self, serializer):
        branch_id = self.request.data.get('branch_id')
        if branch_id and not has_model_permission(self.request.user, 'objectivesubunits', 'change', branch_id):
            raise PermissionDenied("No permission to update subunits.")
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({'success': True, 'message': 'SubUnit deleted', 'status': 204, 'data': []}, status=204)

    def perform_destroy(self, instance):
        branch_id = self.request.query_params.get('branch_id')
        if branch_id and not has_model_permission(self.request.user, 'objectivesubunits', 'delete', branch_id):
            raise PermissionDenied("No permission to delete subunits.")
        instance.delete()

    @action(detail=False, methods=['post'], url_path='mark_subunit_completed/(?P<class_id>[^/.]+)/(?P<section_id>[^/.]+)/(?P<subunit_id>[^/.]+)')
    def mark_subunit_completed(self, request, class_id=None, section_id=None, subunit_id=None):
        from .models import ClassSubunitProgress, LessonPlans
        from django.utils import timezone
        
        subunit = ObjectiveSubunits.objects.get(id=subunit_id)
        
        prog, _ = ClassSubunitProgress.objects.get_or_create(
            class_id_id=class_id,
            section_id_id=section_id if section_id != 'null' else None,
            subject_id=subunit.unit_id.category_id.subject_id,
            subunit_id_id=subunit_id
        )
        prog.is_completed = not prog.is_completed
        if prog.is_completed:
            prog.completed_at = timezone.now()
        else:
            prog.completed_at = None
        prog.save()
        
        # Get lessons for this subunit
        lessons = LessonPlans.objects.filter(
            class_fk_id=class_id,
            subunit=subunit
        ).select_related('created_by', 'created_by__teacher', 'created_by__teacher__user')
        
        lesson_data = []
        for lesson in lessons:
            lesson_data.append({
                'lesson_id': str(lesson.id),
                'lesson_aims': lesson.lesson_aims,
                'duration': lesson.duration,
                'teacher_name': lesson.created_by.teacher.user.full_name if lesson.created_by and lesson.created_by.teacher and lesson.created_by.teacher.user else 'Unknown',
                'created_at': lesson.created_at.isoformat() if lesson.created_at else None,
            })
        
        return Response({
            'success': True,
            'message': f"Subunit {'completed' if prog.is_completed else 'marked as incomplete'}",
            'subunit_progress': {
                'subunit_id': str(subunit_id),
                'subunit_name': subunit.name,
                'is_completed': prog.is_completed,
                'completed_at': prog.completed_at.isoformat() if prog.completed_at else None,
                'lessons_count': len(lesson_data),
                'lessons': lesson_data
            }
        })

class LearningObjectivesViewSet(viewsets.ModelViewSet):
    queryset = LearningObjectives.objects.all()
    serializer_class = LearningObjectivesSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        branch_id = self.request.query_params.get('branch_id')
        if branch_id and not has_model_permission(user, 'learningobjectives', 'view', branch_id):
            raise PermissionDenied("No permission to view learning objectives.")
        return self.queryset.all()

    @action(detail=False, methods=['get'], url_path='teacher_objectives/(?P<class_id>[^/.]+)/(?P<section_id>[^/.]+)')
    def teacher_objectives(self, request, class_id=None, section_id=None):
        """
        Fetch learning objectives for all subjects taught by the teacher in a specific class and section.
        If user is admin, fetch all objectives for the class/section.
        """
        user = request.user
        teacher = Teacher.objects.filter(user=user).first()

        is_admin = user.is_staff or user.is_superuser

        if not teacher and not is_admin:
            return Response({
                'success': False,
                'message': 'Teacher profile not found',
                'status': 404,
                'data': {}
            }, status=404)

        if teacher:
            # Get assigned subjects for this teacher in this class/section
            assigned_csts = TeacherAssignment.objects.filter(
                teacher=teacher,
                class_fk=class_id,
                section=section_id
            )
            subject_ids = assigned_csts.values_list('subject_id', flat=True)

            # Get all objectives for these subjects
            objectives = LearningObjectives.objects.filter(
                unit_id__category_id__subject_id__in=subject_ids
            ).select_related('unit_id', 'unit_id__category_id', 'subunit_id')
        else:
            # Admin sees all objectives for the class/section?
            # Actually, objectives are tied to subjects. 
            # For now, let's return all objectives to avoid empty state for admins testing.
            objectives = LearningObjectives.objects.all().select_related('unit_id', 'unit_id__category_id', 'subunit_id')

        serializer = LearningObjectivesSerializer(objectives, many=True)

        # Wrap each objective in an 'objective' key to match frontend groupObjectives expectation
        wrapped_objectives = [{'objective': obj} for obj in serializer.data]

        # Fetch class and section details for the frontend
        from academics.models import Class, Section
        from schedule.serializers import ClassSerializer, SectionSerializer

        class_obj = Class.objects.filter(id=class_id).first()
        section_obj = Section.objects.filter(id=section_id).first()

        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': {
                'class': ClassSerializer(class_obj).data if class_obj else {'id': class_id, 'grade': 'Class'},
                'section': SectionSerializer(section_obj).data if section_obj else {'id': section_id, 'name': 'All Sections'},
                'objectives': wrapped_objectives
            }
        })

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({'success': True, 'message': 'Learning objective created', 'status': 201, 'data': serializer.data}, status=201)

    def perform_create(self, serializer):
        branch_id = self.request.data.get('branch_id')
        if branch_id and not has_model_permission(self.request.user, 'learningobjectives', 'add', branch_id):
            raise PermissionDenied("No permission to create learning objectives.")
        serializer.save()

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({'success': True, 'message': 'Learning objective updated', 'status': 200, 'data': serializer.data})

    def perform_update(self, serializer):
        branch_id = self.request.data.get('branch_id')
        if branch_id and not has_model_permission(self.request.user, 'learningobjectives', 'change', branch_id):
            raise PermissionDenied("No permission to update learning objectives.")
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({'success': True, 'message': 'Learning objective deleted', 'status': 204, 'data': []}, status=204)

    def perform_destroy(self, instance):
        branch_id = self.request.query_params.get('branch_id')
        if branch_id and not has_model_permission(self.request.user, 'learningobjectives', 'delete', branch_id):
            raise PermissionDenied("No permission to delete learning objectives.")
        instance.delete()

class LessonPlansViewSet(viewsets.ModelViewSet):
    queryset = LessonPlans.objects.all()
    serializer_class = LessonPlansSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        branch_id = self.request.query_params.get('branch_id')

        # Superusers and staff see all
        if user.is_superuser or user.is_staff:
            return self.queryset.all()

        if branch_id and not has_model_permission(user, 'lessonplans', 'view', branch_id):
            raise PermissionDenied("No permission to view lesson plans.")

        # Check if user is a teacher
        if is_teacher(user):
            teacher = Teacher.objects.filter(user=user).first()
            if teacher:
                # Find the subject/class combinations this teacher is assigned to
                teacher_assignments = TeacherAssignment.objects.filter(teacher=teacher)
                teacher_ids = [str(ta.id) for ta in teacher_assignments]
                return self.queryset.filter(created_by_id__in=teacher_ids)

        # Check if user is a parent
        if is_parent(user):
            # Parents see lesson plans for subjects their children are enrolled in
            student_ids = ParentStudent.objects.filter(parent__user=user).values_list('student_id', flat=True)
            students = Student.objects.filter(id__in=student_ids)
            # Find the classes and subjects for these students
            student_classes = students.values_list('grade_id', flat=True)
            return self.queryset.filter(learner_group_id__in=student_classes)

        return self.queryset.none()

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        })

    def create(self, request, *args, **kwargs):
        user = request.user
        branch_id = request.data.get('branch_id')
        if branch_id and not has_model_permission(user, 'lessonplans', 'add', branch_id):
            raise PermissionDenied("No permission to create lesson plans.")

        if not is_teacher(user):
            raise PermissionDenied("Only teachers can create lesson plans.")

        try:
            teacher = Teacher.objects.get(user=user)
        except Teacher.DoesNotExist:
            return Response({'success': False, 'message': 'Teacher profile not found', 'status': 404, 'data': {}}, status=404)

        data = request.data.copy()
        print(f'Received data: {data}')
        subject_id = data.get('subject_id')
        class_id = data.get('learner_group_id') or data.get('class_fk')
        print(f'subject_id: {subject_id}, class_id: {class_id}')

        # Ensure class_fk_id is set (model requires it)
        if class_id and not data.get('class_fk_id'):
            data['class_fk_id'] = class_id

        # Validate teacher is assigned to this subject and class
        # Use filter().first() to handle multiple assignment records gracefully
        teacher_assignment = TeacherAssignment.objects.filter(
            teacher=teacher,
            subject=subject_id,
            class_fk=class_id
        ).first()

        if not teacher_assignment:
            raise PermissionDenied("You are not authorized to create lesson plans for this subject and class.")

        data['created_by_id'] = teacher_assignment.id
        print(f'Final data for serializer: {data}')
        serializer = self.get_serializer(data=data)
        if not serializer.is_valid():
            print(f'Validation errors: {serializer.errors}')
            return Response({
                'success': False,
                'message': 'Validation failed',
                'status': 400,
                'data': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        self.perform_create(serializer)
        return Response({
            'success': True,
            'message': 'Lesson Plan created successfully',
            'status': 201,
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        serializer.save() 

    def update(self, request, *args, **kwargs):
        user = request.user
        branch_id = request.data.get('branch_id')
        if branch_id and not has_model_permission(user, 'lessonplans', 'change', branch_id):
            raise PermissionDenied("No permission to update lesson plans.")

        instance = self.get_object()
        # Allow superusers or the teacher who created it
        if not (user.is_superuser or user.is_staff):
            if not is_teacher(user):
                raise PermissionDenied("Only teachers can update lesson plans.")
            # Check if the current user is the teacher who created this plan
            try:
                teacher = Teacher.objects.get(user=user)
                if instance.created_by.teacher != teacher:
                    raise PermissionDenied("Only the creating teacher can update this lesson plan.")
            except Teacher.DoesNotExist:
                raise PermissionDenied("Teacher profile not found.")

        serializer = self.get_serializer(instance, data=request.data, partial=kwargs.pop('partial', False))
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            'success': True,
            'message': 'Lesson Plan updated successfully',
            'status': 200,
            'data': serializer.data
        })

    def perform_update(self, serializer):
        serializer.save() 

    def destroy(self, request, *args, **kwargs):
        user = request.user
        branch_id = self.request.query_params.get('branch_id')
        if branch_id and not has_model_permission(user, 'lessonplans', 'delete', branch_id):
            raise PermissionDenied("No permission to delete lesson plans.")

        instance = self.get_object()
        if not (user.is_superuser or user.is_staff):
            if not is_teacher(user) or instance.created_by.teacher.user != user:
                raise PermissionDenied("Only the creating teacher can delete this lesson plan.")

        self.perform_destroy(instance)
        return Response({
            'success': True,
            'message': 'Lesson Plan deleted successfully',
            'status': 204,
            'data': []
        }, status=status.HTTP_204_NO_CONTENT)

    def perform_destroy(self, instance):
        instance.delete() 

class LessonActivitiesViewSet(viewsets.ModelViewSet):
    queryset = LessonActivities.objects.all()
    serializer_class = LessonActivitiesSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        branch_id = self.request.query_params.get('branch_id')

        # Superusers and staff see all
        if user.is_superuser or user.is_staff:
            return self.queryset.all()

        if branch_id and not has_model_permission(user, 'lessonactivities', 'view', branch_id):
            raise PermissionDenied("No permission to view lesson activities.")

        # Restrict to activities for lesson plans created by the teacher
        if is_teacher(user):
            from teachers.models import TeacherAssignment
            teacher = Teacher.objects.get(user=user)
            teacher_assignments = TeacherAssignment.objects.filter(teacher=teacher)
            lesson_plans = LessonPlans.objects.filter(created_by__in=teacher_assignments)
            return self.queryset.filter(lesson_plan_id__in=lesson_plans)
        return self.queryset.none()

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        })

    def create(self, request, *args, **kwargs):
        user = request.user
        branch_id = request.data.get('branch_id')
        if branch_id and not has_model_permission(user, 'lessonactivities', 'add', branch_id):
            raise PermissionDenied("No permission to create lesson activities.")

        if not is_teacher(user):
            raise PermissionDenied("Only teachers can create lesson activities.")

        teacher = Teacher.objects.get(user=user)
        data = request.data.copy()
        lesson_plan_id = data.get('lesson_plan_id')
        lesson_plan = LessonPlans.objects.get(id=lesson_plan_id)

        # Validate teacher is the creator of the lesson plan
        if lesson_plan.created_by.teacher.user != user:
            raise PermissionDenied("Only the creating teacher can add activities to this lesson plan.")

        print(f'Creating lesson activity with data: {data}')
        serializer = self.get_serializer(data=data)
        if not serializer.is_valid():
            print(f'Validation errors: {serializer.errors}')
            return Response({
                'success': False,
                'message': 'Validation failed',
                'status': 400,
                'data': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        self.perform_create(serializer)
        return Response({
            'success': True,
            'message': 'Lesson Activity created successfully',
            'status': 201,
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        serializer.save()  

    def update(self, request, *args, **kwargs):
        user = request.user
        branch_id = request.data.get('branch_id')
        if branch_id and not has_model_permission(user, 'lessonactivities', 'change', branch_id):
            raise PermissionDenied("No permission to update lesson activities.")

        instance = self.get_object()
        lesson_plan = instance.lesson_plan_id
        if not is_teacher(user) or lesson_plan.created_by.teacher.user != user:
            raise PermissionDenied("Only the creating teacher can update this lesson activity.")

        serializer = self.get_serializer(instance, data=request.data, partial=kwargs.pop('partial', False))
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            'success': True,
            'message': 'Lesson Activity updated successfully',
            'status': 200,
            'data': serializer.data
        })

    def perform_update(self, serializer):
        serializer.save()  


    def destroy(self, request, *args, **kwargs):
        user = request.user
        branch_id = self.request.query_params.get('branch_id')
        if branch_id and not has_model_permission(user, 'lessonactivities', 'delete', branch_id):
            raise PermissionDenied("No permission to delete lesson activities.")

        instance = self.get_object()
        lesson_plan = instance.lesson_plan_id
        if not is_teacher(user) or lesson_plan.created_by.teacher.user != user:
            raise PermissionDenied("Only the creating teacher can delete this lesson activity.")

        self.perform_destroy(instance)
        return Response({
            'success': True,
            'message': 'Lesson Activity deleted successfully',
            'status': 204,
            'data': []
        }, status=status.HTTP_204_NO_CONTENT)

    def perform_destroy(self, instance):
        instance.delete()
class LessonPlanEvaluationsViewSet(viewsets.ModelViewSet):
    queryset = LessonPlanEvaluations.objects.all()
    serializer_class = LessonPlanEvaluationsSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        branch_id = self.request.query_params.get('branch_id')

        # Superusers and staff see all
        if user.is_superuser or user.is_staff:
            return self.queryset.all()

        if branch_id and not has_model_permission(user, 'lessonplanevaluations', 'view', branch_id):
            raise PermissionDenied("No permission to view lesson plan evaluations.")

        # Restrict to evaluations for lesson plans created by the teacher
        if is_teacher(user):
            from teachers.models import TeacherAssignment
            teacher = Teacher.objects.get(user=user)
            teacher_assignments = TeacherAssignment.objects.filter(teacher=teacher)
            lesson_plans = LessonPlans.objects.filter(created_by__in=teacher_assignments)
            return self.queryset.filter(lesson_plan_id__in=lesson_plans)
        return self.queryset.none()

    def create(self, request, *args, **kwargs):
        user = request.user
        branch_id = request.data.get('branch_id')
        if branch_id and not has_model_permission(user, 'lessonplanevaluations', 'add', branch_id):
            raise PermissionDenied("No permission to create lesson plan evaluations.")

        if not is_teacher(user):
            raise PermissionDenied("Only teachers can create lesson plan evaluations.")

        teacher = Teacher.objects.get(user=user)
        data = request.data.copy()
        lesson_plan_id = data.get('lesson_plan_id')
        lesson_plan = LessonPlans.objects.get(id=lesson_plan_id)

        # Validate teacher is the creator of the lesson plan
        if lesson_plan.created_by.teacher.user != user:
            raise PermissionDenied("Only the creating teacher can add evaluations to this lesson plan.")

        # Map lesson_plan_id to lesson_plan for serializer
        data['lesson_plan'] = lesson_plan_id
        if 'lesson_plan_id' in data:
            del data['lesson_plan_id']

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            'success': True,
            'message': 'Lesson Plan Evaluation created successfully',
            'status': 201,
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        serializer.save() 

    def update(self, request, *args, **kwargs):
        user = request.user
        branch_id = request.data.get('branch_id')
        if branch_id and not has_model_permission(user, 'lessonplanevaluations', 'change', branch_id):
            raise PermissionDenied("No permission to update lesson plan evaluations.")

        instance = self.get_object()
        lesson_plan = instance.lesson_plan_id
        if not is_teacher(user) or lesson_plan.created_by.teacher.user != user:
            raise PermissionDenied("Only the creating teacher can update this lesson plan evaluation.")

        serializer = self.get_serializer(instance, data=request.data, partial=kwargs.pop('partial', False))
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            'success': True,
            'message': 'Lesson Plan Evaluation updated successfully',
            'status': 200,
            'data': serializer.data
        })

    def perform_update(self, serializer):
        serializer.save() 

    def destroy(self, request, *args, **kwargs):
        user = request.user
        branch_id = self.request.query_params.get('branch_id')
        if branch_id and not has_model_permission(user, 'lessonplanevaluations', 'delete', branch_id):
            raise PermissionDenied("No permission to delete lesson plan evaluations.")

        instance = self.get_object()
        lesson_plan = instance.lesson_plan_id
        if not is_teacher(user) or lesson_plan.created_by.teacher.user != user:
            raise PermissionDenied("Only the creating teacher can delete this lesson plan evaluation.")

        self.perform_destroy(instance)
        return Response({
            'success': True,
            'message': 'Lesson Plan Evaluation deleted successfully',
            'status': 204,
            'data': []
        }, status=status.HTTP_204_NO_CONTENT)

    def perform_destroy(self, instance):
        instance.delete()

class LessonPlanObjectivesViewSet(viewsets.ModelViewSet):
    queryset = LessonPlanObjectives.objects.all()
    serializer_class = LessonPlanObjectivesSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        branch_id = self.request.query_params.get('branch_id')
        if branch_id and not has_model_permission(user, 'lessonplanobjectives', 'view', branch_id):
            raise PermissionDenied("No permission to view lesson plan objectives.")

        if is_teacher(user):
            lesson_plans = LessonPlans.objects.filter(created_by__teacher_id__user=user)
            return self.queryset.filter(lesson_plan_id__in=lesson_plans)
        elif is_parent(user):
            student_ids = ParentStudent.objects.filter(parent_id=user).values_list('student_id', flat=True)
            return self.queryset.filter(student_id__in=student_ids)
        else:
            return self.queryset.none()

    def create(self, request, *args, **kwargs):
        user = request.user
        branch_id = request.data.get('branch_id')
        if branch_id and not has_model_permission(user, 'lessonplanobjectives', 'add', branch_id):
            raise PermissionDenied("No permission to create lesson plan objectives.")

        if not is_teacher(user):
            raise PermissionDenied("Only teachers can create lesson plan objectives.")

        lesson_plan_id = request.data.get('lesson_plan_id')
        if not lesson_plan_id or LessonPlans.objects.get(id=lesson_plan_id).created_by.teacher.user != user:
            raise PermissionDenied("Only the creating teacher can add objectives to this lesson plan.")

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            'success': True,
            'message': 'Lesson Plan Objective created successfully',
            'status': 201,
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        serializer.save()

    def update(self, request, *args, **kwargs):
        user = request.user
        branch_id = request.data.get('branch_id')
        if branch_id and not has_model_permission(user, 'lessonplanobjectives', 'change', branch_id):
            raise PermissionDenied("No permission to update lesson plan objectives.")

        instance = self.get_object()
        if not is_teacher(user) or instance.lesson_plan_id.created_by.teacher.user != user:
            raise PermissionDenied("Only the creating teacher can update this lesson objective performance.")

        serializer = self.get_serializer(instance, data=request.data, partial=kwargs.pop('partial', False))
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            'success': True,
            'message': 'Lesson Plan Objective updated successfully',
            'status': 200,
            'data': serializer.data
        })

    def perform_update(self, serializer):
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        user = request.user
        branch_id = self.request.query_params.get('branch_id')
        if branch_id and not has_model_permission(user, 'lessonplanobjectives', 'delete', branch_id):
            raise PermissionDenied("No permission to delete lesson plan objectives.")

        instance = self.get_object()
        if not is_teacher(user) or instance.lesson_plan_id.created_by.teacher.user != user:
            raise PermissionDenied("Only the creating teacher can delete this lesson objective performance.")

        self.perform_destroy(instance)
        return Response({
            'success': True,
            'message': 'Lesson Plan Objective deleted successfully',
            'status': 204,
            'data': []
        }, status=status.HTTP_204_NO_CONTENT)

    def perform_destroy(self, instance):
        instance.delete()

class AssignmentsViewSet(viewsets.ModelViewSet):
    queryset = Assignments.objects.all().select_related(
        'teacher_assignment', 'teacher_assignment__subject', 'teacher_assignment__class_fk', 
        'teacher_assignment__section', 'teacher_assignment__teacher', 'assigned_by', 'term'
    ).prefetch_related('students')
    serializer_class = AssignmentsSerializer
    permission_classes = [IsAuthenticated]

    def is_administrative_user(self, user):
        """Helper to check if user has admin, super_admin, or staff roles"""
        if user.is_superuser:
            return True
        user_roles = list(user.userrole_set.values_list('role__name', flat=True))
        admin_roles = ['admin', 'super_admin', 'superadmin', 'staff', 'head_admin', 'ceo']
        return any(role.lower() in admin_roles for role in user_roles)

    def get_queryset(self):
        user = self.request.user
        branch_id = self.request.query_params.get('branch_id')

        print(f"[Assignments] User: {user.email} (ID: {user.id})")

        # Check if user is a student
        student = Student.objects.filter(user=user).first()
        if student:
            print(f"[Assignments] Found student: {student.user.full_name} (ID: {student.id})")
            print(f"[Assignments] Student Grade: {student.grade} (ID: {student.grade.id if student.grade else None})")
            print(f"[Assignments] Student Section: {student.section} (ID: {student.section.id if student.section else None})")

            # For students, filter their own assignments based on their class and section
            # Include group assignments and individual assignments
            if student and student.grade and student.section:
                # Get assignments for the student's class and section
                queryset = Assignments.objects.filter(
                    Q(class_fk=student.grade, section=student.section) |
                    Q(students=student)
                ).distinct()

                print(f"[Assignments] Query: Assignments.objects.filter(Q(class_fk={student.grade.id if student.grade else None}, section={student.section.id if student.section else None}) | Q(students={student.id}))")
                print(f"[Assignments] Found {queryset.count()} assignments")

                if queryset.count() == 0:
                    # Debug: Show all assignments
                    all_assignments = Assignments.objects.all()
                    print(f"[Assignments] Total assignments in database: {all_assignments.count()}")
                    if all_assignments.count() > 0:
                        print(f"[Assignments] Sample assignments:")
                        for assign in all_assignments[:5]:
                            print(f"  - Title: {assign.title}, Class: {assign.class_fk.grade if assign.class_fk else 'None'} (ID: {assign.class_fk.id if assign.class_fk else 'None'}), "
                                    f"Section: {assign.section.name if assign.section else 'None'} (ID: {assign.section.id if assign.section else 'None'})")
                            # Check if student is in the students ManyToMany field
                            if assign.students.filter(id=student.id).exists():
                                print(f"    -> Student IS in students list!")
                else:
                    for assign in queryset:
                        print(f"  - Assignment: {assign.title}, Due: {assign.due_date}")

                logger.debug(f"Student {user.full_name} (grade={student.grade}, section={student.section}) - Found {queryset.count()} assignments")
                return queryset

            print(f"[Assignments] No student profile found for user")

        # Check if user is a teacher
        if is_teacher(user):
            queryset = self.queryset.filter(assigned_by=user)

            # Apply filters for gradebook view
            class_id = self.request.query_params.get('class_id')
            section_id = self.request.query_params.get('section_id')
            subject_id = self.request.query_params.get('subject_id')

            if class_id:
                queryset = queryset.filter(teacher_assignment__class_fk_id=class_id)
            if section_id:
                queryset = queryset.filter(teacher_assignment__section_id=section_id)
            if subject_id:
                queryset = queryset.filter(teacher_assignment__subject_id=subject_id)

            print(f"[Assignments] Teacher - Found {queryset.count()} assignments (filters: class={class_id}, section={section_id}, subject={subject_id})")
            return queryset

        # Check if user is a parent
        students = Student.objects.filter(parent_links__parent__user=user)
        if students.exists():
            student_ids = students.values_list('id', flat=True)
            section_ids = students.values_list('section', flat=True)
            queryset = self.queryset.filter(
                Q(students__in=student_ids) | Q(teacher_assignment__section__in=section_ids)
            ).distinct()
            print(f"[Assignments] Parent - Found {queryset.count()} assignments")
            return queryset

        # For admin/staff with branch permission
        queryset = self.queryset
        if branch_id:
            if not has_model_permission(user, 'assignments', 'view', branch_id):
                raise PermissionDenied("No permission to view assignments.")
            queryset = queryset.filter(branch_id=branch_id)

        # Administrative users (including superadmins)
        if self.is_administrative_user(user):
            # Apply branch filtering for non-superadmins
            if not user.is_superuser:
                from users.models import UserBranchAccess
                accessible_branches = UserBranchAccess.objects.filter(user=user).values_list('branch_id', flat=True)
                if accessible_branches.exists():
                    # Filter by class_fk__branch_id since Assignment doesn't have branch_id directly
                    queryset = queryset.filter(class_fk__branch_id__in=accessible_branches)
                else:
                    return self.queryset.none()

        print(f"[Assignments] Admin/Staff - Found {queryset.count()} assignments")
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)

        # Add total count to response
        total_count = queryset.count()

        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'count': total_count,
            'data': serializer.data
        })

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        })

    def create(self, request, *args, **kwargs):
        user = request.user

        # Only teachers and administrative users can create assignments
        if not (is_teacher(user) or self.is_administrative_user(user)):
            return Response({
                'success': False,
                'message': 'Only teachers and admins can create assignments.',
                'status': 403,
                'data': {}
            }, status=403)

        # Auto-lookup teacher_assignment_id if not provided
        data = request.data.copy()
        if not data.get('teacher_assignment_id'):
            from teachers.models import Teacher, TeacherAssignment
            try:
                teacher = Teacher.objects.get(user=user)
                subject_id = data.get('subject_id')
                class_id = data.get('class_id')
                section_id = data.get('section')

                # Build query for teacher assignment lookup
                query = {
                    'teacher': teacher,
                    'class_fk': class_id,
                    'subject': subject_id,
                    'is_active': True
                }
                if section_id:
                    query['section'] = section_id

                teacher_assignment = TeacherAssignment.objects.filter(**query).first()
                if not teacher_assignment:
                    return Response({
                        'success': False,
                        'message': 'No teacher assignment found for this class/subject/section combination.',
                        'status': 400,
                        'data': {}
                    }, status=400)

                data['teacher_assignment_id'] = str(teacher_assignment.id)
            except Exception as e:
                print(f"[AssignmentsCreate] Error looking up teacher assignment: {e}")
                return Response({
                    'success': False,
                    'message': 'Could not determine teacher assignment. Please provide teacher_assignment_id.',
                    'status': 400,
                    'data': {}
                }, status=400)

        try:
            serializer = self.get_serializer(data=data)
            if serializer.is_valid():
                instance = serializer.save(assigned_by=user)
                
                # Populate denormalized fields from teacher_assignment
                if instance.teacher_assignment:
                    instance.subject = instance.teacher_assignment.subject
                    instance.class_fk = instance.teacher_assignment.class_fk
                    instance.section = instance.teacher_assignment.section
                    instance.save()
                
                # Automatically add students if class or section is provided
                if instance.teacher_assignment and (instance.teacher_assignment.class_fk or instance.teacher_assignment.section):
                    from students.models import Student
                    student_query = Q()
                    if instance.teacher_assignment.section:
                        student_query = Q(section=instance.teacher_assignment.section)
                    elif instance.teacher_assignment.class_fk:
                        student_query = Q(grade=instance.teacher_assignment.class_fk)
                    
                    students_to_add = Student.objects.filter(student_query)
                    if students_to_add.exists():
                        instance.students.add(*students_to_add)
                
                return Response({
                    'success': True,
                    'message': 'Assignment created successfully',
                    'status': 201,
                    'data': serializer.data
                }, status=status.HTTP_201_CREATED)
            else:
                print(f"[AssignmentsCreate] Validation errors: {serializer.errors}")
                print(f"[AssignmentsCreate] Request data: {request.data}")
                return Response({
                    'success': False,
                    'message': 'Validation failed',
                    'status': 400,
                    'errors': serializer.errors,
                    'data': {}
                }, status=400)
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error creating assignment: {str(e)}',
                'status': 500,
                'error': str(e),
                'data': {}
            }, status=500)

    def perform_create(self, serializer):
        # is_teacher check already done in create(); skip redundant permission check
        serializer.save(assigned_by=self.request.user)

    def update(self, request, *args, **kwargs):
        if not is_teacher(request.user):
            raise PermissionDenied("Only teachers can update assignments.")
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            'success': True,
            'message': 'Assignment updated successfully',
            'status': 200,
            'data': serializer.data
        })

    def perform_update(self, serializer):
        branch_id = self.request.data.get('branch_id')
        if branch_id and not has_model_permission(self.request.user, 'assignments', 'change', branch_id):
            raise PermissionDenied("No permission to update assignments.")
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        if not is_teacher(request.user):
            raise PermissionDenied("Only teachers can delete assignments.")
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({
            'success': True,
            'message': 'Assignment deleted successfully',
            'status': 204,
            'data': []
        }, status=status.HTTP_204_NO_CONTENT)

    def perform_destroy(self, instance):
        branch_id = self.request.query_params.get('branch_id')
        if branch_id and not has_model_permission(self.request.user, 'assignments', 'delete', branch_id):
            raise PermissionDenied("No permission to delete assignments.")
        instance.delete()

class StudentAssignmentsViewSet(viewsets.ModelViewSet):
    queryset = StudentAssignments.objects.all()
    serializer_class = StudentAssignmentsSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        branch_id = self.request.query_params.get('branch_id')
        student_ids_param = self.request.query_params.get('student_ids')
        subject_id = self.request.query_params.get('subject_id')

        if branch_id and not has_model_permission(user, 'studentassignments', 'view', branch_id):
            raise PermissionDenied("No permission to view student assignments.")

        queryset = self.queryset

        # Filter by specific student IDs if provided (for gradebook)
        if student_ids_param:
            student_ids = student_ids_param.split(',')
            queryset = queryset.filter(student_id__in=student_ids)

        # Filter by subject if provided
        if subject_id:
            queryset = queryset.filter(assignment_id__subject_id=subject_id)

        # Apply role-based filtering
        if is_teacher(user):
            # Teachers see assignments they created or for their assigned subjects
            teacher_assignments = TeacherAssignment.objects.filter(teacher__user=user)
            subject_ids = list(teacher_assignments.values_list('subject_id', flat=True))
            queryset = queryset.filter(
                Q(assignment_id__assigned_by=user) |
                Q(assignment_id__subject_id__in=subject_ids)
            ).distinct()
        elif is_student(user):
            # Students can see their own submissions
            student = Student.objects.filter(user=user).first()
            if student:
                queryset = queryset.filter(student_id=student)
            else:
                return self.queryset.none()
        elif is_parent(user):
            # Parents can see their children's submissions
            student_ids = ParentStudent.objects.filter(parent__user=user).values_list('student_id', flat=True)
            queryset = queryset.filter(student_id__id__in=student_ids)
            # Include group assignments where the student is in the group
            group_assignments = Assignments.objects.filter(is_group_assignment=True, students__in=student_ids)
            queryset |= self.queryset.filter(assignment_id__in=group_assignments)
            queryset = queryset.distinct()
        elif not user.is_superuser:
            return self.queryset.none()

        return queryset.select_related('student', 'assignment')

    def create(self, request, *args, **kwargs):
        user = request.user

        # Get student from authenticated user
        student = Student.objects.filter(user=user).first()

        # Allow both students and parents to submit assignments
        if not student and not is_parent(user):
            raise PermissionDenied("Only students or parents can submit assignments.")

        # Prepare data
        data = request.data.copy()

        # If parent, validate they have access to the student
        if is_parent(user):
            student_id = data.get('student_id')
            if not student_id:
                raise PermissionDenied("Parent must specify student_id.")
            if not ParentStudent.objects.filter(parent__user=user, student_id=student_id).exists():
                raise PermissionDenied("You don't have permission to submit for this student.")
        else:
            # If student, use their own ID automatically
            data['student_id'] = str(student.id)

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            'success': True,
            'message': 'Assignment submitted successfully',
            'status': 201,
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        branch_id = self.request.data.get('branch_id')
        if branch_id and not has_model_permission(self.request.user, 'studentassignments', 'add', branch_id):
            raise PermissionDenied("No permission to create student assignments.")

        assignment = serializer.validated_data['assignment']
        student = serializer.validated_data['student']
        submission_url = serializer.validated_data.get('submission_url')

        if assignment.is_group_assignment:
            for group_student in assignment.students.all():
                StudentAssignments.objects.get_or_create(
                    assignment=assignment,
                    student=group_student,
                    defaults={'submission_url': submission_url}
                )
        else:
            serializer.save()

    def update(self, request, *args, **kwargs):
        user = request.user
        if not is_teacher(user):
            raise PermissionDenied("Only teachers can update student assignments.")
        partial = kwargs.pop('partial', True)
        instance = self.get_object()

        data = request.data.copy()
        if 'student' in data:
            del data['student']
        if 'assignment_id' in data:
            del data['assignment_id']
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            'success': True,
            'message': 'Student assignment updated',
            'status': 200,
            'data': serializer.data
        })

    def perform_update(self, serializer):
        branch_id = self.request.data.get('branch_id')
        if branch_id and not has_model_permission(self.request.user, 'studentassignments', 'change', branch_id):
            raise PermissionDenied("No permission to update student assignments.")
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        user = request.user
        if not is_teacher(user):
            raise PermissionDenied("Only teachers can delete student assignments.")
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({
            'success': True,
            'message': 'Student assignment deleted',
            'status': 204,
            'data': []
        }, status=status.HTTP_204_NO_CONTENT)

    def perform_destroy(self, instance):
        branch_id = self.request.query_params.get('branch_id')
        if branch_id and not has_model_permission(self.request.user, 'studentassignments', 'delete', branch_id):
            raise PermissionDenied("No permission to delete student assignments.")
        instance.delete()
class ExamResultsViewSet(viewsets.ModelViewSet):
    queryset = ExamResults.objects.all()
    serializer_class = ExamResultsSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = self.queryset
        user = self.request.user

        # Get query params
        class_id = self.request.query_params.get('class_id')
        section_id = self.request.query_params.get('section_id')
        subject_id = self.request.query_params.get('subject_id')

        print(f"[ExamResults] Filter params: class_id={class_id}, section_id={section_id}, subject_id={subject_id}")

        # Apply filters
        if class_id:
            queryset = queryset.filter(teacher_assignment__class_fk_id=class_id)
        if section_id:
            queryset = queryset.filter(teacher_assignment__section_id=section_id)
        if subject_id:
            queryset = queryset.filter(teacher_assignment__subject_id=subject_id)

        # Teachers only see their own assignment results
        if not user.is_superuser and is_teacher(user):
            teacher = Teacher.objects.filter(user=user).first()
            if teacher:
                queryset = queryset.filter(teacher_assignment__teacher=teacher)

        print(f"[ExamResults] Filtered count: {queryset.count()}")
        return queryset.select_related('student', 'teacher_assignment', 'exam', 'recorded_by')

    def list(self, request, *args, **kwargs):
        user = self.request.user
        branch_id = self.request.query_params.get('branch_id')
        class_id = self.request.query_params.get('class_id')
        section_id = self.request.query_params.get('section_id')
        subject_id = self.request.query_params.get('subject_id')
        
        if branch_id and not has_model_permission(user, 'examresults', 'view', branch_id):
            raise PermissionDenied("No permission to view exam results.")

        # Start with base queryset and select_related for performance
        queryset = self.queryset.select_related('student', 'exam', 'subject', 'recorded_by')

        # Apply filters if provided
        if class_id:
            queryset = queryset.filter(exam__class_fk_id=class_id)
        if section_id:
            queryset = queryset.filter(exam__section_id=section_id)
        if subject_id:
            queryset = queryset.filter(subject_id=subject_id)

        if is_teacher(user):
            teacher = Teacher.objects.filter(user=user).first()
            if not teacher:
                return queryset.none()
            assigned_subjects = TeacherAssignment.objects.filter(teacher=teacher).values_list('subject', flat=True)
            assigned_classes = TeacherAssignment.objects.filter(teacher=teacher).values_list('class_fk', flat=True)
            return queryset.filter(
                subject__in=assigned_subjects,
                exam__class_fk__in=assigned_classes
            )
        elif is_parent(user):
            return queryset.filter(student_id__parent_links__parent__user=user)
        elif is_student(user):
            return queryset.filter(student_id__user=user)
        else:
            return queryset.none()

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        })

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        })

    def is_administrative_user(self, user):
        """Helper to check if user has admin, super_admin, or staff roles"""
        if user.is_superuser:
            return True
        user_roles = list(user.userrole_set.values_list('role__name', flat=True))
        admin_roles = ['admin', 'super_admin', 'superadmin', 'staff', 'head_admin', 'ceo']
        return any(role.lower() in admin_roles for role in user_roles)

    def create(self, request, *args, **kwargs):
        user = request.user
        print(f"[ExamResults] Create request from user: {user.email} (id: {user.id})")
        
        branch_id = request.data.get('branch_id')
        teacher_assignment_id = request.data.get('teacher_assignment_id')
        exam_id = request.data.get('exam_id')
        student_id = request.data.get('student_id')
        
        print(f"[ExamResults] Request data: branch_id={branch_id}, teacher_assignment_id={teacher_assignment_id}, exam_id={exam_id}, student_id={student_id}")

        is_admin = self.is_administrative_user(user)
        is_teacher_user = is_teacher(user)
        print(f"[ExamResults] is_admin={is_admin}, is_teacher={is_teacher_user}")
        
        if not is_admin and not is_teacher_user:
            print(f"[ExamResults] Permission denied: user is neither admin nor teacher")
            raise PermissionDenied("Only teachers and administrators can create exam results.")
        
        # For non-admin users, check model permission only if not a teacher
        # Teachers are authorized by their TeacherAssignment, not by role permission
        if not is_admin and not is_teacher_user:
            if branch_id and not has_model_permission(user, 'examresults', 'add', branch_id):
                print(f"[ExamResults] Permission denied: no model permission for branch {branch_id}")
                raise PermissionDenied("No permission to create exam results.")

        if not is_admin and teacher_assignment_id:
            from schedule.models import Exam
            teacher = Teacher.objects.filter(user=user).first()
            if not teacher:
                print(f"[ExamResults] No teacher profile for user {user.email}")
                raise PermissionDenied("Teacher profile not found.")
            print(f"[ExamResults] Teacher found: {teacher.id} - {teacher.user.full_name}")
            
            # Verify the teacher assignment belongs to this teacher
            assignment = TeacherAssignment.objects.filter(
                id=teacher_assignment_id,
                teacher=teacher
            ).first()
            if not assignment:
                # Debug: check if assignment exists at all
                any_assignment = TeacherAssignment.objects.filter(id=teacher_assignment_id).first()
                if any_assignment:
                    print(f"[ExamResults] Assignment {teacher_assignment_id} exists but belongs to teacher {any_assignment.teacher_id}, not {teacher.id}")
                else:
                    print(f"[ExamResults] Assignment {teacher_assignment_id} not found in database")
                    # List all assignments for this teacher to help debug
                    all_teacher_assignments = TeacherAssignment.objects.filter(teacher=teacher)
                    print(f"[ExamResults] All assignments for teacher {teacher.id}: {list(all_teacher_assignments.values('id', 'subject__name', 'class_fk__grade'))}")
                raise PermissionDenied("You are not authorized to create results for this assignment.")
            print(f"[ExamResults] Assignment verified: {assignment.id} for subject {assignment.subject.name}")

        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            print(f"[ExamResults] Validation error: {serializer.errors}")
            print(f"[ExamResults] Request data: {request.data}")
            raise
        self.perform_create(serializer)
        return Response({
            'success': True,
            'message': 'Exam result created',
            'status': 201,
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        serializer.save(recorded_by=self.request.user)

    def update(self, request, *args, **kwargs):
        user = request.user
        branch_id = request.data.get('branch_id')
        
        is_admin = self.is_administrative_user(user)
        is_teacher_user = is_teacher(user)
        
        # Only check model permission for non-admin non-teacher users
        if not is_admin and not is_teacher_user:
            if branch_id and not has_model_permission(user, 'examresults', 'change', branch_id):
                raise PermissionDenied("No permission to update exam results.")
            raise PermissionDenied("Only teachers and administrators can update exam results.")

        instance = self.get_object()
        
        if not is_admin:
            if not is_teacher_user or not TeacherAssignment.objects.filter(
                teacher=Teacher.objects.get(user=user),
                subject=instance.subject,
                class_fk=instance.exam.class_fk
            ).exists():
                raise PermissionDenied("You do not have permission to update this exam result.")

        serializer = self.get_serializer(instance, data=request.data, partial=kwargs.pop('partial', False))
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            'success': True,
            'message': 'Exam result updated',
            'status': 200,
            'data': serializer.data
        })

    def perform_update(self, serializer):
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        user = request.user

        is_admin = self.is_administrative_user(user)
        
        if not is_admin:
            if not is_teacher(user) or not TeacherAssignment.objects.filter(
                teacher=Teacher.objects.get(user=user),
                subject=instance.teacher_assignment.subject,
                class_fk=instance.exam.class_fk
            ).exists():
                raise PermissionDenied("Only the assigned teacher or administrators can delete this exam result.")

        self.perform_destroy(instance)
        return Response({
            'success': True,
            'message': 'Exam result deleted',
            'status': 204,
            'data': []
        }, status=status.HTTP_204_NO_CONTENT)

    def perform_destroy(self, instance):
        instance.delete()

    @action(detail=False, methods=['post'], url_path='bulk_create')
    def bulk_create(self, request):
        """
        Bulk create/update exam results for multiple students.
        Request body: {
            "exam_id": "<uuid>",
            "teacher_assignment_id": "<uuid>",
            "branch_id": "<uuid>",
            "results": [
                {"student_id": "<uuid>", "score": 85, "max_score": 100, "remarks": ""},
                ...
            ]
        }
        """
        user = request.user
        print(f"[ExamResults Bulk] Request from user: {user.email}")
        
        branch_id = request.data.get('branch_id')
        exam_id = request.data.get('exam_id')
        teacher_assignment_id = request.data.get('teacher_assignment_id')
        results_data = request.data.get('results', [])
        
        print(f"[ExamResults Bulk] Data: exam_id={exam_id}, teacher_assignment_id={teacher_assignment_id}, results_count={len(results_data)}")
        
        is_admin = self.is_administrative_user(user)
        is_teacher_user = is_teacher(user)
        print(f"[ExamResults Bulk] is_admin={is_admin}, is_teacher={is_teacher_user}")
        
        if not is_admin and not is_teacher_user:
            print(f"[ExamResults Bulk] Permission denied: not admin or teacher")
            raise PermissionDenied("Only teachers and administrators can create exam results.")
        
        # For non-admin non-teacher users, check model permission
        # Teachers are authorized by their TeacherAssignment
        if not is_admin and not is_teacher_user:
            if branch_id and not has_model_permission(user, 'examresults', 'add', branch_id):
                print(f"[ExamResults Bulk] Permission denied: branch {branch_id}")
                raise PermissionDenied("No permission to create exam results.")
        
        if not exam_id or not teacher_assignment_id:
            return Response({
                'success': False,
                'message': 'exam_id and teacher_assignment_id are required',
                'status': 400,
                'data': []
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not results_data:
            return Response({
                'success': False,
                'message': 'No results provided',
                'status': 400,
                'data': []
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify teacher assignment for non-admins
        if not is_admin:
            teacher = Teacher.objects.filter(user=user).first()
            if not teacher:
                print(f"[ExamResults Bulk] No teacher profile for {user.email}")
                raise PermissionDenied("Teacher profile not found.")
            print(f"[ExamResults Bulk] Teacher: {teacher.id} - {teacher.user.full_name}")
            
            assignment = TeacherAssignment.objects.filter(
                id=teacher_assignment_id,
                teacher=teacher
            ).first()
            if not assignment:
                any_assignment = TeacherAssignment.objects.filter(id=teacher_assignment_id).first()
                if any_assignment:
                    print(f"[ExamResults Bulk] Assignment {teacher_assignment_id} belongs to different teacher {any_assignment.teacher_id}")
                else:
                    print(f"[ExamResults Bulk] Assignment {teacher_assignment_id} not found")
                    all_assignments = TeacherAssignment.objects.filter(teacher=teacher)
                    print(f"[ExamResults Bulk] Teacher {teacher.id} assignments: {list(all_assignments.values('id', 'subject__name'))}")
                raise PermissionDenied("You are not authorized to create results for this assignment.")
            print(f"[ExamResults Bulk] Assignment verified: {assignment.id}")
        
        created_count = 0
        updated_count = 0
        errors = []
        
        with transaction.atomic():
            for idx, result_item in enumerate(results_data):
                student_id = result_item.get('student_id')
                score = result_item.get('score')
                max_score = result_item.get('max_score', 100)
                remarks = result_item.get('remarks', '')
                
                # Skip if no score provided (empty entry)
                if score is None or score == '':
                    continue
                
                try:
                    score = float(score)
                    max_score = float(max_score)
                except (ValueError, TypeError):
                    errors.append({
                        'index': idx,
                        'student_id': student_id,
                        'error': 'Invalid score or max_score value'
                    })
                    continue
                
                # Validate score range
                if score < 0:
                    errors.append({
                        'index': idx,
                        'student_id': student_id,
                        'error': 'Score cannot be negative'
                    })
                    continue
                
                if score > max_score:
                    errors.append({
                        'index': idx,
                        'student_id': student_id,
                        'error': f'Score ({score}) cannot exceed max score ({max_score})'
                    })
                    continue
                
                # Check if result already exists
                existing = ExamResults.objects.filter(
                    exam_id=exam_id,
                    student_id=student_id,
                    teacher_assignment_id=teacher_assignment_id
                ).first()
                
                if existing:
                    # Update existing
                    existing.score = score
                    existing.max_score = max_score
                    existing.remarks = remarks
                    existing.save()
                    updated_count += 1
                else:
                    # Create new
                    ExamResults.objects.create(
                        exam_id=exam_id,
                        student_id=student_id,
                        teacher_assignment_id=teacher_assignment_id,
                        score=score,
                        max_score=max_score,
                        remarks=remarks,
                        recorded_by=user
                    )
                    created_count += 1
        
        return Response({
            'success': True,
            'message': f'Bulk grades processed: {created_count} created, {updated_count} updated',
            'status': 200,
            'data': {
                'created_count': created_count,
                'updated_count': updated_count,
                'errors': errors
            }
        })

def is_teacher(user):
    """Check if user has teacher role"""
    teacher_roles = UserRole.objects.filter(user=user, role__name__iexact='teacher')
    logger.debug(f"Checking teacher role for user {user.full_name}: {teacher_roles.exists()}")
    return teacher_roles.exists()

def is_parent(user):
    """Check if user has parent role"""
    return UserRole.objects.filter(user=user, role__name__iexact='parent').exists()

def is_student(user):
    """Check if user has student role"""
    return UserRole.objects.filter(user=user, role__name__iexact='student').exists()


class ReportCardViewSet(viewsets.ModelViewSet):
    queryset = ReportCard.objects.all().select_related('student', 'term', 'class_fk', 'section').prefetch_related('subjects')
    serializer_class = ReportCardSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        branch_id = self.request.query_params.get('branch_id')
        term_id = self.request.query_params.get('term_id')
        class_id = self.request.query_params.get('class_id')
        section_id = self.request.query_params.get('section_id')
        student_id = self.request.query_params.get('student_id')
        student_me = self.request.query_params.get('student_me')
        
        if branch_id and not has_model_permission(user, 'reportcard', 'view', branch_id):
            raise PermissionDenied("No permission to view report cards.")

        queryset = self.queryset
        
        # Apply query parameter filters
        if term_id:
            queryset = queryset.filter(term_id=term_id)
        if class_id:
            queryset = queryset.filter(class_fk_id=class_id)
        if section_id:
            queryset = queryset.filter(section_id=section_id)
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        
        # Role-based filtering
        if is_student(user) or student_me:
            student = Student.objects.filter(user=user).first()
            if student:
                queryset = queryset.filter(student=student)
        elif is_parent(user):
            from students.models import Parent, ParentStudent
            parent = Parent.objects.filter(user=user).first()
            if parent:
                student_ids = ParentStudent.objects.filter(parent=parent).values_list('student_id', flat=True)
                queryset = queryset.filter(student_id__in=student_ids)
        elif is_teacher(user):
            teacher = Teacher.objects.filter(user=user).first()
            if teacher:
                # Teachers can see report cards for classes they teach
                class_ids = TeacherAssignment.objects.filter(teacher=teacher).values_list('class_fk_id', flat=True)
                queryset = queryset.filter(class_fk_id__in=class_ids)

        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        })

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        })

    @action(detail=False, methods=['post'], url_path='generate')
    def generate_report_cards(self, request):
        """Trigger report card generation for a term"""
        from django.core.management import call_command
        from io import StringIO
        
        term_id = request.data.get('term_id')
        class_id = request.data.get('class_id')
        section_id = request.data.get('section_id')
        publish = request.data.get('publish', False)
        
        if not term_id:
            return Response({
                'success': False,
                'message': 'term_id is required',
                'status': 400
            }, status=status.HTTP_400_BAD_REQUEST)

        out = StringIO()
        try:
            call_command('generate_report_cards', term_id, 
                        class_id=class_id, 
                        section_id=section_id, 
                        publish=publish,
                        stdout=out)
            return Response({
                'success': True,
                'message': 'Report cards generated successfully',
                'output': out.getvalue(),
                'status': 200
            })
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e),
                'status': 500
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ReportCardSubjectViewSet(viewsets.ModelViewSet):
    queryset = ReportCardSubject.objects.all().select_related('report_card', 'teacher_assignment', 'subject')
    serializer_class = ReportCardSubjectSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['get'], url_path='score_breakdown')
    def score_breakdown(self, request, pk=None):
        """Get detailed score breakdown showing how total was calculated"""
        instance = self.get_object()
        breakdown = instance.get_score_breakdown()
        return Response({
            'success': True,
            'message': 'Score breakdown retrieved',
            'data': breakdown
        })

    @action(detail=True, methods=['post'], url_path='update_weights')
    def update_weights(self, request, pk=None):
        """Update teacher-defined custom weights for this subject"""
        instance = self.get_object()

        # Get weights from request
        exam_weight = request.data.get('exam_weight', 60)
        ca_weight = request.data.get('ca_weight', 20)
        assignment_weight = request.data.get('assignment_weight', 10)
        attendance_weight = request.data.get('attendance_weight', 10)

        # Validate weights (must be positive numbers)
        try:
            instance.exam_weight = float(exam_weight)
            instance.ca_weight = float(ca_weight)
            instance.assignment_weight = float(assignment_weight)
            instance.attendance_weight = float(attendance_weight)
        except (ValueError, TypeError):
            return Response({
                'success': False,
                'message': 'Invalid weight values. Must be positive numbers.',
                'status': 400
            }, status=status.HTTP_400_BAD_REQUEST)

        # Save and recalculate
        instance.save()

        return Response({
            'success': True,
            'message': 'Weights updated successfully',
            'data': {
                'exam_weight': instance.exam_weight,
                'ca_weight': instance.ca_weight,
                'assignment_weight': instance.assignment_weight,
                'attendance_weight': instance.attendance_weight,
                'total_score': instance.total_score,
            }
        })

    def get_queryset(self):
        user = self.request.user
        branch_id = self.request.query_params.get('branch_id')

        if branch_id and not has_model_permission(user, 'reportcardsubject', 'view', branch_id):
            raise PermissionDenied("No permission to view report card subjects.")

        queryset = self.queryset

        # Filter by teacher for teachers
        if is_teacher(user):
            teacher = Teacher.objects.filter(user=user).first()
            if teacher:
                queryset = queryset.filter(teacher_assignment__teacher=teacher)

        return queryset

    @action(detail=True, methods=['post'], url_path='update-grades')
    def update_grades(self, request, pk=None):
        """
        Update individual grade components (exam, assignment, attendance).
        System automatically calculates total.
        Request body: {
            "exam_score": 85,
            "assignment_avg": 78,
            "attendance_score": 90,
            "teacher_comment": "Good progress"
        }
        """
        instance = self.get_object()
        user = request.user

        # Check permission - only admin or assigned teacher
        is_admin = user.is_superuser or UserRole.objects.filter(
            user=user, role__name__in=['admin', 'super_admin', 'head_admin']
        ).exists()

        if not is_admin:
            teacher = Teacher.objects.filter(user=user).first()
            if not teacher or instance.teacher_assignment.teacher != teacher:
                raise PermissionDenied("Only the assigned teacher or admin can update grades.")

        # Update fields if provided
        exam_score = request.data.get('exam_score')
        assignment_avg = request.data.get('assignment_avg')
        attendance_score = request.data.get('attendance_score')
        teacher_comment = request.data.get('teacher_comment')

        if exam_score is not None:
            instance.exam_score = float(exam_score)
        if assignment_avg is not None:
            instance.assignment_avg = float(assignment_avg)
        if attendance_score is not None:
            instance.attendance_score = float(attendance_score)
        if teacher_comment is not None:
            instance.teacher_comment = teacher_comment

        # Save will trigger calculate_total() automatically
        instance.save()

        return Response({
            'success': True,
            'message': 'Grades updated successfully. Total calculated automatically.',
            'status': 200,
            'data': {
                'exam_score': instance.exam_score,
                'assignment_avg': instance.assignment_avg,
                'attendance_score': instance.attendance_score,
                'total_score': instance.total_score,
                'percentage': str(instance.percentage) if instance.percentage else None,
                'descriptive_grade': instance.descriptive_grade,
                'letter_grade': instance.letter_grade,
                'teacher_comment': instance.teacher_comment
            }
        })

    @action(detail=False, methods=['post'], url_path='bulk-update-grades')
    def bulk_update_grades(self, request):
        """
        Bulk update grades for multiple students.
        System automatically calculates total for each.
        Request body: {
            "term_id": "<uuid>",
            "teacher_assignment_id": "<uuid>",
            "grades": [
                {
                    "student_id": "<uuid>",
                    "exam_score": 85,
                    "assignment_avg": 78,
                    "attendance_score": 90
                },
                ...
            ]
        }
        """
        user = request.user
        term_id = request.data.get('term_id')
        teacher_assignment_id = request.data.get('teacher_assignment_id')
        grades_data = request.data.get('grades', [])

        if not term_id or not teacher_assignment_id:
            return Response({
                'success': False,
                'message': 'term_id and teacher_assignment_id are required',
                'status': 400
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check permission
        is_admin = user.is_superuser
        if not is_admin:
            teacher = Teacher.objects.filter(user=user).first()
            if not teacher:
                raise PermissionDenied("Teacher profile not found.")
            assignment = TeacherAssignment.objects.filter(
                id=teacher_assignment_id,
                teacher=teacher
            ).first()
            if not assignment:
                raise PermissionDenied("You are not authorized to update grades for this assignment.")

        from academics.models import Term
        term = Term.objects.filter(id=term_id).first()
        if not term:
            return Response({
                'success': False,
                'message': 'Term not found',
                'status': 404
            }, status=status.HTTP_404_NOT_FOUND)

        teacher_assignment = TeacherAssignment.objects.filter(id=teacher_assignment_id).first()
        if not teacher_assignment:
            return Response({
                'success': False,
                'message': 'Teacher assignment not found',
                'status': 404
            }, status=status.HTTP_404_NOT_FOUND)

        updated_count = 0
        errors = []

        with transaction.atomic():
            for grade_item in grades_data:
                student_id = grade_item.get('student_id')
                if not student_id:
                    continue

                try:
                    student = Student.objects.get(id=student_id)

                    # Get or create report card
                    report_card, _ = ReportCard.objects.get_or_create(
                        student=student,
                        term=term,
                        defaults={
                            'class_fk': student.grade,
                            'section': student.section,
                        }
                    )

                    # Get or create report card subject
                    report_card_subject, _ = ReportCardSubject.objects.get_or_create(
                        report_card=report_card,
                        teacher_assignment=teacher_assignment,
                        defaults={
                            'subject': teacher_assignment.subject,
                        }
                    )

                    # Update grades
                    if 'exam_score' in grade_item:
                        report_card_subject.exam_score = float(grade_item['exam_score'])
                    if 'assignment_avg' in grade_item:
                        report_card_subject.assignment_avg = float(grade_item['assignment_avg'])
                    if 'attendance_score' in grade_item:
                        report_card_subject.attendance_score = float(grade_item['attendance_score'])
                    if 'teacher_comment' in grade_item:
                        report_card_subject.teacher_comment = grade_item['teacher_comment']

                    # Save will trigger calculate_total()
                    report_card_subject.save()
                    updated_count += 1

                except Student.DoesNotExist:
                    errors.append({'student_id': student_id, 'error': 'Student not found'})
                except Exception as e:
                    errors.append({'student_id': student_id, 'error': str(e)})

        return Response({
            'success': True,
            'message': f'Grades updated for {updated_count} students. Totals calculated automatically.',
            'status': 200,
            'data': {
                'updated_count': updated_count,
                'errors': errors
            }
        })


class CurriculumMappingViewSet(viewsets.ModelViewSet):
    queryset = CurriculumMapping.objects.all().select_related('class_fk', 'subject', 'unit', 'term')
    serializer_class = CurriculumMappingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        branch_id = self.request.query_params.get('branch_id')
        class_id = self.request.query_params.get('class_id')
        subject_id = self.request.query_params.get('subject_id')
        term_id = self.request.query_params.get('term_id')
        
        if branch_id and not has_model_permission(user, 'curriculummapping', 'view', branch_id):
            raise PermissionDenied("No permission to view curriculum mappings.")

        queryset = self.queryset
        if class_id:
            queryset = queryset.filter(teacher_assignment__class_fk_id=class_id)
        if subject_id:
            queryset = queryset.filter(subject_id=subject_id)
        if term_id:
            queryset = queryset.filter(term_id=term_id)

        return queryset.order_by('order_index')


class ClassUnitProgressViewSet(viewsets.ModelViewSet):
    queryset = ClassUnitProgress.objects.all().select_related('class_fk', 'section', 'subject', 'unit')
    serializer_class = ClassUnitProgressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        branch_id = self.request.query_params.get('branch_id')
        class_id = self.request.query_params.get('class_id')
        subject_id = self.request.query_params.get('subject_id')
        
        if branch_id and not has_model_permission(user, 'classunitprogress', 'view', branch_id):
            raise PermissionDenied("No permission to view class unit progress.")

        queryset = self.queryset
        if class_id:
            queryset = queryset.filter(teacher_assignment__class_fk_id=class_id)
        if subject_id:
            queryset = queryset.filter(subject_id=subject_id)

        return queryset


class ClassSubunitProgressViewSet(viewsets.ModelViewSet):
    queryset = ClassSubunitProgress.objects.all().select_related('class_fk', 'section', 'subject', 'subunit')
    serializer_class = ClassSubunitProgressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        branch_id = self.request.query_params.get('branch_id')
        class_id = self.request.query_params.get('class_id')
        subject_id = self.request.query_params.get('subject_id')
        
        if branch_id and not has_model_permission(user, 'classsubunitprogress', 'view', branch_id):
            raise PermissionDenied("No permission to view class subunit progress.")

        queryset = self.queryset
        if class_id:
            queryset = queryset.filter(teacher_assignment__class_fk_id=class_id)
        if subject_id:
            queryset = queryset.filter(subject_id=subject_id)

        return queryset
