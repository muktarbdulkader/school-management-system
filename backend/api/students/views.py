from rest_framework import viewsets, status, serializers
from django.utils import timezone
from datetime import datetime
from django.db import IntegrityError
from django.db.models import Q, OuterRef, Exists, Subquery, Avg
from rest_framework.decorators import action
from academics.models import Term
from .models import StudentSubject
from communication.models import Announcement
from lessontopics.models import Assignments, StudentAssignments
from lessontopics.serializers import AssignmentsSerializer
from schedule.models import Attendance, ClassScheduleSlot, StudentScheduleOverride
from teachers.models import Teacher
from users.models import Role, has_model_permission, UserBranchAccess
from rest_framework.response import Response
from .models import BehaviorIncidents, BehaviorRatings, HealthConditions, Parent, ParentRelationship, Student, ParentStudent, StudentHealthRecords, TeacherRating
from .serializers import BehaviorIncidentsSerializer, BehaviorRatingsSerializer, HealthConditionsSerializer, ParentRelationshipSerializer, ParentSerializer, StudentHealthRecordsSerializer, StudentSerializer, ParentStudentSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from users.models import UserBranchAccess

class ParentViewSet(viewsets.ModelViewSet):
    queryset = Parent.objects.all()
    serializer_class = ParentSerializer
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

        # 1. Superusers see all
        if user.is_superuser:
            queryset = self.queryset.all()
            if branch_id:
                queryset = queryset.filter(children_links__student__branch_id=branch_id).distinct()
            return queryset

        # 2. Administrative Users (Admin/Staff) - Branch Isolated
        if self.is_administrative_user(user):
            accessible_branches = UserBranchAccess.objects.filter(user=user).values_list('branch_id', flat=True)
            queryset = self.queryset.filter(children_links__student__branch_id__in=accessible_branches).distinct()

            if branch_id:
                try:
                    import uuid
                    if uuid.UUID(branch_id) in accessible_branches:
                        queryset = queryset.filter(children_links__student__branch_id=branch_id).distinct()
                    else:
                        queryset = queryset.none()
                except (ValueError, TypeError):
                    queryset = queryset.none()
            return queryset

        # 3. Parents see only themselves
        if self.queryset.filter(user=user).exists():
            return self.queryset.filter(user=user)

        # 4. Fallback: Students and teachers get no parent list access
        return self.queryset.none()

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        }
        return Response(response_data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        }
        return Response(response_data)

    def perform_create(self, serializer):
        branch_id = self.request.data.get('branch_id')
        if branch_id and not has_model_permission(self.request.user, 'parent', 'add_parent', branch_id):
            raise PermissionDenied("You do not have permission to create parents in this branch.")
        serializer.save()

    def create(self, request, *args, **kwargs):
        user_id = request.data.get('user')
        if user_id:
            existing_parent = Parent.objects.filter(user_id=user_id).first()
            if existing_parent:
                serializer = self.get_serializer(existing_parent, data=request.data)
                serializer.is_valid(raise_exception=True)

                branch_id = request.data.get('branch_id')
                if branch_id and not has_model_permission(request.user, 'parent', 'add_parent', branch_id):
                    raise PermissionDenied("You do not have permission to create parents in this branch.")

                serializer.save()
                return Response({
                    'success': True,
                    'message': 'OK',
                    'status': 201,
                    'data': serializer.data
                }, status=201)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 201,
            'data': serializer.data
        }
        return Response(response_data, status=201)

    def perform_update(self, serializer):
        if not has_model_permission(self.request.user, 'parent', 'change_parent', branch_id=None):
            raise PermissionDenied("You do not have permission to update parents.")
        serializer.save()

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        }
        return Response(response_data)

    def perform_create(self, serializer):
        user = self.request.user
        # Parents are often created alongside students.
        # For direct creation, we check if the user has access to any branch.
        if not user.is_superuser:
            from users.models import UserBranchAccess
            if not UserBranchAccess.objects.filter(user=user).exists():
                raise PermissionDenied("You do not have permission to create parents.")
        serializer.save()

    def update(self, request, *args, **kwargs):
        user = request.user
        instance = self.get_object()

        if not user.is_superuser:
            from users.models import UserBranchAccess
            accessible_branches = UserBranchAccess.objects.filter(user=user).values_list('branch_id', flat=True)
            # Check if parent has kids in an authorized branch
            if not ParentStudent.objects.filter(parent=instance, student__branch_id__in=accessible_branches).exists():
                raise PermissionDenied("You do not have permission to update this parent.")

        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({'success': True, 'message': 'OK', 'status': 200, 'data': serializer.data})

    def destroy(self, request, *args, **kwargs):
        user = request.user
        instance = self.get_object()

        if not user.is_superuser:
            from users.models import UserBranchAccess
            accessible_branches = UserBranchAccess.objects.filter(user=user).values_list('branch_id', flat=True)
            if not ParentStudent.objects.filter(parent=instance, student__branch_id__in=accessible_branches).exists():
                raise PermissionDenied("You do not have permission to delete this parent.")

        instance.delete()
        return Response({'success': True, 'message': 'OK', 'status': 204, 'data': []}, status=204)

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        branch_id = self.request.query_params.get('branch_id')
        search = self.request.query_params.get('search')
        queryset = self.queryset

        # Admin role check
        user_role_names = list(user.userrole_set.values_list('role__name', flat=True))
        is_admin_role = any(r.lower() in ['admin', 'super_admin', 'staff', 'head_admin', 'ceo'] for r in user_role_names)

        # 1. Access Filtering
        if user.is_superuser:
            if branch_id:
                queryset = queryset.filter(branch_id=branch_id)
        elif user.is_staff or is_admin_role:
            from users.models import UserBranchAccess
            accessible_branches = UserBranchAccess.objects.filter(user=user).values_list('branch_id', flat=True)

            if branch_id:
                # If a specific branch is requested, ensure user has access to it
                try:
                    import uuid
                    if uuid.UUID(branch_id) in accessible_branches:
                        queryset = queryset.filter(branch_id=branch_id)
                    else:
                        queryset = queryset.none()
                except (ValueError, TypeError):
                    queryset = queryset.none()
            else:
                # Show all students from all accessible branches
                queryset = queryset.filter(branch_id__in=accessible_branches)
        elif hasattr(user, 'student_profile'): # Changed from student_profiles
            queryset = queryset.filter(user=user)
        elif hasattr(user, 'teacher_profile'): # Changed from teacher_profiles
            from users.models import UserBranchAccess
            accessible_branches = UserBranchAccess.objects.filter(user=user).values_list('branch_id', flat=True)
            queryset = queryset.filter(branch_id__in=accessible_branches)
        elif hasattr(user, 'parent_profile'): # Changed from parent_profiles
            from .models import ParentStudent
            children_ids = ParentStudent.objects.filter(parent__user=user).values_list('student_id', flat=True)
            queryset = queryset.filter(id__in=children_ids)
        else:
            queryset = queryset.none()

        # 2. Search Logic
        if search:
            queryset = queryset.filter(
                Q(user__full_name__icontains=search) |
                Q(user__email__icontains=search) |
                Q(student_id__icontains=search)
            )

        return queryset.distinct()

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        }
        return Response(response_data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        }
        return Response(response_data)

    def perform_create(self, serializer):
        user = self.request.user
        branch_id = self.request.data.get('branch_id') or self.request.data.get('branch')

        if not user.is_superuser:
            if not branch_id:
                raise PermissionDenied("Branch ID is required.")
            from users.models import UserBranchAccess
            if not UserBranchAccess.objects.filter(user=user, branch_id=branch_id).exists():
                raise PermissionDenied("You do not have permission to create students in this branch.")
        serializer.save()

    def update(self, request, *args, **kwargs):
        user = request.user
        instance = self.get_object()

        if not user.is_superuser:
            from users.models import UserBranchAccess
            if not UserBranchAccess.objects.filter(user=user, branch_id=instance.branch_id).exists():
                raise PermissionDenied("You do not have permission to update this student.")

        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({'success': True, 'message': 'OK', 'status': 200, 'data': serializer.data})

    def destroy(self, request, *args, **kwargs):
        user = request.user
        instance = self.get_object()

        if not user.is_superuser:
            from users.models import UserBranchAccess
            if not UserBranchAccess.objects.filter(user=user, branch_id=instance.branch_id).exists():
                raise PermissionDenied("You do not have permission to delete this student.")

        instance.delete()
        return Response({'success': True, 'message': 'OK', 'status': 204, 'data': []}, status=204)

    def create(self, request, *args, **kwargs):
        from django.db import transaction
        from users.models import User, Role, UserRole
        from academics.models import Class, Section

        data = request.data

        # If 'user' FK is already provided, use the normal serializer path
        if 'user' in data and data['user']:
            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            return Response({'success': True, 'message': 'Student created successfully', 'status': 201, 'data': serializer.data}, status=201)

        # Otherwise create user + student from form fields
        full_name = data.get('full_name', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', 'student123')

        if not full_name or not email:
            print(f"[StudentViewSet] Missing full_name or email in payload: {data}")
            return Response({'success': False, 'message': 'full_name and email are required', 'status': 400}, status=400)

        # Get or create user
        if User.objects.filter(email=email).exists():
            user = User.objects.get(email=email)
            # Check if a student with same student_id already exists for this user
            if 'student_id' in data and data['student_id']:
                if Student.objects.filter(user=user, student_id=data['student_id']).exists():
                    return Response({'success': False, 'message': f'A student with ID {data["student_id"]} already exists for this user', 'status': 400}, status=400)
        else:
            user = None

        # Map grade_id / section_id → grade / section
        grade_id   = data.get('grade_id') or data.get('grade')
        section_id = data.get('section_id') or data.get('section')

        try:
            with transaction.atomic():
                # 1. Create the User if not exists
                if user is None:
                    # Ensure student role exists
                    role, _ = Role.objects.get_or_create(
                        name='student',
                        defaults={'description': 'Student role with read access'}
                    )
                    user = User.objects.create_user(email=email, full_name=full_name, password=password)

                    # 2. Assign the 'student' role (only for new users)
                    UserRole.objects.get_or_create(user=user, role=role, defaults={'access_level': 'read'})
                else:
                    # Update existing user's name if different
                    if user.full_name != full_name:
                        user.full_name = full_name
                        user.save()

                # 3. Build Student data
                student_data = {
                    'user':       user.id,
                    'grade':      grade_id,
                    'section':    section_id,
                    'gender':     data.get('gender', ''),
                    'birth_date': data.get('date_of_birth') or data.get('birth_date') or None,
                    'citizenship': data.get('citizenship', ''),
                    'family_status':    data.get('family_status', ''),
                    'family_residence': data.get('family_residence', ''),
                }

                # Remove None / empty optional fields so serializer doesn't choke
                student_data = {k: v for k, v in student_data.items() if v not in (None, '')}

                # branch is optional â€” include if provided
                branch_id_val = data.get('branch_id') or data.get('branch')
                if branch_id_val:
                    student_data['branch'] = branch_id_val

                # emergency_contact is optional
                emergency_contact = data.get('emergency_contact')
                if emergency_contact:
                    student_data['emergency_contact'] = emergency_contact

                # Check if a student profile was automatically created by the signal
                existing_student = Student.objects.filter(user=user).first()
                if existing_student:
                    serializer = self.get_serializer(existing_student, data=student_data)
                else:
                    serializer = self.get_serializer(data=student_data)

                if not serializer.is_valid():
                    # Roll back: Delete student records first (if any), then user
                    Student.objects.filter(user=user).delete()
                    user.delete()
                    print(f"[StudentViewSet] Validation errors: {serializer.errors}")
                    return Response({'success': False, 'message': 'Validation error', 'errors': serializer.errors, 'status': 400}, status=400)

                student = serializer.save()

                # Create ParentStudent link if parent_id was provided
                parent_id = data.get('parent_id')
                if parent_id:
                    try:
                        from .models import ParentStudent, ParentRelationship
                        parent = Parent.objects.get(id=parent_id)
                        
                        # Get or create "Parent" relationship
                        relationship, created = ParentRelationship.objects.get_or_create(
                            name='Parent',
                            defaults={'name': 'Parent'}
                        )
                        
                        # Create the ParentStudent link
                        ParentStudent.objects.get_or_create(
                            parent=parent,
                            student=student,
                            relationship=relationship
                        )
                        print(f"[StudentViewSet] Created ParentStudent link: {parent.user.full_name} -> {student.user.full_name}")
                    except Exception as e:
                        print(f"[StudentViewSet] Error creating ParentStudent link: {e}")
                        # Don't fail the student creation if parent linking fails

                return Response({
                    'success': True,
                    'message': 'Student created successfully',
                    'status': 201,
                    'data': self.get_serializer(student).data
                }, status=201)

        except IntegrityError as e:
            # Handle database integrity errors (e.g., duplicate user+student_id)
            error_msg = str(e)
            if 'students_student.user_id' in error_msg or 'unique' in error_msg.lower():
                print(f"[StudentViewSet] IntegrityError: Student with this ID already exists for this user")
                return Response({'success': False, 'message': 'A student with this ID already exists for this user', 'status': 400}, status=400)
            print(f"[StudentViewSet] IntegrityError: {error_msg}")
            return Response({'success': False, 'message': f'Database error: {error_msg}', 'status': 400}, status=400)
        except serializers.ValidationError as e:
            # Handle validation errors from serializer.save() or other validation
            print(f"[StudentViewSet] Validation error: {str(e)}")
            return Response({'success': False, 'message': 'Validation error', 'errors': e.detail, 'status': 400}, status=400)
        except Exception as e:
            print(f"[StudentViewSet] Error creating student: {str(e)}")
            return Response({'success': False, 'message': str(e), 'status': 400}, status=400)

    def perform_update(self, serializer):
        branch_id = self.request.data.get('branch_id') or self.request.data.get('branch') or self.request.query_params.get('branch_id')
        if branch_id and not has_model_permission(self.request.user, 'student', 'change_student', branch_id):
            raise PermissionDenied("You do not have permission to update students in this branch.")
        serializer.save()

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)

        if not serializer.is_valid():
            print(f"[StudentViewSet] Validation errors: {serializer.errors}")
            return Response({
                'success': False,
                'message': 'Validation error',
                'errors': serializer.errors,
                'status': 400
            }, status=400)

        self.perform_update(serializer)
        response_data = {
            'success': True,
            'message': 'Student updated successfully',
            'status': 200,
            'data': serializer.data
        }
        return Response(response_data)

    def perform_destroy(self, instance):
        if not has_model_permission(self.request.user, 'student', 'delete_student', branch_id=None):
            raise PermissionDenied("You do not have permission to delete students.")
        instance.delete()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 204,
            'data': []
        }
        return Response(response_data, status=204)

    @action(detail=False, methods=['get'], url_path='me')
    def get_my_profile(self, request):
        """
        Endpoint for students to get their own profile
        """
        user = request.user

        print(f"[StudentProfile] User requesting profile: {user.email} (ID: {user.id})")

        try:
            # Find the student profile for the current user (use first() to handle duplicates)
            student = Student.objects.select_related('user', 'grade', 'section', 'branch').filter(user=user).first()

            if not student:
                print(f"[StudentProfile] ERROR: No Student profile found for user {user.email}")
                print(f"[StudentProfile] Total Student records: {Student.objects.count()}")
                print(f"[StudentProfile] Checking if user has student_profiles relation...")

                return Response({
                    'success': False,
                    'message': 'Student profile not found for this user',
                    'status': 404,
                    'data': {}
                }, status=404)

            print(f"[StudentProfile] Found student: {student.user.full_name} (Student ID: {student.id})")
            print(f"[StudentProfile] Grade: {student.grade}, Section: {student.section}")

            serializer = self.get_serializer(student)

            return Response({
                'success': True,
                'message': 'OK',
                'status': 200,
                'data': serializer.data
            })
        except Student.DoesNotExist:
            print(f"[StudentProfile] Exception: Student.DoesNotExist for user {user.email}")
            return Response({
                'success': False,
                'message': 'Student profile not found for this user',
                'status': 404,
                'data': {}
            }, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['get'], url_path='performance')
    def performance(self, request, pk=None):
        student = self.get_object()
        user = request.user
        if not (self._is_teacher_of_student(user, student) or user.is_staff):
            raise PermissionDenied("You do not have permission to view performance data.")

        # Behavior incidents
        from .models import BehaviorIncidents, BehaviorRatings
        incidents = BehaviorIncidents.objects.filter(student_id=student).order_by('-incident_date')[:10]
        from .serializers import BehaviorIncidentsSerializer
        incidents_data = BehaviorIncidentsSerializer(incidents, many=True).data

        # Behavior ratings
        ratings = BehaviorRatings.objects.filter(student_id=student).order_by('-rated_on')[:10]
        from .serializers import BehaviorRatingsSerializer
        ratings_data = BehaviorRatingsSerializer(ratings, many=True).data

        # Exam results
        from lessontopics.models import ExamResults
        from lessontopics.serializers import ExamResultsSerializer
        exam_results = ExamResults.objects.filter(student_id=student).order_by('-exam_id__start_date')[:10]
        exam_results_data = ExamResultsSerializer(exam_results, many=True).data

        return Response({
            'success': True,
            'status': 200,
            'data': {
                'incidents': incidents_data,
                'ratings': ratings_data,
                'exam_results': exam_results_data
            }
        })

    @action(detail=True, methods=['get'], url_path='attendance')
    def attendance(self, request, pk=None):
        student = self.get_object()
        user = request.user
        if not (self._is_teacher_of_student(user, student) or user.is_staff):
            raise PermissionDenied("You do not have permission to view attendance data.")

        from schedule.models import Attendance
        attendance_records = Attendance.objects.filter(student=student).order_by('-date')[:30]
        attendance_data = [{'date': att.date, 'status': att.status} for att in attendance_records]

        # summary stats
        from django.db.models import Count
        stats = Attendance.objects.filter(student=student).values('status').annotate(count=Count('id'))

        return Response({
            'success': True,
            'status': 200,
            'data': {
                'history': attendance_data,
                'summary': list(stats)
            }
        })

    @action(detail=True, methods=['get'], url_path='assignments')
    def assignments(self, request, pk=None):
        student = self.get_object()
        user = request.user
        if not (self._is_teacher_of_student(user, student) or user.is_staff):
            raise PermissionDenied("You do not have permission to view assignments.")

        from lessontopics.models import Assignments, StudentAssignments
        from lessontopics.serializers import SimpleAssignmentsSerializer, StudentAssignmentsSerializer
        from django.db.models import Q

        # All assignments assigned to the student (either directly or via section/class)
        # Limit to 50 most recent to prevent memory issues
        all_assignments = Assignments.objects.filter(
            Q(students=student) | Q(section=student.section) | Q(class_fk=student.grade)
        ).select_related(
            'teacher_assignment', 'teacher_assignment__subject',
            'teacher_assignment__class_fk', 'teacher_assignment__section',
            'teacher_assignment__teacher', 'teacher_assignment__teacher__user'
        ).distinct().order_by('-due_date')[:50]

        assignment_ids = [a.id for a in all_assignments]
        submissions = StudentAssignments.objects.filter(student=student, assignment_id__in=assignment_ids)

        assignments_data = SimpleAssignmentsSerializer(all_assignments, many=True).data
        submissions_data = StudentAssignmentsSerializer(submissions, many=True).data

        return Response({
            'success': True,
            'status': 200,
            'data': {
                'assignments': assignments_data,
                'submissions': submissions_data
            }
        })

    def _is_teacher_of_student(self, user, student):
        """Helper to check if a user is a teacher assigned to this student's class/section"""
        if user.is_superuser: return True
        try:
            from teachers.models import Teacher, TeacherAssignment
            teacher = Teacher.objects.get(user=user)
            cst_query = TeacherAssignment.objects.filter(
                teacher=teacher,
                class_fk=student.grade
            )
            if student.section:
                from django.db.models import Q
                cst_query = cst_query.filter(Q(section=student.section) | Q(section__isnull=True))
            return cst_query.exists()
        except Exception:
            return False


