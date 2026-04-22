from rest_framework import viewsets, status
from django.utils import timezone
from django.db import transaction, IntegrityError
from django.db.models import ProtectedError
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from .models import Class, CourseType, Section, Subject, ClassSubject, ClassElectiveOffering, ClassExtraOffering, Term, GlobalSubject
from .serializers import (
    ClassesSerializer, CourseTypeSerializer, SectionsSerializer, SubjectsSerializer, ClassSubjectSerializer,
    ClassElectiveOfferingsSerializer, ClassExtraOfferingsSerializer,
    StudentElectiveChoicesSerializer, StudentExtraChoicesSerializer, StudentSubjectSerializer,
    TermsSerializer, ClassCreateSerializer, ClassDetailSerializer,
    GlobalSubjectSerializer, ClassSubjectDetailSerializer
)
from teachers.models import TeacherAssignment
from students.models import StudentElectiveChoice, StudentExtraChoice, StudentSubject
from users.models import UserBranchAccess, has_model_permission
from students.models import ParentStudent, Student
from rest_framework.decorators import action
from django.db.models import Q

class CourseTypesViewSet(viewsets.ModelViewSet):
    queryset = CourseType.objects.all()
    serializer_class = CourseTypeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_superuser:
            raise PermissionDenied("Only superusers can view course types.")
        return self.queryset

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

    def create(self, request, *args, **kwargs):
        user = request.user
        if not user.is_superuser:
            raise PermissionDenied("Only superusers can create course types.")

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            'success': True,
            'message': 'Course type created successfully',
            'status': 201,
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        user = request.user
        if not user.is_superuser:
            raise PermissionDenied("Only superusers can update course types.")

        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            'success': True,
            'message': 'Course type updated successfully',
            'status': 200,
            'data': serializer.data
        })

    def destroy(self, request, *args, **kwargs):
        user = request.user
        if not user.is_superuser:
            raise PermissionDenied("Only superusers can delete course types.")

        instance = self.get_object()
        instance.delete()
        return Response({
            'success': True,
            'message': 'Course type deleted successfully',
            'status': 204,
            'data': {}
        }, status=status.HTTP_204_NO_CONTENT)