class ParentRelationShipViewSet(viewsets.ModelViewSet):
    queryset = ParentRelationship.objects.all()
    serializer_class = ParentRelationshipSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        branch_id = self.request.query_params.get('branch_id')

        if user.is_superuser:
            return self.queryset.all()

        if branch_id and not has_model_permission(self.request.user, 'parentrelationship', 'view_parentrelationship', branch_id):
            raise PermissionDenied("You do not have permission to view parent-relationships in this branch.")
        return self.queryset.filter()

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        }
        return Response(response_data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        }
        return Response(response_data)

    def perform_create(self, serializer):
        branch_id = self.request.data.get('branch_id')
        if branch_id and not has_model_permission(self.request.user, 'parentrelationship', 'add_parentrelationship', branch_id):
            raise PermissionDenied("You do not have permission to create parent-relationships in this branch.")
        serializer.save()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 201,
            'data': serializer.data
        }
        return Response(response_data, status=201)

    def perform_update(self, serializer):
        if not has_model_permission(self.request.user, 'parentrelationship', 'change_parentrelationship', branch_id=None):
            raise PermissionDenied("You do not have permission to update parent-relationships.")
        serializer.save()

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        }
        return Response(response_data)

    def perform_destroy(self, instance):
        if not has_model_permission(self.request.user, 'parentrelationship', 'delete_parentrelationship', branch_id=None):
            raise PermissionDenied("You do not have permission to delete parent-relationships.")
        instance.delete()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 204,
            'data': []
        }
        return Response(response_data, status=204)
class ParentStudentViewSet(viewsets.ModelViewSet):
    queryset = ParentStudent.objects.all()
    serializer_class = ParentStudentSerializer
    permission_classes = [IsAuthenticated]

    def is_administrative_user(self, user):
        """Helper to check if user has admin, super_admin, or staff roles"""
        if user.is_superuser:
            return True
        user_roles = list(user.userrole_set.values_list('role__name', flat=True))
        admin_roles = ['admin', 'super_admin', 'superadmin', 'staff', 'head_admin', 'ceo']
        return any(role.lower() in admin_roles for role in user_roles)

    def _is_teacher_of_student(self, user, student):
        """Helper to check if a user is a teacher assigned to this student's class/section"""
        from teachers.models import Teacher, TeacherAssignment
        try:
            teacher = Teacher.objects.get(user=user)
            # A teacher teaches a student if they have a TeacherAssignment record for that class
            # and (optionally) the same section, or no section specified (all sections)
            cst_query = TeacherAssignment.objects.filter(
                teacher=teacher,
                class_fk=student.grade
            )
            if student.section:
                from django.db.models import Q
                cst_query = cst_query.filter(Q(section=student.section) | Q(section__isnull=True))

            return cst_query.exists()
        except Teacher.DoesNotExist:
            return False

    def get_queryset(self):
        user = self.request.user
        branch_id = self.request.query_params.get('branch_id')

        if user.is_superuser:
            return self.queryset.all()

        if branch_id and not has_model_permission(user, 'parentstudent', 'view_parentstudent', branch_id):
            raise PermissionDenied("You do not have permission to view parent-student relationships in this branch.")
        return self.queryset.filter(parent__user=user)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        }
        return Response(response_data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        }
        return Response(response_data)

    def perform_create(self, serializer):
        branch_id = self.request.data.get('branch_id')
        if branch_id and not has_model_permission(self.request.user, 'parentstudent', 'add_parentstudent', branch_id):
            raise PermissionDenied("You do not have permission to create parent-student relationships in this branch.")
        serializer.save()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 201,
            'data': serializer.data
        }
        return Response(response_data, status=201)

    def perform_update(self, serializer):
        if not has_model_permission(self.request.user, 'parentstudent', 'change_parentstudent', branch_id=None):
            raise PermissionDenied("You do not have permission to update parent-student relationships.")
        serializer.save()

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        }
        return Response(response_data)

    def perform_destroy(self, instance):
        if not has_model_permission(self.request.user, 'parentstudent', 'delete_parentstudent', branch_id=None):
            raise PermissionDenied("You do not have permission to delete parent-student relationships.")
        instance.delete()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        response_data = {
            'success': True,
            'message': 'OK',
            'status': 204,
            'data': []
        }
        return Response(response_data, status=204)

    @action(detail=False, methods=['get'], url_path='children')
    def children(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'message': 'List of children retrieved successfully',
            'status': 200,
            'data': serializer.data
        })

    @action(detail=False, methods=['get'], url_path='dashboard/(?P<student_id>[^/.]+)/?')
    def dashboard(self, request, student_id=None):
        user = request.user
        branch_id = request.query_params.get('branch_id')

        # Imports needed for this view
        from lessontopics.models import (
            LessonPlans, ExamResults, StudentAssignments, Assignments
        )
        from lessontopics.serializers import (
            LessonPlansSerializer, ExamResultsSerializer, StudentAssignmentsSerializer, SimpleAssignmentsSerializer
        )
        from schedule.models import Exam, Attendance
        from communication.models import Announcement
        from communication.serializers import AnnouncementSerializer
        from .models import BehaviorRatings
        from academics.models import Subject
        from students.models import StudentSubject
        from teachers.models import Teacher, TeacherAssignment

        if user.is_superuser:
            pass
        elif branch_id and not has_model_permission(user, 'parentstudent', 'view_parentstudent', branch_id):
            raise PermissionDenied("You do not have permission to view this student's dashboard in this branch.")

        try:
            from django.core.exceptions import ValidationError
            import uuid
            try:
                # Try lookup by UUID first
                try:
                    uuid_val = uuid.UUID(student_id)
                    student = Student.objects.get(id=uuid_val)
                except (ValueError, TypeError):
                    # Fallback to student_id code if not a valid UUID string
                    student = Student.objects.get(student_id=student_id)
            except (Student.DoesNotExist, ValidationError, ValueError):
                # Final fallback for student_id as code
                student = Student.objects.get(student_id=student_id)

            # Allow:
            # 1. Students to view their own dashboard
            # 2. Parents to view their children's dashboard
            # 3. Teachers to view their students' dashboard
            # 4. Admins/Staff
            is_own_dashboard = student.user == user
            is_parent = ParentStudent.objects.filter(parent__user=user, student=student).exists()
            is_teacher = self._is_teacher_of_student(user, student)
            
            # Staff check: includes superusers and anyone with is_staff property
            is_administrative = user.is_superuser or user.is_staff or self.is_administrative_user(user)

            if not (is_own_dashboard or is_parent or is_teacher or is_administrative):
                raise PermissionDenied("You do not have permission to view this student's dashboard.")
        except Student.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Student not found',
                'status': 404,
                'data': {}
            }, status=status.HTTP_404_NOT_FOUND)

        student_profile = Student.objects.select_related('user', 'grade', 'section').get(id=student_id)

        # Try to get schedule data, but handle if table doesn't exist or has schema issues
        schedule_list = []
        try:
            if student.grade and student.section:
                schedule_slots = ClassScheduleSlot.objects.filter(
                    class_fk=student.grade,
                    section=student.section
                ).select_related('subject', 'teacher_assignment').order_by('period_number')
                overrides = StudentScheduleOverride.objects.filter(student=student).select_related('subject', 'teacher_assignment')

                schedule = {}
                for slot in schedule_slots:
                    period_key = slot.period_number
                    base_subject = slot.subject.name if slot.subject else 'Free Period'
                    teacher_name = None
                    if slot.teacher_assignment and slot.teacher_assignment.teacher:
                        teacher_name = slot.teacher_assignment.teacher.user.full_name

                    schedule[period_key] = {
                        'period_number': period_key,
                        'day_of_week': slot.day_of_week,
                        'start_time': slot.start_time.strftime('%H:%M:%S'),
                        'end_time': slot.end_time.strftime('%H:%M:%S'),
                        'subject': base_subject,
                        'teacher_id': teacher_name,
                    }

                current_time = timezone.now().time()
                for override in overrides:
                    if override.period_number in schedule and override.day_of_week == schedule[override.period_number]['day_of_week']:
                        schedule[override.period_number]['subject'] = override.subject.name if override.subject else 'Override'
                        if override.teacher_assignment and override.teacher_assignment.teacher:
                            schedule[override.period_number]['teacher_id'] = override.teacher_assignment.teacher.user.full_name
                        start_time = datetime.strptime(schedule[override.period_number]['start_time'], '%H:%M:%S').time()
                        end_time = datetime.strptime(schedule[override.period_number]['end_time'], '%H:%M:%S').time()
                        if current_time > end_time:
                            schedule[override.period_number]['status'] = 'completed'
                        elif current_time >= start_time and current_time <= end_time:
                            schedule[override.period_number]['status'] = 'ongoing'
                        else:
                            schedule[override.period_number]['status'] = 'upcoming'

                for period_key, slot_data in schedule.items():
                    if 'status' not in slot_data:
                        start_time = datetime.strptime(slot_data['start_time'], '%H:%M:%S').time()
                        end_time = datetime.strptime(slot_data['end_time'], '%H:%M:%S').time()
                        if current_time > end_time:
                            slot_data['status'] = 'completed'
                        elif current_time >= start_time and current_time <= end_time:
                            slot_data['status'] = 'ongoing'
                        else:
                            slot_data['status'] = 'upcoming'

                schedule_list = [schedule[period] for period in sorted(schedule.keys())]
        except Exception as e:
            # If schedule query fails (e.g., missing columns), return empty schedule
            print(f"Schedule query error: {e}")
            schedule_list = []

        today = timezone.now().date()
        end_date_assignments = today + timezone.timedelta(days=10)
        submitted_assignments = StudentAssignments.objects.filter(
            assignment=OuterRef('id')
            ).values('assignment')
        upcoming_assignments = Assignments.objects.filter(
                Q(students=student)
            ).exclude(
                id__in=Subquery(submitted_assignments)
        ).filter(
            due_date__gte=today,
            due_date__lte=end_date_assignments
        ).order_by('-due_date').select_related(
            'teacher_assignment', 'teacher_assignment__subject',
            'teacher_assignment__class_fk', 'teacher_assignment__section',
            'teacher_assignment__teacher', 'teacher_assignment__teacher__user'
        )[:20]

        upcoming_assignments_data = SimpleAssignmentsSerializer(upcoming_assignments, many=True).data
        health_record = StudentHealthRecords.objects.filter(student=student).order_by('-date').first()
        health_incident = health_record.incident if health_record else "No recent health incidents"
        health_history = health_record.history if health_record else "No health history recorded"
        health_condition = health_record.condition.name if health_record and health_record.condition else None
        health_date = health_record.date.strftime('%Y-%m-%d') if health_record else None

        # Get behavior ratings by category
        behavior_ratings_qs = BehaviorRatings.objects.filter(student=student)
        behavior_ratings_dict = {}

        # Calculate average for each category
        categories = ['Respect', 'Responsibility', 'Cooperation', 'Participation', 'Self-Control']
        for category in categories:
            category_avg = behavior_ratings_qs.filter(category=category).aggregate(avg=Avg('rating'))['avg']
            if category_avg:
                behavior_ratings_dict[category] = {'average': round(category_avg * 20, 2)}  # Convert to percentage (5-point scale to 100)

        # Calculate overall average
        overall_avg = behavior_ratings_qs.aggregate(avg_rating=Avg('rating'))['avg_rating']
        if overall_avg:
            behavior_ratings_dict['Overall Behavior'] = {'average': round(overall_avg * 20, 2)}

        attendance_records = Attendance.objects.filter(student=student).order_by('-date')
        total_records = attendance_records.count()
        present_count = attendance_records.filter(status__iexact='present').count()
        average_attendance = (present_count / total_records * 100) if total_records > 0 else 0
        average_attendance = round(average_attendance, 2) if total_records > 0 else 0

        # Get lesson plans for the student's grade/section
        from lessontopics.models import LessonPlans, ExamResults
        from lessontopics.serializers import LessonPlansSerializer, ExamResultsSerializer
        from schedule.models import Exam

        lesson_plans = LessonPlans.objects.filter(
            class_fk=student.grade
        ).order_by('-created_at')[:5]
        lesson_plans_data = LessonPlansSerializer(lesson_plans, many=True).data

        # Get upcoming exams
        exams = Exam.objects.filter(
            class_fk=student.grade,
            section=student.section,
            end_date__gte=today
        ).order_by('start_date')[:5]
        exams_data = [{
            'id': ex.id,
            'name': ex.name,
            'type': ex.exam_type,
            'subject': ex.subject.name if ex.subject else 'All Subjects',
            'start_date': ex.start_date.strftime('%Y-%m-%d'),
            'end_date': ex.end_date.strftime('%Y-%m-%d'),
        } for ex in exams]

        # Get recent exam results
        exam_results = ExamResults.objects.filter(
            student=student
        ).select_related('subject', 'exam').order_by('-exam__start_date')[:5]
        exam_results_data = ExamResultsSerializer(exam_results, many=True).data

        # Get recent assignment grades
        assignment_grades = StudentAssignments.objects.filter(
            student=student,
            grade__isnull=False
        ).select_related('assignment', 'assignment__subject').order_by('-submitted_date')[:5]
        assignment_grades_data = StudentAssignmentsSerializer(assignment_grades, many=True).data

        user_roles = user.userrole_set.values_list('role__id', flat=True)
        parent_role = Role.objects.filter(name__iexact='parent').values_list('id', flat=True).first()
        student_role = Role.objects.filter(name__iexact='student').values_list('id', flat=True).first()
        relevant_roles = [role for role in [parent_role, student_role] if role]
        end_date = today + timezone.timedelta(days=30)
        announcements = Announcement.objects.filter(
            Q(audience_roles__id__in=user_roles) | Q(audience_roles__isnull=True),
            event_date__gte=today,
            event_date__lte=end_date
        ).distinct().order_by('event_date')

        announcements_data = AnnouncementSerializer(announcements, many=True).data


        # We find teachers who are assigned to the student's specific class and section
        # OR who are assigned to a subject the student is specifically enrolled in
        student_subjects = StudentSubject.objects.filter(student=student).values_list('subject', flat=True)
        enrolled_subjects_count = student_subjects.count()
        teacher_ids = TeacherAssignment.objects.filter(
            Q(class_fk=student.grade, section=student.section) |
            Q(subject__in=student_subjects)
        ).values_list('teacher', flat=True).distinct()

        teachers = Teacher.objects.filter(id__in=teacher_ids).select_related('user')
        teachers_data = []
        for teacher in teachers:
            # based on direct student_subjects OR class/section overlap
            teacher_cst = TeacherAssignment.objects.filter(teacher=teacher)
            cst_for_student = teacher_cst.filter(
                Q(subject__in=student_subjects) |
                (Q(class_fk=student.grade) & (Q(section=student.section) | Q(section__isnull=True) if hasattr(student, 'section') and student.section else Q()))
            )
            subj_ids = cst_for_student.values_list('subject', flat=True).distinct()
            teacher_subjects = Subject.objects.filter(id__in=subj_ids)

            if subj_ids.exists():
                teachers_data.append({
                    'user_id': teacher.user.id,
                    'teacher_id': teacher.id,
                    'full_name': teacher.user.full_name,
                    'email': teacher.user.email,
                    'phone': '',
                    'subject_details': [
                        {
                            'id': subj.id,
                            'name': subj.name,
                            'code': subj.code
                        } for subj in teacher_subjects if subj
                    ]
                })

        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': {
                'profile': {
                    'name': student_profile.user.full_name,
                    'grade': student_profile.grade.grade if student_profile.grade else 'N/A',
                    'section': student_profile.section.name if student_profile.section else 'N/A',
                },
                'schedule': schedule_list,
                'upcoming_assignments': upcoming_assignments_data,
                'health': {
                    'incident': health_incident,
                    'history': health_history,
                    'condition': health_condition,
                    'date': health_date
                },
                'behavior_ratings': behavior_ratings_dict,
                'attendance': {
                    'average_attendance': average_attendance
                },
                'lesson_plans': lesson_plans_data,
                'announcements': announcements_data,
                'teachers': teachers_data,
                'exams': exams_data,
                'exam_results': exam_results_data,
                'assignment_grades': assignment_grades_data,
                'enrolled_subjects_count': enrolled_subjects_count
            }
        })

        calendar_events = [
            {
                'date': ann.event_date,
                'title': ann.title,
                'urgency': ann.urgency,
            } for ann in announcements
        ]

        response_data = {
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': {
                'profile': {
                    'id': student_profile.id,
                    'full_name': student_profile.user.full_name,
                    'grade': student_profile.grade.grade if student_profile.grade else None,
                    'section': student_profile.section.name if student_profile.section else None,
                },
                'schedule': schedule_list,
                'upcoming_assignments': upcoming_assignments_data,
                'health': {
                    'date': health_record.date if health_record else today,
                    'incident': health_incident,
                    'history': health_history,
                    'condition': health_record.condition.name if health_record and health_record.condition else None
                },
                'behavior_ratings': behavior_ratings_dict,
                'attendance': {
                    'average_attendance': average_attendance
                },
                'calendar': calendar_events
            }
        }
        return Response(response_data)

    @action(detail=False, methods=['get'], url_path='profile_dashboard/(?P<student_id>[^/.]+)/?')
    def profile_dashboard(self, request, student_id=None):
        from lessontopics.serializers import SimpleAssignmentsSerializer

        user = request.user
        branch_id = request.query_params.get('branch_id')

        if branch_id and not has_model_permission(user, 'parentstudent', 'view_parentstudent', branch_id):
            raise PermissionDenied("You do not have permission to view this student's dashboard in this branch.")

        try:
            from django.core.exceptions import ValidationError
            try:
                # Try lookup by UUID first
                student = Student.objects.get(id=student_id)
            except (Student.DoesNotExist, ValidationError, ValueError):
                # Fallback to student_id code
                student = Student.objects.get(student_id=student_id)
            # Allow students to view their own dashboard OR parents to view their children's dashboard
            is_own_dashboard = student.user == user
            is_parent = ParentStudent.objects.filter(parent__user=user, student=student).exists()

            if not (is_own_dashboard or is_parent or user.is_staff):
                raise PermissionDenied("You do not have permission to view this student's dashboard.")
        except Student.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Student not found',
                'status': 404,
                'data': {}
            }, status=status.HTTP_404_NOT_FOUND)

        # Optimize queries with select_related and prefetch_related
        student_profile = Student.objects.select_related('user', 'grade', 'section').get(id=student_id)
        today = timezone.now().date()
        today_attendance = Attendance.objects.filter(student=student, date=today).first()
        today_attendance_status = today_attendance.status if today_attendance else 'Not recorded'

        health_record = StudentHealthRecords.objects.filter(student=student).order_by('-date').first()

        today = timezone.now().date()
        end_date_assignments = today + timezone.timedelta(days=10)
        submitted_assignments = StudentAssignments.objects.filter(
            assignment=OuterRef('id')
            ).values('assignment')
        upcoming_assignments = Assignments.objects.filter(
                Q(students=student)
            ).exclude(
                id__in=Subquery(submitted_assignments)
        ).filter(
            due_date__gte=today,
            due_date__lte=end_date_assignments
        ).order_by('-due_date').select_related(
            'teacher_assignment', 'teacher_assignment__subject',
            'teacher_assignment__class_fk', 'teacher_assignment__section',
            'teacher_assignment__teacher', 'teacher_assignment__teacher__user'
        )[:10]

        upcoming_assignments_data = SimpleAssignmentsSerializer(upcoming_assignments, many=True).data

        behavior_incidents = BehaviorIncidents.objects.filter(student=student).order_by('-incident_date')[:5]

        grade_academic_status = {
            'average_grade': "N/A",
            'last_updated': "N/A",
            'overall_progress': "N/A",
        }

        response_data = {
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': {
                'profile': {
                    'id': student_profile.id,
                    'full_name': student_profile.user.full_name,
                    'grade': student_profile.grade.grade if student_profile.grade else None,
                    'section': student_profile.section.name if student_profile.section else None,
                },
                'grade_academic_status': grade_academic_status,
                'attendance': {
                    'today_status': today_attendance_status
                },
                'health': {
                    'date': health_record.date if health_record else today,
                    'incident': health_record.incident if health_record else "No recent health incidents",
                    'history': health_record.history if health_record else "No health history recorded",
                    'condition': health_record.condition.name if health_record and health_record.condition else None
                },
                'upcoming_assignments': upcoming_assignments_data,
                'behavior_incidents': [
                    {
                        'id': incident.id,
                        'date': incident.incident_date,
                        'description': incident.description,
                        'feedbacker': incident.reported_by.full_name if incident.reported_by else 'Unknown'
                    } for incident in behavior_incidents
                ],
            }
        }
        return Response(response_data)

    @action(detail=False, methods=['get'], url_path='attendance_details/(?P<student_id>[^/.]+)/?')
    def attendance_details(self, request, student_id=None):
        user = request.user
        branch_id = request.query_params.get('branch_id')

        if branch_id and not has_model_permission(user, 'parentstudent', 'view_parentstudent', branch_id):
            raise PermissionDenied("You do not have permission to view this student's attendance details in this branch.")

        try:
            from django.core.exceptions import ValidationError
            try:
                # Try lookup by UUID first
                student = Student.objects.get(id=student_id)
            except (Student.DoesNotExist, ValidationError, ValueError):
                # Fallback to student_id code
                student = Student.objects.get(student_id=student_id)
            is_parent = ParentStudent.objects.filter(parent__user=user, student=student).exists()
            
            # Check if user is a teacher of this student
            is_teacher = False
            try:
                from teachers.models import Teacher, TeacherAssignment
                teacher = Teacher.objects.get(user=user)
                # Check if teacher is assigned to this student's class/section
                is_teacher = TeacherAssignment.objects.filter(
                    teacher=teacher,
                    class_fk=student.grade,
                    section=student.section
                ).exists()
            except Teacher.DoesNotExist:
                pass
            
            if not (is_parent or is_teacher or user.is_staff):
                raise PermissionDenied("You do not have permission to view this student's attendance details.")
        except Student.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Student not found',
                'status': 404,
                'data': {}
            }, status=status.HTTP_404_NOT_FOUND)

        attendance = Attendance.objects.filter(student=student).order_by('-date')[:30]  # Last 30 days

        attendance_data = [
            {
                'date': att.date,
                'status': att.status,
            } for att in attendance
        ]

        response_data = {
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': {
                'attendance': attendance_data
            }
        }
        return Response(response_data)

    @action(detail=False, methods=['get'], url_path='academic_progress/(?P<student_id>[^/.]+)/?')
    def academic_progress(self, request, student_id=None):
        user = request.user
        branch_id = request.query_params.get('branch_id')

        if branch_id and not has_model_permission(user, 'parentstudent', 'view_parentstudent', branch_id):
            raise PermissionDenied("You do not have permission to view this student's academic progress in this branch.")

        try:
            from django.core.exceptions import ValidationError
            try:
                # Try lookup by UUID first
                student = Student.objects.select_related('section').get(id=student_id)
            except (Student.DoesNotExist, ValidationError, ValueError):
                # Fallback to student_id code
                student = Student.objects.select_related('section').get(student_id=student_id)

            is_own = student.user == user
            is_parent = ParentStudent.objects.filter(parent__user=user, student=student).exists()
            
            # Check if user is a teacher of this student
            is_teacher = False
            try:
                from teachers.models import Teacher, TeacherAssignment
                teacher = Teacher.objects.get(user=user)
                # Check if teacher is assigned to this student's class/section
                is_teacher = TeacherAssignment.objects.filter(
                    teacher=teacher,
                    class_fk=student.grade,
                    section=student.section
                ).exists()
            except Teacher.DoesNotExist:
                pass

            if not (is_own or is_parent or is_teacher or user.is_staff):
                raise PermissionDenied("You do not have permission to view this student's academic progress.")
        except Student.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Student not found',
                'status': 404,
                'data': {}
            }, status=status.HTTP_404_NOT_FOUND)

        # Current term information
        today = timezone.now().date()
        current_term = Term.objects.filter(is_current=True).first()
        if current_term:
            total_weeks = (current_term.end_date - current_term.start_date).days // 7
            weeks_passed = (today - current_term.start_date).days // 7
            remaining_weeks = max(0, total_weeks - weeks_passed) if total_weeks > 0 else 0
            term_data = {
                'id': str(current_term.id),
                'academic_year': current_term.academic_year,
                'name': current_term.name,
                'start_date': current_term.start_date.isoformat(),
                'end_date': current_term.end_date.isoformat(),
                'is_current': current_term.is_current,
                'remaining_weeks': remaining_weeks
            }
        else:
            term_data = {
                'id': None,
                'academic_year': None,
                'name': None,
                'start_date': None,
                'end_date': None,
                'is_current': False,
                'remaining_weeks': 0
            }

        # Academic summary (placeholder)
        academic_summary = {
            'average_grade': "N/A", 
            'completion_rate': "N/A",
            'overall_progress': "N/A",
            'learning_progress': "N/A"
        }

        # Subjects with teachers
        student_subjects = StudentSubject.objects.filter(student=student).select_related('subject')
        subjects_data = []
        for ss in student_subjects:
            subject = ss.subject
            if not subject:
                continue  # Skip if subject is None
            schedule_slot = ClassScheduleSlot.objects.filter(
                class_fk=student.grade,
                section=student.section,
                subject=subject
            ).first()
            teacher_name = None
            if schedule_slot and schedule_slot.teacher_assignment:
                teacher_assignment = schedule_slot.teacher_assignment
                teacher_name = teacher_assignment.teacher.user.full_name if teacher_assignment and teacher_assignment.teacher and teacher_assignment.teacher.user else "Not assigned"
            subjects_data.append({
                'id': str(ss.id),
                'subject_id': str(subject.id),
                'subject_name': subject.name or "Unknown Subject",
                'teacher_name': teacher_name or "Not assigned",
                'progress': 0,
                'enrolled_on': ss.enrolled_on.isoformat() if ss.enrolled_on else None
            })

        # Add count to academic summary
        academic_summary['enrolled_subjects_count'] = len(subjects_data)

        response_data = {
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': {
                'academic_summary': academic_summary,
                'current_term': term_data,
                'subjects': subjects_data,
                'enrolled_subjects_count': len(subjects_data)
            }
        }
        return Response(response_data)



    @action(detail=False, methods=['get'], url_path='assignment_dashboard/(?P<student_id>[^/.]+)/?')
    def assignment_dashboard(self, request, student_id=None):
        from lessontopics.serializers import SimpleAssignmentsSerializer

        user = request.user
        branch_id = request.query_params.get('branch_id')

        if branch_id and not has_model_permission(user, 'parentstudent', 'view_parentstudent', branch_id):
            raise PermissionDenied("You do not have permission to view this student's assignment dashboard in this branch.")

        try:
            from django.core.exceptions import ValidationError
            try:
                # Try lookup by UUID first
                student = Student.objects.get(id=student_id)
            except (Student.DoesNotExist, ValidationError, ValueError):
                # Fallback to student_id code
                student = Student.objects.get(student_id=student_id)
            is_own = student.user == user
            is_parent = ParentStudent.objects.filter(parent__user=user, student=student).exists()
            
            # Check if user is a teacher of this student
            is_teacher = False
            try:
                from teachers.models import Teacher, TeacherAssignment
                teacher = Teacher.objects.get(user=user)
                # Check if teacher is assigned to this student's class/section
                is_teacher = TeacherAssignment.objects.filter(
                    teacher=teacher,
                    class_fk=student.grade,
                    section=student.section
                ).exists()
            except Teacher.DoesNotExist:
                pass

            if not (is_own or is_parent or is_teacher or user.is_staff):
                raise PermissionDenied("You do not have permission to view this student's assignment dashboard.")
        except Student.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Student not found',
                'status': 404,
                'data': {}
            }, status=status.HTTP_404_NOT_FOUND)

        today = timezone.now().date()
        due_soon_threshold = today + timezone.timedelta(days=5)

        is_submitted = Exists(StudentAssignments.objects.filter(
            assignment=OuterRef('id'),
            student=student
        ))
        all_assignments = Assignments.objects.filter(
            Q(students=student) | Q(section=student.section)
        ).select_related(
            'teacher_assignment', 'teacher_assignment__subject',
            'teacher_assignment__class_fk', 'teacher_assignment__section',
            'teacher_assignment__teacher', 'teacher_assignment__teacher__user'
        )

        completed = all_assignments.filter(is_submitted).order_by('-due_date')[:20]

        pending = all_assignments.filter(
            ~is_submitted,
            due_date__gte=today,
            due_date__lte=due_soon_threshold
        ).order_by('due_date')[:20]

        overdue = all_assignments.filter(
            ~is_submitted,
            due_date__lt=today
        ).order_by('-due_date')[:20]

        overdue_data = SimpleAssignmentsSerializer(overdue, many=True).data
        pending_data = SimpleAssignmentsSerializer(pending, many=True).data
        completed_data = SimpleAssignmentsSerializer(completed, many=True).data

        response_data = {
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': {
                'overdue': overdue_data,
                'pending': pending_data,
                'completed': completed_data
            }
        }
        return Response(response_data)

    @action(detail=False, methods=['get'], url_path='parent_subject_objectives/(?P<student_id>[^/.]+)/(?P<subject_id>[^/.]+)/?')
    def parent_subject_objectives(self, request, student_id=None, subject_id=None):
        """
        Get units and learning objectives for a specific subject for a student, from a parent perspective.
        """
        from academics.models import Subject
        from teachers.models import TeacherAssignment
        from schedule.models import ClassScheduleSlot
        from lessontopics.models import ObjectiveUnits, ObjectiveSubunits, ClassUnitProgress, ClassSubunitProgress, LearningObjectives

        try:
            student = Student.objects.get(id=student_id)
            subject = Subject.objects.get(id=subject_id)
        except (Student.DoesNotExist, Subject.DoesNotExist):
            return Response({'success': False, 'message': 'Student or Subject not found', 'status': 404}, status=404)

        # Permission check - allow parents, teachers of this student, staff, and the student themselves
        is_parent = ParentStudent.objects.filter(parent__user=request.user, student=student).exists()
        
        # Check if user is a teacher assigned to this student's class/section
        is_teacher = False
        try:
            from teachers.models import Teacher, TeacherAssignment
            teacher = Teacher.objects.get(user=request.user)
            is_teacher = TeacherAssignment.objects.filter(
                teacher=teacher,
                class_fk=student.grade,
                section=student.section
            ).exists()
        except Teacher.DoesNotExist:
            pass
        
        if not (is_parent or is_teacher or request.user.is_staff or student.user == request.user):
            raise PermissionDenied("You do not have permission to view objectives for this student.")

        class_obj = student.grade
        section_obj = student.section

        # Get units for this subject
        units = ObjectiveUnits.objects.filter(category__subject=subject).select_related('category')

        completed_units = []
        current_units = []
        upcoming_units = []

        total_objs = 0
        completed_objs = 0

        for unit in units:
            unit_prog = ClassUnitProgress.objects.filter(
                class_fk=class_obj, section=section_obj, subject=subject, unit=unit
            ).first()

            is_completed = unit_prog.is_completed if unit_prog else False
            is_current = unit_prog.is_current if unit_prog else False

            subunits = ObjectiveSubunits.objects.filter(unit=unit)
            subunits_data = []

            for sub in subunits:
                sub_prog = ClassSubunitProgress.objects.filter(
                    class_fk=class_obj, section=section_obj, subject=subject, subunit=sub
                ).first()
                sub_completed = sub_prog.is_completed if sub_prog else False

                subunits_data.append({
                    'id': str(sub.id),
                    'name': sub.name,
                    'is_completed': sub_completed
                })

            # Calculate objective counts for this unit
            unit_objectives = LearningObjectives.objects.filter(unit=unit)
            u_total = unit_objectives.count()
            # For student perspective, we equate unit completion to progress?
            # Or use explicit progress tracking if available. Using unit completion for now.
            u_completed = u_total if is_completed else 0

            total_objs += u_total
            completed_objs += u_completed

            unit_data = {
                'id': str(unit.id),
                'name': unit.name,
                'is_completed': is_completed,
                'is_current': is_current,
                'total_objectives': u_total,
                'completed_objectives': u_completed,
                'subunits': subunits_data
            }

            if is_completed:
                completed_units.append(unit_data)
            elif is_current:
                current_units.append(unit_data)
            else:
                upcoming_units.append(unit_data)

        # Get teacher details - Priority 1: TeacherAssignment
        teacher_assignment = TeacherAssignment.objects.filter(
            class_fk=class_obj, section=section_obj, subject=subject
        ).first()

        teacher_name = None
        if teacher_assignment and teacher_assignment.teacher:
            teacher_name = teacher_assignment.teacher.user.full_name if teacher_assignment.teacher.user else "Not assigned"

        # Priority 2: Fallback to ClassScheduleSlot if not found in assignment
        if not teacher_name:
            schedule_slot = ClassScheduleSlot.objects.filter(
                class_fk=class_obj, section=section_obj, subject=subject
            ).first()
            if schedule_slot and schedule_slot.teacher_assignment:
                teacher_assignment = schedule_slot.teacher_assignment
                teacher_name = teacher_assignment.teacher.user.full_name if teacher_assignment and teacher_assignment.teacher and teacher_assignment.teacher.user else "Not assigned"

        response_data = {
            'subject': {
                'name': subject.name,
                'teacher_name': teacher_name or "Not assigned",
                'completion_percentage': int((completed_objs / total_objs * 100)) if total_objs > 0 else 0,
                'completed_objectives': completed_objs,
                'total_objectives': total_objs
            },
            'class': {'grade': class_obj.grade if class_obj else 'N/A'},
            'summary': {
                'total_units': len(units),
                'completed_units': len(completed_units),
                'current_units': len(current_units),
                'upcoming_units': len(upcoming_units),
                'overall_completion': int((len(completed_units) / len(units) * 100)) if len(units) > 0 else 0
            },
            'current_units': current_units,
            'upcoming_units': upcoming_units,
            'past_units': completed_units
        }

        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': response_data
        })

    @action(detail=False, methods=['get'], url_path='teacher_subject_assignments/(?P<student_id>[^/.]+)/(?P<subject_id>[^/.]+)/?')
    def teacher_subject_assignments(self, request, student_id=None, subject_id=None):
        """
        Get assignments and submissions for a specific student and subject.
        Only accessible by teachers assigned to this student.
        Includes download links for submitted assignments.
        """
        from academics.models import Subject
        from lessontopics.models import Assignments, StudentAssignments
        from lessontopics.serializers import AssignmentsSerializer, StudentAssignmentsSerializer
        from django.db.models import Q
        from django.conf import settings
        from urllib.parse import urljoin

        try:
            student = Student.objects.get(id=student_id)
            subject = Subject.objects.get(id=subject_id)
        except (Student.DoesNotExist, Subject.DoesNotExist):
            return Response({'success': False, 'message': 'Student or Subject not found', 'status': 404}, status=404)

        # Verify the user is a teacher assigned to this student
        try:
            from teachers.models import Teacher, TeacherAssignment
            teacher = Teacher.objects.get(user=request.user)
            is_teacher = TeacherAssignment.objects.filter(
                teacher=teacher,
                class_fk=student.grade,
                section=student.section
            ).exists()
        except Teacher.DoesNotExist:
            is_teacher = False

        if not (is_teacher or request.user.is_staff):
            raise PermissionDenied("You do not have permission to view assignments for this student.")

        # Get assignments for this subject assigned to the student
        assignments = Assignments.objects.filter(
            Q(students=student) | Q(section=student.section) | Q(class_fk=student.grade),
            subject=subject
        ).distinct().order_by('-due_date')

        # Get submissions for these assignments
        submissions = StudentAssignments.objects.filter(
            student=student,
            assignment__in=assignments
        ).select_related('assignment')

        assignments_data = []
        for assignment in assignments:
            submission = submissions.filter(assignment=assignment).first()
            submission_data = None
            if submission:
                # Build download URL if file exists
                download_url = None
                if submission.file_submission:
                    # Assuming file_submission is a FileField
                    download_url = request.build_absolute_uri(submission.file_submission.url)
                
                submission_data = {
                    'id': str(submission.id),
                    'submitted': True,
                    'submitted_date': submission.submitted_date.isoformat() if submission.submitted_date else None,
                    'grade': submission.grade,
                    'feedback': submission.feedback,
                    'status': submission.status,
                    'download_url': download_url,
                    'text_submission': submission.text_submission,
                    'file_name': submission.file_submission.name if submission.file_submission else None,
                }
            else:
                submission_data = {
                    'id': None,
                    'submitted': False,
                    'submitted_date': None,
                    'grade': None,
                    'feedback': None,
                    'status': 'not_submitted',
                    'download_url': None,
                    'text_submission': None,
                    'file_name': None,
                }

            assignments_data.append({
                'id': str(assignment.id),
                'title': assignment.title,
                'description': assignment.description,
                'due_date': assignment.due_date.isoformat() if assignment.due_date else None,
                'max_score': assignment.max_score,
                'assignment_type': assignment.assignment_type,
                'submission': submission_data
            })

        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': {
                'student': {
                    'id': str(student.id),
                    'full_name': student.user.full_name if student.user else 'Unknown',
                    'grade': student.grade.grade if student.grade else 'N/A',
                    'section': student.section.name if student.section else 'N/A',
                },
                'subject': {
                    'id': str(subject.id),
                    'name': subject.name,
                },
                'assignments': assignments_data,
                'total_count': len(assignments_data),
                'submitted_count': sum(1 for a in assignments_data if a['submission']['submitted']),
                'pending_count': sum(1 for a in assignments_data if not a['submission']['submitted']),
            }
        })

    @action(detail=False, methods=['get'], url_path='available_teachers/(?P<student_id>[^/.]+)/?')
    def available_teachers(self, request, student_id=None):
        """
        Get all teachers available for a specific student based on their enrolled subjects.
        This endpoint is used by parents/admins to see which teachers they can message about a student.
        """
        from teachers.models import Teacher
        user = request.user
        branch_id = request.query_params.get('branch_id')

        if branch_id and not has_model_permission(user, 'parentstudent', 'view_parentstudent', branch_id):
            raise PermissionDenied("You do not have permission to view teachers for this student.")

        try:
            student = Student.objects.select_related('user', 'section').get(id=student_id)

            # Check permissions: allow students, parents, teachers, and admins
            is_own_profile = student.user == user
            is_parent = ParentStudent.objects.filter(parent__user=user, student=student).exists()
            is_teacher = Teacher.objects.filter(user=user).exists()
            is_admin = user.is_superuser or user.is_staff

            if not (is_own_profile or is_parent or is_teacher or is_admin):
                raise PermissionDenied("You do not have permission to view teachers for this student.")

        except Student.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Student not found',
                'status': 404,
                'data': {}
            }, status=status.HTTP_404_NOT_FOUND)

        # Get all subjects the student is enrolled in
        student_subjects = StudentSubject.objects.filter(
            student=student
        ).select_related('subject').values_list('subject', flat=True)

        # Get all teachers who teach this specific student's class and section
        from teachers.models import Teacher, TeacherAssignment
        from teachers.serializers import TeacherSerializer

        # We find teachers who are assigned to the student's specific class and section
        # OR who are assigned to a subject the student is specifically enrolled in
        teacher_ids = TeacherAssignment.objects.filter(
            Q(class_fk=student.grade, section=student.section) |
            Q(subject__in=student_subjects)
        ).values_list('teacher', flat=True).distinct()

        teachers = Teacher.objects.filter(
            id__in=teacher_ids
        ).select_related('user')

        # Serialize teacher data with their relevant subjects
        from academics.models import Subject

        teachers_data = []
        for teacher in teachers:
            # Find which subjects this teacher teaches this student
            # based on direct student_subjects OR class/section overlap
            teacher_cst = TeacherAssignment.objects.filter(teacher=teacher)
            cst_for_student = teacher_cst.filter(
                Q(subject__in=student_subjects) |
                (Q(class_fk=student.grade) & (Q(section=student.section) | Q(section__isnull=True) if hasattr(student, 'section') and student.section else Q()))
            )
            subj_ids = cst_for_student.values_list('subject', flat=True).distinct()
            teacher_subjects = Subject.objects.filter(id__in=subj_ids)

            if subj_ids.exists():
                teachers_data.append({
                    'user_id': teacher.user.id,
                    'teacher_id': teacher.id,
                    'full_name': teacher.user.full_name,
                    'email': teacher.user.email,
                    'phone': '',
                    'subject_details': [
                        {
                            'id': subj.id,
                            'name': subj.name,
                            'code': subj.code
                        } for subj in teacher_subjects if subj
                    ]
                })

        # Get available subjects for filtering
        # Collect all subject IDs from the teachers data we just built
        all_student_subject_ids = set()
        for t_data in teachers_data:
            for s_data in t_data['subject_details']:
                all_student_subject_ids.add(s_data['id'])

        available_subjects = Subject.objects.filter(
            id__in=all_student_subject_ids
        ).values('id', 'name', 'code')

        response_data = {
            'success': True,
            'message': 'Available teachers retrieved successfully',
            'status': 200,
            'data': {
                'teachers': teachers_data,
                'filters': {
                    'available_subjects': list(available_subjects)
                }
            }
        }
        return Response(response_data)