class TermsViewSet(viewsets.ModelViewSet):
    queryset = Term.objects.all()
    serializer_class = TermsSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        student_id = self.request.query_params.get('student_id')
        branch_id = self.request.query_params.get('branch_id')
        academic_year = self.request.query_params.get('academic_year')

        queryset = self.queryset

        # All authenticated users can read terms
        if student_id and not ParentStudent.objects.filter(parent__user=user, student_id=student_id).exists():
            raise PermissionDenied("You do not have permission to view terms for this student.")

        # Filter by branch access
        if not user.is_superuser:
            from users.models import UserBranchAccess
            accessible_branches = list(UserBranchAccess.objects.filter(user=user).values_list('branch_id', flat=True))
            
            # Also allow teachers to see terms for branches where they have assignments
            from teachers.models import Teacher, TeacherAssignment
            teacher = Teacher.objects.filter(user=user).first()
            if teacher:
                teacher_branch_ids = list(TeacherAssignment.objects.filter(teacher=teacher).values_list('class_fk__branch_id', flat=True).distinct())
                accessible_branches = list(set(accessible_branches + teacher_branch_ids))
            
            if accessible_branches:
                queryset = queryset.filter(branch_id__in=accessible_branches)
            else:
                # If no branch access and not a teacher, return empty
                queryset = queryset.none()

        if branch_id:
            if not user.is_superuser and not UserBranchAccess.objects.filter(user=user, branch_id=branch_id).exists():
                raise PermissionDenied("You do not have access to this branch.")
            queryset = queryset.filter(branch_id=branch_id)
        
        if academic_year:
            queryset = queryset.filter(academic_year=academic_year)

        return queryset.order_by('-academic_year', 'name')

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        # Auto-update status for all terms before serializing
        for term in queryset:
            term.update_status()
            term.save(update_fields=['status', 'is_current'])
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

    def create(self, request, *args, **kwargs):
        user = request.user
        if not user.is_superuser:  # Restrict creation to superusers
            raise PermissionDenied("Only superusers can create terms.")

        from django.utils import timezone

        # Check if there's already a current term that hasn't ended
        today = timezone.now().date()
        existing_current_term = Term.objects.filter(
            status='current',
            end_date__gte=today
        ).first()

        if existing_current_term:
            return Response({
                'success': False,
                'message': 'You can not create more than one term at a time',
                'status': 400,
                'data': {
                    'existing_term': {
                        'id': str(existing_current_term.id),
                        'name': existing_current_term.name,
                        'academic_year': existing_current_term.academic_year,
                        'start_date': existing_current_term.start_date.isoformat(),
                        'end_date': existing_current_term.end_date.isoformat()
                    }
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        # Ensure only one term is is_current
        if serializer.validated_data.get('is_current', False):
            Term.objects.filter(is_current=True).exclude(id=serializer.instance.id).update(is_current=False)

        return Response({
            'success': True,
            'message': 'Term created successfully',
            'status': 201,
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        user = request.user
        if not user.is_superuser:
            raise PermissionDenied("Only superusers can update terms.")

        instance = self.get_object()

        # Check if status is being changed to 'current'
        new_status = request.data.get('status', instance.status)

        if new_status == 'current' and instance.status != 'current':
            from django.utils import timezone

            # Check if there's already a current term that hasn't ended
            today = timezone.now().date()
            existing_current_term = Term.objects.filter(
                status='current',
                end_date__gte=today
            ).exclude(id=instance.id).first()

            if existing_current_term:
                return Response({
                    'success': False,
                    'message': 'You can not create more than one term at a time',
                    'status': 400,
                    'data': {
                        'existing_term': {
                            'id': str(existing_current_term.id),
                            'name': existing_current_term.name,
                            'academic_year': existing_current_term.academic_year,
                            'start_date': existing_current_term.start_date.isoformat(),
                            'end_date': existing_current_term.end_date.isoformat()
                        }
                    }
                }, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        # Ensure only one term is is_current
        if serializer.validated_data.get('is_current', instance.is_current):
            Term.objects.filter(is_current=True).exclude(id=instance.id).update(is_current=False)

        return Response({
            'success': True,
            'message': 'Term updated successfully',
            'status': 200,
            'data': serializer.data
        })

    def destroy(self, request, *args, **kwargs):
        user = request.user
        if not user.is_superuser:
            raise PermissionDenied("Only superusers can delete terms.")

        instance = self.get_object()
        instance.delete()
        return Response({
            'success': True,
            'message': 'Term deleted successfully',
            'status': 204,
            'data': {}
        }, status=status.HTTP_204_NO_CONTENT)

class ClassesViewSet(viewsets.ModelViewSet):
    queryset = Class.objects.all()
    serializer_class = ClassesSerializer
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
        student_id = self.request.query_params.get('student_id')
        branch_id = self.request.query_params.get('branch_id')

        # Students see their own class
        from students.models import Student
        student = Student.objects.filter(user=user).first()
        if student and student.grade:
            return self.queryset.filter(id=student.grade.id)

        if student_id:
            from students.models import ParentStudent
            if not ParentStudent.objects.filter(parent__user=user, student_id=student_id).exists():
                raise PermissionDenied("You do not have permission to view this student's classes.")
            student = Student.objects.get(id=student_id)
            return self.queryset.filter(id=student.grade.id)

        if user.is_superuser:
            if branch_id:
                return self.queryset.filter(branch_id=branch_id)
            return self.queryset.all()

        # Admin role check
        if self.is_administrative_user(user):
            from users.models import UserBranchAccess
            accessible_branches = list(UserBranchAccess.objects.filter(user=user).values_list('branch_id', flat=True))

            queryset = self.queryset

            if branch_id:
                try:
                    import uuid
                    branch_uuid = uuid.UUID(branch_id)
                    # Allow if user has no branch restrictions or has access to this branch
                    if not accessible_branches or branch_uuid in accessible_branches:
                        return queryset.filter(branch_id=branch_id)
                    return queryset.none()
                except (ValueError, TypeError):
                    return queryset.none()
            elif accessible_branches:
                # Only filter by branches if user has specific branch access
                return queryset.filter(branch_id__in=accessible_branches)

            # If no branch restrictions, return all classes
            return queryset

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
        branch_id = request.data.get('branch')
        
        if not branch_id:
             raise PermissionDenied("Branch ID is required.")

        if not has_model_permission(user, 'class', 'add_class', branch_id):
            raise PermissionDenied("You do not have permission to create classes in this branch.")

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            'success': True,
            'message': 'Class created successfully',
            'status': 201,
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        user = request.user
        instance = self.get_object()

        if not has_model_permission(user, 'class', 'change_class', instance.branch_id):
            raise PermissionDenied("You do not have permission to update classes in this branch.")

        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            'success': True,
            'message': 'Class updated successfully',
            'status': 200,
            'data': serializer.data
        })

    def destroy(self, request, *args, **kwargs):
        user = request.user
        instance = self.get_object()

        if not has_model_permission(user, 'class', 'delete_class', instance.branch_id):
            raise PermissionDenied("You do not have permission to delete classes in this branch.")

        try:
            instance.delete()
            return Response({
                'success': True,
                'message': 'Class deleted successfully',
                'status': 200,
                'data': {}
            }, status=status.HTTP_200_OK)
        except ProtectedError as e:
            # Class has related objects (students, subjects, assignments)
            related_objects = []
            for obj in e.protected_objects[:5]:  # Show first 5
                related_objects.append(f"{obj._meta.model_name}: {str(obj)}")
            
            return Response({
                'success': False,
                'message': f'Cannot delete class because it has related objects: {", ".join(related_objects)}. Please remove these first.',
                'status': 400,
                'data': {'related_objects': related_objects}
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error deleting class: {str(e)}',
                'status': 500,
                'data': {'error': str(e)}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], url_path='create-with-sections')
    def create_with_sections(self, request):
        """
        Create a new class/grade with auto-generated sections and assigned courses.
        """
        user = request.user
        
        print(f"[CreateClass] User: {user.email}, Data: {request.data}")
        
        # Only superusers can create classes
        if not user.is_superuser:
            raise PermissionDenied("Only Super Admin can create classes with sections and courses.")
        
        # Validate input
        serializer = ClassCreateSerializer(data=request.data)
        if not serializer.is_valid():
            print(f"[CreateClass] Validation errors: {serializer.errors}")
            return Response({
                'success': False,
                'message': 'Validation failed',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Create class with sections and courses
            result = serializer.save()
            print(f"[CreateClass] Created class: {result}")
        except Exception as e:
            print(f"[CreateClass] Error creating class: {str(e)}")
            import traceback
            print(traceback.format_exc())
            return Response({
                'success': False,
                'message': f'Error creating class: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Format response
        grade = result['grade']
        sections = result['sections']
        course_ids = result['courses']
        print(f"[CreateClass] Grade: {grade.grade}, Sections: {len(sections)}, Courses: {len(course_ids)}")
        
        # Get course names for response
        courses_data = Subject.objects.filter(id__in=course_ids).values('id', 'name')
        courses_list = [{'id': str(c['id']), 'name': c['name']} for c in courses_data]

        # Get section objects with IDs and names
        sections_data = [{
            'id': str(s.id),
            'name': s.name,
            'full_name': f"{grade.grade}{s.name}"
        } for s in sections]

        return Response({
            'success': True,
            'message': 'Class created successfully with sections and courses',
            'data': {
                'id': str(grade.id),
                'grade': int(grade.grade),
                'sections': sections_data,
                'courses': courses_list
            }
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], url_path='details')
    def class_details(self, request, pk=None):
        """
        Get detailed information about a class including sections and courses.
        """
        instance = self.get_object()
        serializer = ClassDetailSerializer(instance)
        return Response({
            'success': True,
            'message': 'Class details retrieved successfully',
            'data': serializer.data
        })

    @action(detail=False, methods=['get'], url_path='check-duplicate')
    def check_duplicate(self, request):
        """
        Check if a class/grade already exists in a branch.
        
        Query params:
        - grade: The grade number to check (e.g., "8", "10")
        - branch_id: The branch ID to check in
        
        Returns:
        {
            "success": true,
            "exists": true/false,
            "message": "Class exists/Does not exist"
        }
        """
        grade = request.query_params.get('grade')
        branch_id = request.query_params.get('branch_id')
        
        if not grade:
            return Response({
                'success': False,
                'message': 'Grade parameter is required',
                'status': 400,
                'exists': None
            }, status=status.HTTP_400_BAD_REQUEST)
        
        query = Class.objects.filter(grade=grade)
        if branch_id:
            query = query.filter(branch_id=branch_id)
        
        exists = query.exists()
        existing_class = query.first()
        
        return Response({
            'success': True,
            'exists': exists,
            'status': 200,
            'message': f"Grade {grade} already exists in this branch" if exists else f"Grade {grade} is available",
            'data': {
                'grade': grade,
                'branch_id': branch_id,
                'exists': exists,
                'existing_class_id': str(existing_class.id) if existing_class else None
            }
        })

    @action(detail=True, methods=['post'], url_path='enroll_all_class_subjects')
    def enroll_all_class_subjects(self, request, pk=None):
        """Enroll all students in a class to all assigned subjects"""
        user = request.user

        try:
             class_obj = Class.objects.get(id=pk)
        except Class.DoesNotExist:
             return Response({
                 'success': False,
                 'message': f'Class with ID {pk} does not exist',
                 'status': 404,
                 'data': {}
             }, status=status.HTTP_404_NOT_FOUND)

        # Standardize on 'studentsubject' without underscore for Django's ContentType
        if not has_model_permission(user, 'studentsubject', 'add_studentsubject', class_obj.branch_id):
            raise PermissionDenied("You do not have permission to enroll class subjects in this branch.")

        # Get all subjects assigned to this class via TeacherAssignment OR ClassSubject
        from .models import ClassSubject

        # First try to get subjects from TeacherAssignment (which includes teacher info)
        teacher_assignment_subject_ids = TeacherAssignment.objects.filter(
            class_fk=class_obj
        ).values_list('subject', flat=True).distinct()

        # Also get subjects from ClassSubject (direct class-subject links)
        # Get subjects from legacy subject field
        class_subject_ids_legacy = ClassSubject.objects.filter(
            class_fk=class_obj,
            subject__isnull=False
        ).values_list('subject', flat=True).distinct()

        # Get subjects linked via global_subject (new way) - follow GlobalSubject -> Subject relationship
        class_subject_ids_via_global = Subject.objects.filter(
            global_subject__class_assignments__class_fk=class_obj,
            global_subject__class_assignments__is_active=True
        ).values_list('id', flat=True).distinct()

        # Combine both sources
        all_subject_ids = set(teacher_assignment_subject_ids) | set(class_subject_ids_legacy) | set(class_subject_ids_via_global)
        assigned_subjects = Subject.objects.filter(id__in=all_subject_ids)

        if not assigned_subjects.exists():
            return Response({
                'success': True,
                'message': f'No subjects are currently assigned to class {class_obj.grade}. Please ensure subjects are created and linked to this class.',
                'status': 200,
                'data': {
                    'warning': True,
                    'students_processed': 0,
                    'new_enrollments': 0,
                    'existing_enrollments': 0,
                    'subjects_processed': 0,
                    'debug_info': {
                        'teacher_assignments_found': len(teacher_assignment_subject_ids),
                        'class_subjects_legacy_found': len(class_subject_ids_legacy),
                        'class_subjects_via_global_found': len(class_subject_ids_via_global),
                        'class_id': str(class_obj.id)
                    }
                }
            }, status=status.HTTP_200_OK)

        students = Student.objects.filter(grade=class_obj)
        if not students.exists():
            return Response({
                'success': True,
                'message': f'No students found in class {class_obj.grade}',
                'status': 200,
                'data': {
                    'warning': True,
                    'students_processed': 0,
                    'new_enrollments': 0,
                    'existing_enrollments': 0,
                    'subjects_processed': assigned_subjects.count()
                }
            }, status=status.HTTP_200_OK)

        # Find first available section for this class if students need assignment
        default_section = Section.objects.filter(class_fk=class_obj).first()

        enrolled_count = 0
        already_enrolled = 0
        section_assigned_count = 0

        with transaction.atomic():
            for student in students:
                # 1. Assign section if missing
                if not student.section and default_section:
                    student.section = default_section
                    student.save()
                    section_assigned_count += 1

                # 2. Enroll in all subjects
                for subject in assigned_subjects:
                    if not StudentSubject.objects.filter(student=student, subject=subject).exists():
                        StudentSubject.objects.create(
                            student=student,
                            subject=subject
                        )
                        enrolled_count += 1
                    else:
                        already_enrolled += 1

        return Response({
            'success': True,
            'message': f'Bulk enrollment completed for {students.count()} students. '
                       f'({enrolled_count} new subjects enrolled, {section_assigned_count} sections assigned).',
            'status': 200,
            'data': {
                'new_enrollments': enrolled_count,
                'existing_enrollments': already_enrolled,
                'sections_assigned': section_assigned_count,
                'students_processed': students.count(),
                'subjects_processed': assigned_subjects.count()
            }
        })

class SectionsViewSet(viewsets.ModelViewSet):
    serializer_class = SectionsSerializer
    permission_classes = [IsAuthenticated]
    # No class-level queryset - using get_queryset() to prevent caching

    def is_administrative_user(self, user):
        """Helper to check if user has admin, super_admin, or staff roles"""
        if user.is_superuser:
            return True
        user_roles = list(user.userrole_set.values_list('role__name', flat=True))
        admin_roles = ['admin', 'super_admin', 'superadmin', 'staff', 'head_admin', 'ceo']
        return any(role.lower() in admin_roles for role in user_roles)

    def get_queryset(self):
        user = self.request.user
        student_id = self.request.query_params.get('student_id')
        branch_id = self.request.query_params.get('branch_id')
        class_id = self.request.query_params.get('class_fk') or self.request.query_params.get('class_id')
        
        print(f"[SectionsViewSet] User: {user.email}, is_superuser: {user.is_superuser}, student_id: {student_id}, branch_id: {branch_id}, class_id: {class_id}")
        
        # Start with fresh queryset including all sections
        base_queryset = Section.objects.all().select_related('class_fk', 'class_fk__branch', 'class_teacher', 'class_teacher__user')
        total_count = Section.objects.count()
        print(f"[SectionsViewSet] Total sections in DB: {total_count}")

        # 1. Students/Parents Context
        from students.models import Student
        student = Student.objects.filter(user=user).first()
        if student and student.section:
            print(f"[SectionsViewSet] Student context - returning section {student.section.id}")
            return base_queryset.filter(id=student.section.id)

        if student_id:
            from students.models import ParentStudent
            if not ParentStudent.objects.filter(parent__user=user, student_id=student_id).exists():
                raise PermissionDenied("You do not have permission to view this student's sections.")
            student = Student.objects.get(id=student_id)
            return base_queryset.filter(id=student.section.id)

        # 2. Administrative Context
        if user.is_superuser:
            queryset = base_queryset
            if class_id: queryset = queryset.filter(class_fk=class_id)
            if branch_id: queryset = queryset.filter(class_fk__branch_id=branch_id)
            count = queryset.count()
            print(f"[SectionsViewSet] Superuser - returning {count} sections")
            return queryset

        if self.is_administrative_user(user):
            from users.models import UserBranchAccess
            accessible_branches = list(UserBranchAccess.objects.filter(user=user).values_list('branch_id', flat=True))
            print(f"[SectionsViewSet] Admin user - accessible_branches: {accessible_branches}")

            queryset = base_queryset

            # If specific branch requested, filter by it if user has access
            if branch_id:
                try:
                    import uuid
                    branch_uuid = uuid.UUID(branch_id)
                    # Allow if user has no branch restrictions or has access to this branch
                    if not accessible_branches or branch_uuid in accessible_branches:
                        queryset = queryset.filter(class_fk__branch_id=branch_id)
                    else:
                        queryset = queryset.none()
                except (ValueError, TypeError):
                    queryset = queryset.none()
            elif accessible_branches:
                # Filter by accessible branches if user has specific branch restrictions
                # Also include sections where class has no branch (null branch)
                queryset = queryset.filter(
                    Q(class_fk__branch_id__in=accessible_branches) | Q(class_fk__branch__isnull=True)
                )
            # If no branch_id specified AND no accessible_branches, admin sees all sections

            if class_id:
                queryset = queryset.filter(class_fk=class_id)
            
            count = queryset.count()
            print(f"[SectionsViewSet] Admin - returning {count} sections")
            return queryset

        # 3. Teacher Context - allow teachers to see sections for their assigned classes
        from teachers.models import Teacher
        teacher = Teacher.objects.filter(user=user).first()
        if teacher:
            # Get sections from teacher's class-subject assignments
            assignments = TeacherAssignment.objects.filter(teacher=teacher)
            section_ids = list(assignments.values_list('section', flat=True).distinct())
            queryset = base_queryset.filter(id__in=section_ids)
            if class_id:
                queryset = queryset.filter(class_fk=class_id)
            count = queryset.count()
            print(f"[SectionsViewSet] Teacher {teacher.id} - section_ids: {section_ids}, returning {count} sections")
            return queryset

        print(f"[SectionsViewSet] No matching context - returning none")
        return base_queryset.none()

    def create(self, request, *args, **kwargs):
        user = request.user
        class_fk = request.data.get('class_fk')
        if not class_fk:
             raise PermissionDenied("Class ID is required.")
        
        try:
             target_class = Class.objects.get(id=class_fk)
        except Class.DoesNotExist:
             raise PermissionDenied("Invalid Class ID.")

        if not has_model_permission(user, 'section', 'add_section', target_class.branch_id):
            raise PermissionDenied("You do not have permission to create sections in this branch.")

        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            return Response({
                'success': True,
                'message': 'Section created successfully',
                'status': 201,
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        except IntegrityError as ie:
            print(f"[SectionCreate] IntegrityError: {str(ie)}")
            return Response({
                'success': False,
                'message': 'Section with this name already exists for this class',
                'errors': {'name': ['A section with this name already exists in this class']}
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"[SectionCreate] Error: {str(e)}")
            return Response({
                'success': False,
                'message': f'Error creating section: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def update(self, request, *args, **kwargs):
        user = request.user
        instance = self.get_object()
        
        print(f"[SectionUpdate] User: {user.email}, Section ID: {instance.id}")
        print(f"[SectionUpdate] Current data - room_number: {instance.room_number}, capacity: {instance.capacity}")
        print(f"[SectionUpdate] Request data: {request.data}")

        if not has_model_permission(user, 'section', 'change_section', instance.class_fk.branch_id):
            raise PermissionDenied("You do not have permission to update sections in this branch.")

        try:
            serializer = self.get_serializer(instance, data=request.data, partial=True)
            if not serializer.is_valid():
                print(f"[SectionUpdate] Validation errors: {serializer.errors}")
                return Response({
                    'success': False,
                    'message': 'Validation failed',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            self.perform_update(serializer)
            print(f"[SectionUpdate] Success - Updated data: {serializer.data}")
            return Response({
                'success': True,
                'message': 'Section updated successfully',
                'status': 200,
                'data': serializer.data
            })
        except IntegrityError as ie:
            print(f"[SectionUpdate] IntegrityError: {str(ie)}")
            return Response({
                'success': False,
                'message': 'Section with this name already exists for this class',
                'errors': {'name': ['A section with this name already exists in this class']}
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"[SectionUpdate] Error: {str(e)}")
            import traceback
            print(traceback.format_exc())
            return Response({
                'success': False,
                'message': f'Error updating section: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def destroy(self, request, *args, **kwargs):
        user = request.user
        instance = self.get_object()

        if not has_model_permission(user, 'section', 'delete_section', instance.class_fk.branch_id):
            raise PermissionDenied("You do not have permission to delete sections in this branch.")

        try:
            instance.delete()
            return Response({
                'success': True,
                'message': 'Section deleted successfully',
                'status': 200,
                'data': {}
            }, status=status.HTTP_200_OK)
        except ProtectedError as e:
            related_objects = []
            for obj in e.protected_objects[:5]:
                related_objects.append(f"{obj._meta.model_name}: {str(obj)}")
            return Response({
                'success': False,
                'message': f'Cannot delete section because it has related objects: {", ".join(related_objects)}',
                'status': 400,
                'data': {'related_objects': related_objects}
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error deleting section: {str(e)}',
                'status': 500,
                'data': {'error': str(e)}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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

class SubjectsViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all().select_related(
        'class_grade', 'section', 'branch', 'course_type'
    )
    serializer_class = SubjectsSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        """Create a new subject with proper error handling"""

        try:
            print(f"[SubjectCreate] User: {request.user}", flush=True)
            print(f"[SubjectCreate] DATA: {request.data}", flush=True)

            is_admin = self.is_administrative_user(request.user)
            print(f"[SubjectCreate] Is admin: {is_admin}", flush=True)

            if not is_admin:
                raise PermissionDenied("Only administrative users can create subjects.")

            # Copy request data for modification
            data = request.data.copy()

            # Handle course_type: convert empty strings or missing to None
            if 'course_type' not in data or data['course_type'] is None or data['course_type'] == '' or data['course_type'] == 'null':
                data['course_type'] = None

            # Handle section: if not provided or empty, set to None (class-wide subject)
            if 'section' not in data or data['section'] == '' or data['section'] == 'null':
                data['section'] = None

            # Handle class_grade validation
            if 'class_grade' not in data or data['class_grade'] == '' or data['class_grade'] == 'null':
                data['class_grade'] = None

            # Handle branch: convert empty strings or missing to None
            if 'branch' not in data or data['branch'] == '' or data['branch'] == 'null':
                data['branch'] = None

            # Handle global_subject: convert empty strings or missing to None
            if 'global_subject' not in data or data['global_subject'] == '' or data['global_subject'] == 'null':
                data['global_subject'] = None

            # Ensure name and code are present
            if 'name' not in data or not data['name']:
                return Response({
                    'success': False,
                    'message': 'Subject name is required',
                    'errors': {'name': ['This field is required.']}
                }, status=status.HTTP_400_BAD_REQUEST)

            if 'code' not in data or not data['code']:
                return Response({
                    'success': False,
                    'message': 'Subject code is required',
                    'errors': {'code': ['This field is required.']}
                }, status=status.HTTP_400_BAD_REQUEST)

            print(f"[SubjectCreate] Processed data: {data}")

            serializer = self.get_serializer(data=data)
            if not serializer.is_valid():
                print(f"[SubjectCreate] Validation errors: {serializer.errors}")
                return Response({
                    'success': False,
                    'message': 'Validation failed',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                self.perform_create(serializer)
                headers = self.get_success_headers(serializer.data)
                return Response({
                    'success': True,
                    'message': 'Subject created successfully',
                    'data': serializer.data
                }, status=status.HTTP_201_CREATED, headers=headers)
            except IntegrityError as ie:
                print(f"[SubjectCreate] IntegrityError: {str(ie)}")
                # Check if it's a unique constraint violation
                error_str = str(ie)
                if 'unique' in error_str.lower() or 'already exists' in error_str.lower():
                    return Response({
                        'success': False,
                        'message': 'Subject with this code already exists for this class/branch',
                        'errors': {'code': ['A subject with this code already exists in this class. Please use a unique code.']}
                    }, status=status.HTTP_400_BAD_REQUEST)
                else:
                    return Response({
                        'success': False,
                        'message': f'Database error: {str(ie)}',
                        'errors': {'database': [str(ie)]}
                    }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            import traceback
            print(f"[SubjectCreate] ERROR: {str(e)}")
            print(traceback.format_exc())
            return Response({
                'success': False,
                'message': f'Error: {str(e)}',
                'status': 500
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
        class_id = self.request.query_params.get('class_fk') or self.request.query_params.get('class_id')
        section_id = self.request.query_params.get('section_id')
        student_id = self.request.query_params.get('student_id')

        # Base queryset with select_related for course_type
        queryset = self.queryset.select_related('course_type', 'branch', 'class_grade', 'section')

        # 1. Access Filtering for Admins - they can see ALL subjects
        if self.is_administrative_user(user):
            if class_id:
                # Get subjects for this class:
                # - Class-wide subjects (section is null)
                # - Section-specific subjects (section is set)
                # If section_id is provided, also include subjects for that specific section
                if section_id:
                    queryset = queryset.filter(
                        class_grade__id=class_id
                    ).filter(
                        Q(section__id=section_id) | Q(section__isnull=True)
                    ).distinct()
                else:
                    # Get all subjects for this class (both class-wide and section-specific)
                    queryset = queryset.filter(class_grade__id=class_id).distinct()
            if branch_id:
                queryset = queryset.filter(branch_id=branch_id).distinct()
            return queryset

        # 2. Teacher Context
        from teachers.models import Teacher
        teacher = Teacher.objects.filter(user=user).first()
        if teacher:
            return queryset.filter(teacherassignment__teacher=teacher).distinct()

        # 3. Student Context
        from students.models import Student
        student = Student.objects.filter(user=user).first()
        if student:
            return queryset.filter(teacherassignment__class_fk=student.grade).distinct()

        # 4. Parent Context
        if student_id:
            from students.models import ParentStudent
            if not ParentStudent.objects.filter(parent__user=user, student_id=student_id).exists():
                raise PermissionDenied("You do not have permission to view subjects for this student.")
            return queryset.filter(teacherassignment__class_fk__student=student_id).distinct()

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

    def update(self, request, *args, **kwargs):
        if not self.is_administrative_user(request.user):
            raise PermissionDenied("Only administrative users can update subjects.")

        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            'success': True,
            'message': 'Subject updated successfully',
            'status': 200,
            'data': serializer.data
        })

    def destroy(self, request, *args, **kwargs):
        if not self.is_administrative_user(request.user):
            raise PermissionDenied("Only administrative users can delete subjects.")

        instance = self.get_object()
        try:
            instance.delete()
            return Response({
                'success': True,
                'message': 'Subject deleted successfully',
                'status': 204,
                'data': {}
            }, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            import traceback
            print(f"[SubjectDelete] Error deleting subject {instance.id}: {str(e)}")
            print(f"[SubjectDelete] Traceback: {traceback.format_exc()}")
            return Response({
                'success': False,
                'message': f'Cannot delete subject: {str(e)}',
                'status': 400,
                'data': {'error': str(e)}
            }, status=status.HTTP_400_BAD_REQUEST)

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
        if not self.is_administrative_user(user):
            raise PermissionDenied("Only administrative users can create class subject teacher assignments.")

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            'success': True,
            'message': 'Class subject teacher created successfully',
            'status': 201,
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        user = request.user
        if not self.is_administrative_user(user):
            raise PermissionDenied("Only administrative users can update class subject teacher assignments.")

        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            'success': True,
            'message': 'Class subject teacher updated successfully',
            'status': 200,
            'data': serializer.data
        })

    def destroy(self, request, *args, **kwargs):
        user = request.user
        if not user.is_superuser:
            raise PermissionDenied("Only superusers can delete class subject teacher assignments.")

        instance = self.get_object()
        instance.delete()
        return Response({
            'success': True,
            'message': 'Class subject teacher deleted successfully',
            'status': 204,
            'data': {}
        }, status=status.HTTP_204_NO_CONTENT)


    @action(detail=False, methods=['post'], url_path='enroll_student_all_subjects/(?P<class_id>[^/.]+)')
    def enroll_student_all_subjects(self, request, class_id=None):
        """Enroll a single student in all subjects for a class"""
        user = request.user
        student_id = request.data.get('student_id')
        
        if not student_id:
            return Response({
                'success': False,
                'message': 'Student ID is required',
                'status': 400,
                'data': {}
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            class_obj = Class.objects.get(id=class_id)
        except Class.DoesNotExist:
            return Response({
                'success': False,
                'message': f'Class with ID {class_id} does not exist',
                'status': 404,
                'data': {}
            }, status=status.HTTP_404_NOT_FOUND)

        try:
            student = Student.objects.get(id=student_id)
        except Student.DoesNotExist:
            return Response({
                'success': False,
                'message': f'Student with ID {student_id} does not exist',
                'status': 404,
                'data': {}
            }, status=status.HTTP_404_NOT_FOUND)

        # Check permission
        if not has_model_permission(user, 'studentsubject', 'add_studentsubject', class_obj.branch_id):
            raise PermissionDenied("You do not have permission to enroll subjects in this branch.")

        # Get all subjects assigned to this class via TeacherAssignment or ClassSubject
        from teachers.models import TeacherAssignment
        assigned_subjects_ids = TeacherAssignment.objects.filter(
            class_fk=class_obj
        ).values_list('subject', flat=True).distinct()
        
        # Also include subjects linked via ClassSubject
        # Get subjects from legacy subject field
        class_subject_ids_legacy = ClassSubject.objects.filter(
            class_fk=class_obj,
            subject__isnull=False
        ).values_list('subject', flat=True).distinct()

        # Get subjects linked via global_subject (new way) - follow GlobalSubject -> Subject relationship
        class_subject_ids_via_global = Subject.objects.filter(
            global_subject__class_assignments__class_fk=class_obj,
            global_subject__class_assignments__is_active=True
        ).values_list('id', flat=True).distinct()

        # Combine both sources
        all_subject_ids = list(set(list(assigned_subjects_ids) + list(class_subject_ids_legacy) + list(class_subject_ids_via_global)))
        assigned_subjects = Subject.objects.filter(id__in=all_subject_ids)
        
        if not assigned_subjects.exists():
            return Response({
                'success': False,
                'message': f'No subjects are currently assigned to class {class_obj.grade}',
                'status': 400,
                'data': {}
            }, status=status.HTTP_400_BAD_REQUEST)

        # Assign section if missing
        section_assigned = False
        if not student.section:
            default_section = Section.objects.filter(class_fk=class_obj).first()
            if default_section:
                student.section = default_section
                student.save()
                section_assigned = True

        # Enroll in all subjects
        enrolled_count = 0
        already_enrolled = 0
        
        with transaction.atomic():
            for subject in assigned_subjects:
                if not StudentSubject.objects.filter(student=student, subject=subject).exists():
                    StudentSubject.objects.create(
                        student=student,
                        subject=subject
                    )
                    enrolled_count += 1
                else:
                    already_enrolled += 1

        return Response({
            'success': True,
            'message': f'Enrolled {student.user.get_full_name()} in {enrolled_count} subjects. '
                       f'{already_enrolled} already enrolled.',
            'status': 200,
            'data': {
                'student_id': str(student.id),
                'student_name': student.user.get_full_name(),
                'new_enrollments': enrolled_count,
                'existing_enrollments': already_enrolled,
                'section_assigned': section_assigned,
                'subjects_processed': assigned_subjects.count()
            }
        })

    @action(detail=False, methods=['post'], url_path='enroll_core_subjects/(?P<class_id>[^/.]+)')
    def enroll_core_subjects(self, request, class_fk=None):
        user = request.user
        if not self.is_administrative_user(user):
            raise PermissionDenied("Only administrative users can enroll core subjects.")

        try:
            class_obj = Class.objects.get(id=class_fk)
        except Class.DoesNotExist:
            return Response({
                'success': False,
                'message': f'Class with ID {class_fk} does not exist',
                'status': 404,
                'data': {}
            }, status=status.HTTP_404_NOT_FOUND)

        core_subjects = Subject.objects.filter(course_type__name__iexact='Core')
        if not core_subjects.exists():
            return Response({
                'success': False,
                'message': 'No core subjects found',
                'status': 400,
                'data': {}
            }, status=status.HTTP_400_BAD_REQUEST)

        students = Student.objects.filter(grade=class_obj)
        if not students.exists():
            return Response({
                'success': False,
                'message': f'No students found in class {class_obj.grade}',
                'status': 400,
                'data': {}
            }, status=status.HTTP_400_BAD_REQUEST)

        enrolled_count = 0
        with transaction.atomic():
            for student in students:
                for subject in core_subjects:
                    obj, created = StudentSubject.objects.update_or_create(
                        student=student,
                        subject=subject
                    )
                    if created:
                        enrolled_count += 1

        return Response({
            'success': True,
            'message': f'Successfully enrolled core student-subject pairs for class {class_obj.grade}',
            'status': 200,
            'data': {}
        })

class ClassElectiveOfferingsViewSet(viewsets.ModelViewSet):
    queryset = ClassElectiveOffering.objects.all()
    serializer_class = ClassElectiveOfferingsSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        student_id = self.request.query_params.get('student_id')
        branch_id = self.request.query_params.get('branch_id')

        if student_id:
            if not ParentStudent.objects.filter(parent__user=user, student_id=student_id).exists():
                raise PermissionDenied("You do not have permission to view this student's elective offerings.")
            student = Student.objects.get(id=student_id)
            return self.queryset.filter(class_fk=student.grade)

        if branch_id:
            if not UserBranchAccess.objects.filter(user=user, branch_id=branch_id).exists():
                raise PermissionDenied("You do not have access to this branch.")
            return self.queryset.filter(class_fk__branch_id=branch_id)

        # Return all for superusers, or filter by accessible branches for regular users
        if user.is_superuser:
            return self.queryset.all()
        accessible_branches = UserBranchAccess.objects.filter(user=user).values_list('branch_id', flat=True)
        if not accessible_branches:
            raise PermissionDenied("You do not have access to any branches.")
        return self.queryset.filter(class_fk__branch_id__in=accessible_branches)

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

    def create(self, request, *args, **kwargs):
        user = request.user
        if not user.is_superuser:
            raise PermissionDenied("Only superusers can create elective offerings.")

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            'success': True,
            'message': 'Elective offering created successfully',
            'status': 201,
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        user = request.user
        if not user.is_superuser:
            raise PermissionDenied("Only superusers can update elective offerings.")

        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            'success': True,
            'message': 'Elective offering updated successfully',
            'status': 200,
            'data': serializer.data
        })

    def destroy(self, request, *args, **kwargs):
        user = request.user
        if not user.is_superuser:
            raise PermissionDenied("Only superusers can delete elective offerings.")

        instance = self.get_object()
        instance.delete()
        return Response({
            'success': True,
            'message': 'Elective offering deleted successfully',
            'status': 204,
            'data': {}
        }, status=status.HTTP_204_NO_CONTENT)

class ClassExtraOfferingsViewSet(viewsets.ModelViewSet):
    queryset = ClassExtraOffering.objects.all()
    serializer_class = ClassExtraOfferingsSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        student_id = self.request.query_params.get('student_id')
        branch_id = self.request.query_params.get('branch_id')

        if student_id:
            if not ParentStudent.objects.filter(parent__user=user, student_id=student_id).exists():
                raise PermissionDenied("You do not have permission to view this student's extra offerings.")
            student = Student.objects.get(id=student_id)
            return self.queryset.filter(class_fk=student.grade)

        if branch_id:
            if not UserBranchAccess.objects.filter(user=user, branch_id=branch_id).exists():
                raise PermissionDenied("You do not have access to this branch.")
            return self.queryset.filter(class_fk__branch_id=branch_id)

        # Return all for superusers, or filter by accessible branches for regular users
        if user.is_superuser:
            return self.queryset.all()
        accessible_branches = UserBranchAccess.objects.filter(user=user).values_list('branch_id', flat=True)
        if not accessible_branches:
            raise PermissionDenied("You do not have access to any branches.")
        return self.queryset.filter(class_fk__branch_id__in=accessible_branches)

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

    def create(self, request, *args, **kwargs):
        user = request.user
        if not user.is_superuser:
            raise PermissionDenied("Only superusers can create extra offerings.")

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            'success': True,
            'message': 'Extra offering created successfully',
            'status': 201,
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        user = request.user
        if not user.is_superuser:
            raise PermissionDenied("Only superusers can update extra offerings.")

        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            'success': True,
            'message': 'Extra offering updated successfully',
            'status': 200,
            'data': serializer.data
        })

    def destroy(self, request, *args, **kwargs):
        user = request.user
        if not user.is_superuser:
            raise PermissionDenied("Only superusers can delete extra offerings.")

        instance = self.get_object()
        instance.delete()
        return Response({
            'success': True,
            'message': 'Extra offering deleted successfully',
            'status': 204,
            'data': {}
        }, status=status.HTTP_204_NO_CONTENT)

class StudentElectiveChoicesViewSet(viewsets.ModelViewSet):
    queryset = StudentElectiveChoice.objects.all()
    serializer_class = StudentElectiveChoicesSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        student_id = self.request.query_params.get('student_id')

        if not user.is_superuser and student_id and not ParentStudent.objects.filter(parent__user=user, student_id=student_id).exists():
            raise PermissionDenied("You do not have permission to view this student's elective choices.")

        if user.is_superuser:
            return self.queryset.all()
        return self.queryset.filter(student_id=student_id) if student_id else self.queryset.none()

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
        user = self.request.user
        instance = self.get_object()
        if not user.is_superuser and not ParentStudent.objects.filter(parent__user=user, student_id=instance.student_id).exists():
            raise PermissionDenied("You do not have permission to view this student's elective choices.")
        serializer = self.get_serializer(instance)
        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        })

    def create(self, request, *args, **kwargs):
        user = request.user
        student_id = request.data.get('student_id')
        if not user.is_superuser and student_id and not ParentStudent.objects.filter(parent__user=user, student_id=student_id).exists():
            raise PermissionDenied("You do not have permission to create elective choices for this student.")

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            'success': True,
            'message': 'Elective choice created successfully',
            'status': 201,
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        user = request.user
        instance = self.get_object()
        if not user.is_superuser and not ParentStudent.objects.filter(parent__user=user, student_id=instance.student_id).exists():
            raise PermissionDenied("You do not have permission to update this student's elective choices.")

        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            'success': True,
            'message': 'Elective choice updated successfully',
            'status': 200,
            'data': serializer.data
        })

    def destroy(self, request, *args, **kwargs):
        user = request.user
        instance = self.get_object()
        if not user.is_superuser and not ParentStudent.objects.filter(parent__user=user, student_id=instance.student_id).exists():
            raise PermissionDenied("You do not have permission to delete this student's elective choices.")

        instance.delete()
        return Response({
            'success': True,
            'message': 'Elective choice deleted successfully',
            'status': 204,
            'data': {}
        }, status=status.HTTP_204_NO_CONTENT)

class StudentExtraChoicesViewSet(viewsets.ModelViewSet):
    queryset = StudentExtraChoice.objects.all()
    serializer_class = StudentExtraChoicesSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        student_id = self.request.query_params.get('student_id')

        if not user.is_superuser and student_id and not ParentStudent.objects.filter(parent__user=user, student_id=student_id).exists():
            raise PermissionDenied("You do not have permission to view this student's extra choices.")

        # Allow superusers to see all records, otherwise filter by student_id if provided
        if user.is_superuser:
            return self.queryset.all()
        return self.queryset.filter(student_id=student_id) if student_id else self.queryset.none()

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
        user = self.request.user
        instance = self.get_object()
        if not user.is_superuser and not ParentStudent.objects.filter(parent__user=user, student_id=instance.student_id).exists():
            raise PermissionDenied("You do not have permission to view this student's extra choices.")
        serializer = self.get_serializer(instance)
        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        })

    def create(self, request, *args, **kwargs):
        user = request.user
        student_id = request.data.get('student_id')
        if not user.is_superuser and student_id and not ParentStudent.objects.filter(parent__user=user, student_id=student_id).exists():
            raise PermissionDenied("You do not have permission to create extra choices for this student.")

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            'success': True,
            'message': 'Extra choice created successfully',
            'status': 201,
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        user = request.user
        instance = self.get_object()
        if not user.is_superuser and not ParentStudent.objects.filter(parent__user=user, student_id=instance.student_id).exists():
            raise PermissionDenied("You do not have permission to update this student's extra choices.")

        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            'success': True,
            'message': 'Extra choice updated successfully',
            'status': 200,
            'data': serializer.data
        })

    def destroy(self, request, *args, **kwargs):
        user = request.user
        instance = self.get_object()
        if not user.is_superuser and not ParentStudent.objects.filter(parent__user=user, student_id=instance.student_id).exists():
            raise PermissionDenied("You do not have permission to delete this student's extra choices.")

        instance.delete()
        return Response({
            'success': True,
            'message': 'Extra choice deleted successfully',
            'status': 204,
            'data': {}
        }, status=status.HTTP_204_NO_CONTENT)


class StudentSubjectViewSet(viewsets.ModelViewSet):
    """ViewSet for managing student subject enrollments"""
    queryset = StudentSubject.objects.all()
    serializer_class = StudentSubjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = self.queryset

        # Filter by student_id if provided
        student_id = self.request.query_params.get('student_id')
        if student_id:
            queryset = queryset.filter(student_id=student_id)

        # Filter by subject_id if provided
        subject_id = self.request.query_params.get('subject_id')
        if subject_id:
            queryset = queryset.filter(subject_id=subject_id)

        # Students can only see their own enrolled subjects
        if hasattr(user, 'student_profile'):
            return queryset.filter(student=user.student_profile)

        # Parents can see their children's enrolled subjects
        try:
            from students.models import ParentStudent
            parent_students = ParentStudent.objects.filter(parent__user=user).values_list('student_id', flat=True)
            if parent_students.exists():
                return queryset.filter(student_id__in=parent_students)
        except ImportError:
            pass

        # Teachers and admins can see all (with optional filtering)
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


class ClassSubjectViewSet(viewsets.ModelViewSet):
    """ViewSet for managing class-level subject assignments (subjects available to all sections of a class)"""
    queryset = ClassSubject.objects.all()
    serializer_class = ClassSubjectSerializer
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
        class_id = self.request.query_params.get('class_id')
        subject_id = self.request.query_params.get('subject_id')

        queryset = self.queryset.select_related('class_fk', 'subject', 'subject__course_type')

        # Superusers can see all
        if user.is_superuser:
            if branch_id:
                queryset = queryset.filter(class_fk__branch_id=branch_id)
            if class_id:
                queryset = queryset.filter(class_fk_id=class_id)
            if subject_id:
                queryset = queryset.filter(subject_id=subject_id)
            return queryset

        # Admins can see assignments for their accessible branches
        if self.is_administrative_user(user):
            from users.models import UserBranchAccess
            accessible_branches = UserBranchAccess.objects.filter(user=user).values_list('branch_id', flat=True)
            queryset = queryset.filter(class_fk__branch_id__in=accessible_branches)
            if branch_id:
                queryset = queryset.filter(class_fk__branch_id=branch_id)
            if class_id:
                queryset = queryset.filter(class_fk_id=class_id)
            if subject_id:
                queryset = queryset.filter(subject_id=subject_id)
            return queryset

        # Teachers can see subjects for classes they teach
        try:
            from teachers.models import Teacher, TeacherAssignment
            teacher = Teacher.objects.get(user=user)
            teacher_classes = TeacherAssignment.objects.filter(teacher=teacher).values_list('class_fk', flat=True).distinct()
            queryset = queryset.filter(class_fk__in=teacher_classes)
            if class_id:
                queryset = queryset.filter(class_fk_id=class_id)
            if subject_id:
                queryset = queryset.filter(subject_id=subject_id)
            return queryset
        except:
            pass

        # Students can see subjects for their class
        if hasattr(user, 'student_profile'):
            student = user.student_profile
            return queryset.filter(class_fk=student.grade)

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