class HealthConditionsViewSet(viewsets.ModelViewSet):
    queryset = HealthConditions.objects.all()
    serializer_class = HealthConditionsSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        branch_id = self.request.query_params.get('branch_id')
        if branch_id and not has_model_permission(user, 'healthconditions', 'view', branch_id):
            raise PermissionDenied("No permission to view health conditions.")
        return self.queryset.all()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({'success': True, 'message': 'Health condition created', 'status': 201, 'data': serializer.data}, status=201)

    def perform_create(self, serializer):
        branch_id = self.request.data.get('branch_id')
        if branch_id and not has_model_permission(self.request.user, 'healthconditions', 'add', branch_id):
            raise PermissionDenied("No permission to create health conditions.")
        serializer.save()

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({'success': True, 'message': 'Health condition updated', 'status': 200, 'data': serializer.data})

    def perform_update(self, serializer):
        branch_id = self.request.data.get('branch_id')
        if branch_id and not has_model_permission(self.request.user, 'healthconditions', 'change', branch_id):
            raise PermissionDenied("No permission to update health conditions.")
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({'success': True, 'message': 'Health condition deleted', 'status': 204, 'data': []}, status=204)

    def perform_destroy(self, instance):
        branch_id = self.request.query_params.get('branch_id')
        if branch_id and not has_model_permission(self.request.user, 'healthconditions', 'delete', branch_id):
            raise PermissionDenied("No permission to delete health conditions.")
        instance.delete()

class StudentHealthRecordsViewSet(viewsets.ModelViewSet):
    queryset = StudentHealthRecords.objects.all()
    serializer_class = StudentHealthRecordsSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        branch_id = self.request.query_params.get('branch_id')
        if branch_id and not has_model_permission(user, 'studenthealthrecords', 'view', branch_id):
            raise PermissionDenied("No permission to view health records.")
        # For teachers, allow all records they have permission to view; for parents, restrict to their children
        if has_model_permission(user, 'studenthealthrecords', 'view_all', branch_id):
            return self.queryset.all()
        return self.queryset.filter(student_id__parent_links__parent__user=user)

    def create(self, request, *args, **kwargs):
        student_id = request.data.get('student_id')
        date = request.data.get('date')
        if not student_id or not date:
            return Response({
                'success': False,
                'message': 'student_id and date are required.',
                'status': 400,
                'data': []
            }, status=400)

        # Check if a record exists for this student and date
        existing_record = StudentHealthRecords.objects.filter(student=student, date=date).first()
        if existing_record:
            serializer = self.get_serializer(existing_record, data=request.data, partial=True)
        else:
            serializer = self.get_serializer(data=request.data)

        serializer.is_valid(raise_exception=True)
        self.perform_create_or_update(serializer, student_id)
        return Response({
            'success': True,
            'message': 'Health record created or updated',
            'status': 201 if not existing_record else 200,
            'data': serializer.data
        }, status=201 if not existing_record else 200)

    def perform_create_or_update(self, serializer, student_id):
        branch_id = self.request.data.get('branch_id')
        if branch_id and not has_model_permission(self.request.user, 'studenthealthrecords', 'add', branch_id):
            raise PermissionDenied("No permission to create health records.")

        # Fetch existing history if it exists
        existing_history = StudentHealthRecords.objects.filter(student=student).values_list('history', flat=True).first() or ""
        incident = serializer.validated_data.get('incident', '')
        if incident:
            # Append new incident to history if itâ€™s a new entry or update
            new_history = existing_history + (f"\nIncident on {serializer.validated_data['date']}: {incident}" if existing_history else f"Incident on {serializer.validated_data['date']}: {incident}")
            serializer.validated_data['history'] = new_history
            serializer.validated_data['incident'] = incident  # Keep incident for the current record
        serializer.save(recorded_by=self.request.user)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            'success': True,
            'message': 'Health record updated',
            'status': 200,
            'data': serializer.data
        })

    def perform_update(self, serializer):
        branch_id = self.request.data.get('branch_id')
        if branch_id and not has_model_permission(self.request.user, 'studenthealthrecords', 'change', branch_id):
            raise PermissionDenied("No permission to update health records.")
        # Append new incident to history if provided
        instance = serializer.instance
        incident = serializer.validated_data.get('incident', '')
        if incident and instance.incident != incident:
            existing_history = instance.history or ""
            new_history = existing_history + (f"\nIncident on {serializer.validated_data['date']}: {incident}" if existing_history else f"Incident on {serializer.validated_data['date']}: {incident}")
            serializer.validated_data['history'] = new_history
            serializer.validated_data['incident'] = incident
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({
            'success': True,
            'message': 'Health record deleted',
            'status': 204,
            'data': []
        }, status=204)

    def perform_destroy(self, instance):
        branch_id = self.request.query_params.get('branch_id')
        if branch_id and not has_model_permission(self.request.user, 'studenthealthrecords', 'delete', branch_id):
            raise PermissionDenied("No permission to delete health records.")
        instance.delete()

    @action(detail=False, methods=['get'], url_path='today_incidents')
    def today_incidents(self, request):
        user = self.request.user
        today = timezone.now().date()
        branch_id = self.request.query_params.get('branch_id')
        if branch_id and not has_model_permission(user, 'studenthealthrecords', 'view', branch_id):
            raise PermissionDenied("No permission to view health records.")

        # Filter for the parent's children and today's date
        queryset = self.get_queryset().filter(date=today)
        incidents = []
        for record in queryset:
            incidents.append({
                'date': record.date,
                'incident': record.incident or "No health incidents today",
                'condition': record.condition.name if record.condition else None
            })

        if not incidents:
            return Response({
                'success': True,
                'message': 'OK',
                'status': 200,
                'data': [{'date': today, 'incident': "No health incidents today", 'condition': None}]
            })

        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': incidents
        })

class BehaviorIncidentsViewSet(viewsets.ModelViewSet):
    queryset = BehaviorIncidents.objects.all()
    serializer_class = BehaviorIncidentsSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        branch_id = self.request.query_params.get('branch_id')

        # Superusers see all
        if user.is_superuser:
            return self.queryset.all()

        # Check if user is a teacher
        try:
            from teachers.models import Teacher
            teacher = Teacher.objects.get(user=user)
            # Teachers can see all behavior incidents (or filter by their students if needed)
            return self.queryset.all()
        except Teacher.DoesNotExist:
            pass

        # Check if user is admin/staff
        if user.is_staff:
            return self.queryset.all()

        # Parents see only their children's incidents
        if branch_id and not has_model_permission(user, 'behaviorincidents', 'view', branch_id):
            raise PermissionDenied("No permission to view behavior incidents.")
        return self.queryset.filter(student_id__parent_links__parent__user=user)

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
        serializer = self.get_serializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Validation error',
                'status': 400,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        try:
            self.perform_create(serializer)
        except Exception as e:
            return Response({
                'success': False,
                'message': 'An error occurred',
                'status': 500,
                'errors': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response({'success': True, 'message': 'Behavior incident created', 'status': 201, 'data': serializer.data}, status=201)

    def perform_create(self, serializer):
        user = self.request.user
        # Allow superusers, staff, and teachers to create behavior incidents
        if not (user.is_superuser or user.is_staff):
            # Check if user is a teacher
            from teachers.models import Teacher
            try:
                Teacher.objects.get(user=user)
            except Teacher.DoesNotExist:
                # Check branch permission for non-teachers
                branch_id = self.request.data.get('branch_id')
                if branch_id and not has_model_permission(user, 'behaviorincidents', 'add', branch_id):
                    raise PermissionDenied("No permission to create behavior incidents in this branch.")
        serializer.save()

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial, context={'request': request})
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({'success': True, 'message': 'Behavior incident updated', 'status': 200, 'data': serializer.data})

    def perform_update(self, serializer):
        user = self.request.user
        # Allow superusers, staff, and teachers to update behavior incidents
        if not (user.is_superuser or user.is_staff):
            from teachers.models import Teacher
            try:
                Teacher.objects.get(user=user)
            except Teacher.DoesNotExist:
                branch_id = self.request.data.get('branch_id')
                if branch_id and not has_model_permission(user, 'behaviorincidents', 'change', branch_id):
                    raise PermissionDenied("No permission to update behavior incidents in this branch.")
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({'success': True, 'message': 'Behavior incident deleted', 'status': 204, 'data': []}, status=204)

    def perform_destroy(self, instance):
        user = self.request.user
        # Allow superusers, staff, and teachers to delete behavior incidents
        if not (user.is_superuser or user.is_staff):
            from teachers.models import Teacher
            try:
                Teacher.objects.get(user=user)
            except Teacher.DoesNotExist:
                branch_id = self.request.query_params.get('branch_id')
                if branch_id and not has_model_permission(user, 'behaviorincidents', 'delete', branch_id):
                    raise PermissionDenied("No permission to delete behavior incidents in this branch.")
        instance.delete()

class BehaviorRatingsViewSet(viewsets.ModelViewSet):
    queryset = BehaviorRatings.objects.all()
    serializer_class = BehaviorRatingsSerializer
    permission_classes = [IsAuthenticated]


    def get_queryset(self):
        user = self.request.user
        branch_id = self.request.query_params.get('branch_id')

        # Superusers see all
        if user.is_superuser:
            return self.queryset.all()

        # Check if user is a teacher
        try:
            from teachers.models import Teacher
            teacher = Teacher.objects.get(user=user)
            # Teachers can see all behavior ratings (or filter by their students if needed)
            return self.queryset.all()
        except Teacher.DoesNotExist:
            pass

        # Check if user is admin/staff
        if user.is_staff:
            return self.queryset.all()

        # Parents see only their children's ratings
        if branch_id and not has_model_permission(user, 'behavratings', 'view', branch_id):
            raise PermissionDenied("No permission to view behavior ratings.")
        return self.queryset.filter(student_id__parent_links__parent__user=user)

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
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except serializers.ValidationError as e:
            return Response({
                'success': False,
                'message': 'Validation error',
                'status': 400,
                'errors': e.detail
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'success': False,
                'message': 'An error occurred',
                'status': 500,
                'errors': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        result = self.perform_create(serializer)
        if result is not None:
            return result
        return Response({'success': True, 'message': 'Behavior rating created', 'status': 201, 'data': serializer.data}, status=201)

    def perform_create(self, serializer):
        user = self.request.user
        branch_id = self.request.data.get('branch_id')
        try:
            # Allow superusers, staff, and teachers to create behavior ratings
            if not (user.is_superuser or user.is_staff):
                # Check if user is a teacher
                from teachers.models import Teacher
                try:
                    Teacher.objects.get(user=user)
                except Teacher.DoesNotExist:
                    # Check branch permission for non-teachers
                    if branch_id and not has_model_permission(user, 'behavratings', 'add', branch_id):
                        raise PermissionDenied("No permission to create behavior ratings in this branch.")
            serializer.save(rated_by=user)
        except Exception as e:
            return Response({
                'success': False,
                'message': 'An error occurred',
                'status': 500,
                'errors': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({'success': True, 'message': 'Behavior rating updated', 'status': 200, 'data': serializer.data})

    def perform_update(self, serializer):
        user = self.request.user
        branch_id = self.request.data.get('branch_id')
        # Allow superusers, staff, and teachers to update behavior ratings
        if not (user.is_superuser or user.is_staff):
            from teachers.models import Teacher
            try:
                Teacher.objects.get(user=user)
            except Teacher.DoesNotExist:
                if branch_id and not has_model_permission(user, 'behavratings', 'change', branch_id):
                    raise PermissionDenied("No permission to update behavior ratings.")
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({'success': True, 'message': 'Behavior rating deleted', 'status': 204, 'data': []}, status=204)

    def perform_destroy(self, instance):
        user = self.request.user
        branch_id = self.request.query_params.get('branch_id')
        # Allow superusers, staff, and teachers to delete behavior ratings
        if not (user.is_superuser or user.is_staff):
            from teachers.models import Teacher
            try:
                Teacher.objects.get(user=user)
            except Teacher.DoesNotExist:
                if branch_id and not has_model_permission(user, 'behavratings', 'delete', branch_id):
                    raise PermissionDenied("No permission to delete behavior ratings.")
        instance.delete()



