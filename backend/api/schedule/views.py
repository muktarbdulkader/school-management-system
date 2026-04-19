from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from .models import ClassScheduleSlot, LeaveRequest, SlotType, StudentScheduleOverride, Attendance, Exam, SubjectExamDay, Classroom
from .serializers import ClassScheduleSlotsSerializer, LeaveRequestSerializer, SlotTypeSerializer, StudentScheduleOverridesSerializer, AttendanceSerializer, ExamsSerializer, SubjectExamDaysSerializer, ClassroomSerializer
from users.models import has_model_permission, UserBranchAccess, UserRole
from students.models import ParentStudent, Student
from rest_framework.decorators import action
import logging
from django.db.models import Q
logger = logging.getLogger(__name__)

class ClassroomViewSet(viewsets.ModelViewSet):
    queryset = Classroom.objects.all()
    serializer_class = ClassroomSerializer
    permission_classes = [IsAuthenticated]

    def is_administrative_user(self, user):
        if user.is_superuser:
            return True
        user_roles = list(user.userrole_set.values_list('role__name', flat=True))
        admin_roles = ['admin', 'super_admin', 'superadmin', 'staff', 'head_admin', 'ceo']
        return any(role.lower() in admin_roles for role in user_roles)

    def get_queryset(self):
        user = self.request.user
        branch_id = self.request.query_params.get('branch_id')

        if user.is_superuser:
            if branch_id:
                return self.queryset.filter(branch_id=branch_id, is_active=True)
            return self.queryset.filter(is_active=True)

        if self.is_administrative_user(user):
            from users.models import UserBranchAccess
            accessible_branches = UserBranchAccess.objects.filter(user=user).values_list('branch_id', flat=True)
            if branch_id:
                return self.queryset.filter(branch_id=branch_id, is_active=True)
            return self.queryset.filter(branch_id__in=accessible_branches, is_active=True)

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
        if not (user.is_superuser or self.is_administrative_user(user)):
            raise PermissionDenied("Only administrative users can create classrooms.")
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            'success': True,
            'message': 'Classroom created successfully',
            'status': 201,
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        user = request.user
        if not (user.is_superuser or self.is_administrative_user(user)):
            raise PermissionDenied("Only administrative users can update classrooms.")
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            'success': True,
            'message': 'Classroom updated successfully',
            'status': 200,
            'data': serializer.data
        })


class SlotTypesViewSet(viewsets.ModelViewSet):
    queryset = SlotType.objects.all()
    serializer_class = SlotTypeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_superuser:
            raise PermissionDenied("Only superusers can view slot types.")
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
            raise PermissionDenied("Only superusers can create slot types.")

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            'success': True,
            'message': 'Slot type created successfully',
            'status': 201,
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        user = request.user
        if not user.is_superuser:
            raise PermissionDenied("Only superusers can update slot types.")

        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            'success': True,
            'message': 'Slot type updated successfully',
            'status': 200,
            'data': serializer.data
        })

    def destroy(self, request, *args, **kwargs):
        user = request.user
        if not user.is_superuser:
            raise PermissionDenied("Only superusers can delete slot types.")

        instance = self.get_object()
        instance.delete()
        return Response({
            'success': True,
            'message': 'Slot type deleted successfully',
            'status': 204,
            'data': {}
        }, status=status.HTTP_204_NO_CONTENT)


class StudentScheduleOverridesViewSet(viewsets.ModelViewSet):
    queryset = StudentScheduleOverride.objects.all()
    serializer_class = StudentScheduleOverridesSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        student_id = self.request.query_params.get('student_id')

        if not ParentStudent.objects.filter(parent__user=user, student_id=student_id).exists():
            raise PermissionDenied("You do not have permission to view this student's schedule overrides.")

        return self.queryset.filter(student_id=student_id)

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
        student_id = request.data.get('student_id')
        if not ParentStudent.objects.filter(parent__user=user, student_id=student_id).exists():
            raise PermissionDenied("You do not have permission to create schedule overrides for this student.")

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            'success': True,
            'message': 'Schedule override created successfully',
            'status': 201,
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        user = request.user
        instance = self.get_object()
        if not ParentStudent.objects.filter(parent__user=user, student_id=instance.student_id).exists():
            raise PermissionDenied("You do not have permission to update this student's schedule overrides.")

        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            'success': True,
            'message': 'Schedule override updated successfully',
            'status': 200,
            'data': serializer.data
        })

    def destroy(self, request, *args, **kwargs):
        user = request.user
        instance = self.get_object()
        if not ParentStudent.objects.filter(parent__user=user, student_id=instance.student_id).exists():
            raise PermissionDenied("You do not have permission to delete this student's schedule overrides.")

        instance.delete()
        return Response({
            'success': True,
            'message': 'Schedule override deleted successfully',
            'status': 204,
            'data': {}
        }, status=status.HTTP_204_NO_CONTENT)



class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
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

        # 1. Superusers see all
        if user.is_superuser:
            if branch_id:
                return self.queryset.filter(student_id__branch_id=branch_id)
            return self.queryset.all()

        # 2. Administrative User Check (Admin/Staff)
        if self.is_administrative_user(user):
            accessible_branches = UserBranchAccess.objects.filter(user=user).values_list('branch_id', flat=True)
            if branch_id:
                if branch_id in [str(b) for b in accessible_branches]:
                    return self.queryset.filter(student_id__branch_id=branch_id)
                return self.queryset.none()
            return self.queryset.filter(student_id__branch_id__in=accessible_branches)

        # 3. Parents see their children's attendance
        if student_id:
            if ParentStudent.objects.filter(parent__user=user, student_id=student_id).exists():
                return self.queryset.filter(student_id=student_id)
            raise PermissionDenied("You do not have permission to view this student's attendance.")

        # 4. Teachers see attendance for their subjects
        from teachers.models import Teacher
        teacher = Teacher.objects.filter(user=user).first()
        if teacher:
            from teachers.models import TeacherAssignment
            assignments = TeacherAssignment.objects.filter(teacher=teacher)
            q_objects = Q()
            for assignment in assignments:
                q_objects |= Q(student__grade=assignment.class_fk, student__section=assignment.section)
            return self.queryset.filter(q_objects).distinct()

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
        # Allow Teachers and Administrative users to take attendance
        from teachers.models import Teacher
        is_teacher = Teacher.objects.filter(user=user).exists()

        if not self.is_administrative_user(user) and not is_teacher:
            raise PermissionDenied("Only administrative users or teachers can create attendance records.")

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            'success': True,
            'message': 'Attendance record created successfully',
            'status': 201,
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        user = request.user
        from teachers.models import Teacher
        is_teacher = Teacher.objects.filter(user=user).exists()

        if not self.is_administrative_user(user) and not is_teacher:
            raise PermissionDenied("Only administrative users or teachers can update attendance records.")

        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            'success': True,
            'message': 'Attendance record updated successfully',
            'status': 200,
            'data': serializer.data
        })

    def destroy(self, request, *args, **kwargs):
        user = request.user
        if not self.is_administrative_user(user):
            raise PermissionDenied("Only administrative users can delete attendance records.")

        instance = self.get_object()
        instance.delete()
        return Response({
            'success': True,
            'message': 'Attendance record deleted successfully',
            'status': 204,
            'data': {}
        }, status=status.HTTP_204_NO_CONTENT)
    @action(detail=False, methods=['get'], url_path='daily_summary')
    def daily_summary(self, request):
        """Get attendance counts for today, grouped by Grade and Section, filtered by branch"""
        from django.utils import timezone
        from django.db.models import Count
        today = timezone.now().date()
        branch_id = request.query_params.get('branch_id')
        
        queryset = Attendance.objects.filter(date=today)
        
        # Filter by branch if user is branch-limited
        if not request.user.is_superuser:
            accessible_branches = list(UserBranchAccess.objects.filter(user=request.user).values_list('branch_id', flat=True))
            if branch_id:
                if branch_id in [str(b) for b in accessible_branches]:
                    queryset = queryset.filter(student_id__branch_id=branch_id)
                else:
                    return Response({'success': False, 'message': 'Unauthorized branch access'}, status=403)
            else:
                queryset = queryset.filter(student_id__branch_id__in=accessible_branches)
        elif branch_id:
            queryset = queryset.filter(student_id__branch_id=branch_id)

        # Detailed stats: group by Grade, Section, and Status
        detailed_stats = queryset.values(
            'student_id__grade__grade', 
            'student_id__section__name', 
            'status'
        ).annotate(count=Count('id'))

        # Overall summary for the dashboard cards
        overall_stats = queryset.values('status').annotate(count=Count('id'))
        summary = {status[0]: 0 for status in Attendance.STATUS_CHOICES}
        for s in overall_stats:
            summary[s['status']] = s['count']

        # Format detailed breakdown
        breakdown = {}
        for entry in detailed_stats:
            grade = entry['student_id__grade__grade'] or "Unassigned"
            section = entry['student_id__section__name'] or "Unassigned"
            status = entry['status']
            count = entry['count']

            if grade not in breakdown:
                breakdown[grade] = {}
            if section not in breakdown[grade]:
                breakdown[grade][section] = {s[0]: 0 for s in Attendance.STATUS_CHOICES}
            
            breakdown[grade][section][status] = count

        return Response({
            'success': True,
            'message': 'Daily attendance summary retrieved',
            'status': 200,
            'data': {
                'summary': summary,
                'breakdown': breakdown
            }
        })

class SubjectExamDaysViewSet(viewsets.ModelViewSet):
    queryset = SubjectExamDay.objects.all()
    serializer_class = SubjectExamDaysSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        student_id = self.request.query_params.get('student_id')

        # if not ParentStudent.objects.filter(parent__user=user, student_id=student_id).exists():
        #     raise PermissionDenied("You do not have permission to view this student's exam days.")

        return self.queryset.filter(subject_id__studentsubject__student_id=student_id)

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
        if not user.is_superuser and not is_teacher(user):
            raise PermissionDenied("Only teachers or superusers can create subject exam days.")

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            'success': True,
            'message': 'Subject exam day created successfully',
            'status': 201,
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        user = request.user
        if not user.is_superuser and not is_teacher(user):
            raise PermissionDenied("Only teachers or superusers can update subject exam days.")

        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            'success': True,
            'message': 'Subject exam day updated successfully',
            'status': 200,
            'data': serializer.data
        })

    def destroy(self, request, *args, **kwargs):
        user = request.user
        if not user.is_superuser and not is_teacher(user):
            raise PermissionDenied("Only teachers or superusers can delete subject exam days.")

        instance = self.get_object()
        instance.delete()
        return Response({
            'success': True,
            'message': 'Subject exam day deleted successfully',
            'status': 204,
            'data': {}
        }, status=status.HTTP_204_NO_CONTENT)

class ClassScheduleSlotsViewSet(viewsets.ModelViewSet):
    queryset = ClassScheduleSlot.objects.all()
    serializer_class = ClassScheduleSlotsSerializer
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
        student_id = self.request.query_params.get('student_id')
        
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"GET schedule slots - User: {user}, is_superuser: {user.is_superuser}, branch_id: {branch_id}")
        logger.info(f"Total slots in DB: {self.queryset.count()}")

        # Allow superusers to see all records
        if user.is_superuser:
            if branch_id:
                # Use class_fk__branch_id for filtering - Class model has branch_id field
                result = self.queryset.filter(class_fk__branch_id=branch_id).order_by('day_of_week', 'period_number')
                logger.info(f"Superuser with branch filter - returning {result.count()} slots")
                return result
            result = self.queryset.order_by('day_of_week', 'period_number')
            logger.info(f"Superuser without branch filter - returning {result.count()} slots")
            return result

        # Check if user is a student viewing their own schedule
        student = Student.objects.filter(user=user).first()
        if student:
            if student.grade and student.section:
                return self.queryset.filter(class_fk=student.grade, section=student.section).order_by('day_of_week', 'period_number')
            return self.queryset.none()

        # Check if user is a teacher
        from teachers.models import Teacher
        from teachers.models import TeacherAssignment
        teacher = Teacher.objects.filter(user=user).first()
        if teacher:
            assignments = TeacherAssignment.objects.filter(teacher=teacher)
            q_objects = Q()
            for assignment in assignments:
                q_objects |= Q(
                    class_fk=assignment.class_fk,
                    section=assignment.section,
                    subject=assignment.subject
                )
            if q_objects:
                return self.queryset.filter(q_objects).order_by('day_of_week', 'period_number').distinct()
            return self.queryset.none()

        # Check if user is a parent
        if student_id and ParentStudent.objects.filter(parent__user=user, student_id=student_id).exists():
            student = Student.objects.filter(id=student_id).first()
            if student and student.grade and student.section:
                return self.queryset.filter(class_fk=student.grade, section=student.section).order_by('day_of_week', 'period_number')
            return self.queryset.none()

        # Administrative User Check (Admin/Staff)
        if self.is_administrative_user(user):
            accessible_branches = UserBranchAccess.objects.filter(user=user).values_list('branch_id', flat=True)
            if branch_id:
                if branch_id in [str(b) for b in accessible_branches]:
                    return self.queryset.filter(class_fk__branch_id=branch_id).order_by('day_of_week', 'period_number')
                return self.queryset.none()
            return self.queryset.filter(class_fk__branch_id__in=accessible_branches).order_by('day_of_week', 'period_number')

        return self.queryset.none()

    def create(self, request, *args, **kwargs):
        user = request.user
        from teachers.models import Teacher
        from rest_framework import serializers
        is_teacher = Teacher.objects.filter(user=user).exists()

        if not self.is_administrative_user(user) and not is_teacher:
            raise PermissionDenied("Only administrative users or teachers can create schedule slots.")

        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            return Response({
                'success': True,
                'message': 'Schedule slot created successfully',
                'status': 201,
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        except serializers.ValidationError as e:
            return Response({
                'success': False,
                'message': 'Validation error',
                'status': 400,
                'errors': e.detail
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            import traceback
            print(f"Error creating schedule slot: {str(e)}")
            print(traceback.format_exc())
            return Response({
                'success': False,
                'message': f'Error: {str(e)}',
                'status': 500,
                'error_detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def update(self, request, *args, **kwargs):
        user = request.user
        from teachers.models import Teacher
        from rest_framework import serializers
        is_teacher = Teacher.objects.filter(user=user).exists()

        if not self.is_administrative_user(user) and not is_teacher:
            raise PermissionDenied("Only administrative users or teachers can update schedule slots.")

        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response({
                'success': True,
                'message': 'Schedule slot updated successfully',
                'status': 200,
                'data': serializer.data
            })
        except serializers.ValidationError as e:
            return Response({
                'success': False,
                'message': 'Validation error',
                'status': 400,
                'errors': e.detail
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            import traceback
            print(f"Error updating schedule slot: {str(e)}")
            print(traceback.format_exc())
            return Response({
                'success': False,
                'message': f'Error: {str(e)}',
                'status': 500,
                'error_detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], url_path='validate')
    def validate_schedule(self, request):
        """Validate a schedule slot for conflicts without saving"""
        user = request.user
        if not self.is_administrative_user(user):
            raise PermissionDenied("Only administrative users can validate schedule slots.")

        data = request.data

        # Get term_id for the new schedule
        term_id = data.get('term')

        # Create a temporary instance for validation
        slot = ClassScheduleSlot(
            class_fk_id=data.get('class_id'),
            section_id=data.get('section_id'),
            subject_id=data.get('subject_id'),
            teacher_assignment_id=data.get('teacher_id'),
            day_of_week=data.get('day_of_week'),
            period_number=data.get('period_number'),
            start_time=data.get('start_time'),
            end_time=data.get('end_time'),
            classroom_id=data.get('classroom_id'),
            slot_type_id=data.get('slot_type'),
            term_id=term_id,
        )

        conflicts = []

        # Helper function to check if a slot is in a closed term
        def is_in_closed_term(slot_obj):
            if not slot_obj.term:
                return False
            return slot_obj.term.status == 'closed'

        # Check teacher conflicts (exclude closed terms)
        if slot.teacher_assignment_id:
            teacher_conflicts = ClassScheduleSlot.objects.filter(
                teacher_assignment_id=slot.teacher_assignment_id,
                day_of_week=slot.day_of_week,
                start_time__lt=slot.end_time,
                end_time__gt=slot.start_time
            ).exclude(term__status='closed')  # Exclude closed terms

            # Also exclude same term (for updates)
            if slot.term_id:
                teacher_conflicts = teacher_conflicts.exclude(term_id=slot.term_id)

            if teacher_conflicts.exists():
                conflicts.append({
                    'type': 'teacher',
                    'message': f"Teacher already assigned to another slot at this time",
                    'conflicting_slots': [
                        {'id': str(c.id), 'class': c.class_fk.grade, 'section': c.section.name if c.section else None}
                        for c in teacher_conflicts[:5]
                    ]
                })

        # Check section conflicts (exclude closed terms)
        section_conflicts = ClassScheduleSlot.objects.filter(
            class_fk=slot.class_fk,
            section=slot.section,
            day_of_week=slot.day_of_week,
            start_time__lt=slot.end_time,
            end_time__gt=slot.start_time
        ).exclude(term__status='closed')  # Exclude closed terms

        # Also exclude same term (for updates)
        if slot.term_id:
            section_conflicts = section_conflicts.exclude(term_id=slot.term_id)

        if section_conflicts.exists():
            conflicts.append({
                'type': 'section',
                'message': f"Section already has a class scheduled at this time",
                'conflicting_slots': [
                    {'id': str(c.id), 'subject': c.subject.name if c.subject else None}
                    for c in section_conflicts[:5]
                ]
            })

        # Check classroom conflicts (if classroom is specified, exclude closed terms)
        if slot.classroom:
            classroom_conflicts = ClassScheduleSlot.objects.filter(
                classroom=slot.classroom,
                day_of_week=slot.day_of_week,
                start_time__lt=slot.end_time,
                end_time__gt=slot.start_time
            ).exclude(term__status='closed')  # Exclude closed terms

            # Also exclude same term (for updates)
            if slot.term_id:
                classroom_conflicts = classroom_conflicts.exclude(term_id=slot.term_id)

            if classroom_conflicts.exists():
                conflicts.append({
                    'type': 'classroom',
                    'message': f"Classroom is already booked at this time",
                    'conflicting_slots': [
                        {'id': str(c.id), 'class': c.class_fk.grade, 'teacher': c.teacher_assignment.teacher.user.full_name if c.teacher_assignment and c.teacher_assignment.teacher else None}
                        for c in classroom_conflicts[:5]
                    ]
                })

        # Check against academic calendar
        if slot.class_fk and slot.class_fk.branch:
            from .models import AcademicCalendar
            calendar_events = AcademicCalendar.objects.filter(
                branch=slot.class_fk.branch,
                date__week_day=self._get_weekday_number(slot.day_of_week),
                affects_schedule=True
            )
            if calendar_events.exists():
                conflicts.append({
                    'type': 'calendar',
                    'message': f"This day has academic events that may affect scheduling",
                    'events': [
                        {'title': e.title, 'type': e.event_type}
                        for e in calendar_events[:3]
                    ]
                })

        is_valid = len(conflicts) == 0

        return Response({
            'success': True,
            'valid': is_valid,
            'conflicts': conflicts,
            'message': 'No conflicts found' if is_valid else f"Found {len(conflicts)} conflict(s)"
        })

    def _get_weekday_number(self, day_name):
        """Convert day name to Python weekday number (0=Monday)"""
        days = {
            'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3,
            'Friday': 4, 'Saturday': 5, 'Sunday': 6
        }
        return days.get(day_name, 0)

    def destroy(self, request, *args, **kwargs):
        user = request.user
        if not self.is_administrative_user(user):
            raise PermissionDenied("Only administrative users can delete schedule slots.")

        instance = self.get_object()
        instance.delete()
        return Response({
            'success': True,
            'message': 'Schedule slot deleted successfully',
            'status': 204,
            'data': {}
        }, status=status.HTTP_204_NO_CONTENT)

class StudentScheduleOverridesViewSet(viewsets.ModelViewSet):
    queryset = StudentScheduleOverride.objects.all()
    serializer_class = StudentScheduleOverridesSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        student_id = self.request.query_params.get('student_id')

        if user.is_superuser:
            return self.queryset.all()

        if not student_id:
            raise PermissionDenied("student_id is required to view schedule overrides.")

        if not ParentStudent.objects.filter(parent__user=user, student_id=student_id).exists():
            raise PermissionDenied("You do not have permission to view this student's schedule overrides.")

        return self.queryset.filter(student_id=student_id)

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
        student_id = request.data.get('student_id')
        if not user.is_superuser:
            raise PermissionDenied("You do not have permission to create schedule overrides for this student.")
        logger.info(f"Received request data: {request.data}")
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            'success': True,
            'message': 'Schedule override created successfully',
            'status': 201,
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        user = request.user
        instance = self.get_object()
        if not user.is_superuser:
            raise PermissionDenied("You do not have permission to update this student's schedule overrides.")

        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            'success': True,
            'message': 'Schedule override updated successfully',
            'status': 200,
            'data': serializer.data
        })

    def destroy(self, request, *args, **kwargs):
        user = request.user
        instance = self.get_object()
        if not user.is_superuser:
            raise PermissionDenied("You do not have permission to delete this student's schedule overrides.")

        instance.delete()
        return Response({
            'success': True,
            'message': 'Schedule override deleted successfully',
            'status': 204,
            'data': {}
        }, status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'], url_path='student_schedule/(?P<student_id>[^/]+)')
    def student_schedule(self, request, student_id=None):
        try:
            student = Student.objects.get(id=student_id)
            user = request.user

            if not user.is_superuser and not ParentStudent.objects.filter(parent__user=user, student_id=student_id).exists():
                raise PermissionDenied("You do not have permission to view this student's schedule.")

            slots = ClassScheduleSlot.objects.filter(
                class_id=student.grade_id,
                section_id=student.section_id
            ).order_by('period_number')

            # Fetch overrides with debugging
            overrides = StudentScheduleOverride.objects.filter(student_id=student_id)
            print(f"Overrides fetched: {list(overrides.values('id', 'period_number', 'day_of_week', 'subject_id'))}")  # Debug overrides

            schedule = {}
            for slot in slots:
                period_key = slot.period_number
                base_subject = slot.subject_id.name if slot.subject_id else slot.slot_type.name
                schedule[period_key] = {
                    'period_number': period_key,
                    'day_of_week': slot.day_of_week,
                    'start_time': slot.start_time.strftime('%H:%M:%S'),
                    'end_time': slot.end_time.strftime('%H:%M:%S'),
                    'subject': base_subject,
                    'teacher': slot.teacher_id.teacher_id.user.full_name if slot.teacher_id else None,
                }

            # Apply overrides with additional matching
            for override in overrides:
                if override.period_number is not None and override.day_of_week is not None:  # Skip if null
                    for period_key, slot_data in schedule.items():
                        if (period_key == override.period_number and 
                            slot_data['day_of_week'] == override.day_of_week):
                            logger.debug(f"Applying override for period {override.period_number}, day {override.day_of_week}: {override.subject_id.name}")
                            slot_data['subject'] = override.subject_id.name
                            if override.teacher_id:
                                slot_data['teacher'] = override.teacher_id.teacher_id.user.full_name

            # Convert to list and sort by period_number
            schedule_list = [schedule[period] for period in sorted(schedule.keys())]

            return Response({
                'success': True,
                'message': 'Student schedule retrieved successfully',
                'status': 200,
                'data': schedule_list
            })
        except Student.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Student not found',
                'status': 404,
                'data': {}
            }, status=status.HTTP_404_NOT_FOUND)
        except PermissionDenied as e:
            return Response({
                'success': False,
                'message': str(e),
                'status': 403,
                'data': {}
            }, status=status.HTTP_403_FORBIDDEN)

class LeaveRequestViewSet(viewsets.ModelViewSet):
    queryset = LeaveRequest.objects.all()
    serializer_class = LeaveRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        branch_id = self.request.query_params.get('branch_id')

        # Superusers and Staff can see all leave requests
        if user.is_superuser or user.is_staff:
            return self.queryset.all()

        # Check if user is a student
        try:
            from students.models import Student
            student = Student.objects.filter(user=user).first()
            if student:
                # Students can see their own leave requests
                return self.queryset.filter(student_id=student.id)
        except:
            pass

        # Check if user is a parent
        parent_students = ParentStudent.objects.filter(parent__user=user).values_list('student_id', flat=True)
        if parent_students.exists():
            # Parents can see their children's leave requests
            return self.queryset.filter(student_id__in=parent_students)

        # Check if user is a teacher with permission
        if has_model_permission(user, 'attendance', 'view_attendance', branch_id):
            # Teachers can see all leave requests in their branch
            if branch_id:
                return self.queryset.filter(student_id__branch_id=branch_id)
            else:
                accessible_branches = UserBranchAccess.objects.filter(user=user).values_list('branch_id', flat=True)
                if accessible_branches:
                    return self.queryset.filter(student_id__branch_id__in=accessible_branches)

        # If no permission found, return empty queryset
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
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            'success': True,
            'message': 'Leave request submitted successfully',
            'status': 201,
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        user = self.request.user
        student_id = self.request.data.get('student_id')

        # Only students can create their own leave requests
        try:
            from students.models import Student
            student = Student.objects.filter(user=user).first()
            if student and str(student.id) == str(student_id):
                # Student creating their own leave request
                serializer.save(requested_by=user)
                return
        except:
            pass

        # Parents cannot create leave requests - removed this functionality
        # Only admins/staff with proper permissions can create on behalf of students

        # Check branch permission for admin users
        branch_id = self.request.data.get('branch_id')
        if user.is_staff or user.is_superuser:
            serializer.save(requested_by=user)
            return

        if branch_id and has_model_permission(user, 'attendance', 'add_attendance', branch_id):
            serializer.save(requested_by=user)
            return

        raise PermissionDenied("Only students can create their own leave requests. Parents cannot submit leave requests.")

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
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        if instance.requested_by != self.request.user:
            raise PermissionDenied("You can only update your own leave requests.")
        if instance.status not in ['pending', 'rejected']:  # Allow updates only for pending or rejected requests
            raise PermissionDenied("Only pending or rejected leave requests can be updated.")
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            'success': True,
            'message': 'Leave request updated successfully',
            'status': 200,
            'data': serializer.data
        })

    def perform_update(self, serializer):
        branch_id = self.request.data.get('branch_id')
        if branch_id and not has_model_permission(self.request.user, 'attendance', 'change_attendance', branch_id):
            raise PermissionDenied("You do not have permission to update leave requests in this branch.")
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.requested_by != self.request.user:
            raise PermissionDenied("You can only delete your own leave requests.")
        if instance.status not in ['pending', 'rejected']:  # Allow deletion only for pending or rejected requests
            raise PermissionDenied("Only pending or rejected leave requests can be deleted.")
        self.perform_destroy(instance)
        return Response({
            'success': True,
            'message': 'Leave request deleted successfully',
            'status': 204,
            'data': {}
        }, status=status.HTTP_204_NO_CONTENT)

    def perform_destroy(self, instance):
        branch_id = self.request.query_params.get('branch_id')
        if branch_id and not has_model_permission(self.request.user, 'attendance', 'delete_attendance', branch_id):
            raise PermissionDenied("You do not have permission to delete leave requests in this branch.")
        instance.delete()

    @action(detail=True, methods=['post'], url_path='cancel_leave_request')
    def cancel_leave_request(self, request, pk=None):
        leave_request = self.get_object()
        if leave_request.requested_by != self.request.user:
            raise PermissionDenied("You can only cancel your own leave requests.")
        if leave_request.status != 'pending':
            return Response({
                'success': False,
                'message': 'Only pending leave requests can be canceled.',
                'status': 400,
                'data': []
            }, status=status.HTTP_400_BAD_REQUEST)

        leave_request.status = 'canceled'
        leave_request.save()
        serializer = self.get_serializer(leave_request)
        return Response({
            'success': True,
            'message': 'Leave request canceled successfully',
            'status': 200,
            'data': serializer.data
        })

    @action(detail=False, methods=['get'], url_path='archived')
    def archived(self, request):
        user = self.request.user
        branch_id = self.request.query_params.get('branch_id')

        # Superusers can see all archived leave requests
        if user.is_superuser:
            queryset = self.queryset.filter(status__in=['canceled', 'rejected'])
        else:
            # Check if user is a student
            try:
                from students.models import Student
                student = Student.objects.filter(user=user).first()
                if student:
                    queryset = self.queryset.filter(
                        student_id=student.id,
                        status__in=['canceled', 'rejected']
                    )
                else:
                    # For parents and teachers
                    queryset = self.queryset.filter(
                        requested_by=user,
                        status__in=['canceled', 'rejected']
                    )
            except:
                queryset = self.queryset.filter(
                    requested_by=user,
                    status__in=['canceled', 'rejected']
                )

        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        })

    @action(detail=False, methods=['get'], url_path='pending_leaves')
    def pending_leaves(self, request):
        """Endpoint for teachers to view all pending leave requests"""
        user = self.request.user
        branch_id = self.request.query_params.get('branch_id')

        # Check if user has permission to view leave requests
        if not user.is_superuser and not user.is_staff and not has_model_permission(user, 'attendance', 'view_attendance', branch_id):
            raise PermissionDenied("You do not have permission to view pending leave requests.")

        # Get pending leave requests
        if user.is_superuser:
            queryset = self.queryset.filter(status='pending')
        elif branch_id:
            queryset = self.queryset.filter(status='pending', student_id__branch_id=branch_id)
        else:
            accessible_branches = UserBranchAccess.objects.filter(user=user).values_list('branch_id', flat=True)
            if accessible_branches:
                queryset = self.queryset.filter(status='pending', student_id__branch_id__in=accessible_branches)
            else:
                queryset = self.queryset.none()

        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        })

    @action(detail=False, methods=['get'], url_path='student_leaves/(?P<student_id>[^/]+)')
    def student_leaves(self, request, student_id=None):
        """Endpoint for teachers to view a specific student's leave history"""
        user = self.request.user

        # Check if user has permission
        if not user.is_superuser and not user.is_staff and not has_model_permission(user, 'attendance', 'view_attendance'):
            raise PermissionDenied("You do not have permission to view student leave history.")

        queryset = self.queryset.filter(student_id=student_id).order_by('-created_at')
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        })

    @action(detail=True, methods=['post'], url_path='reject_leave')
    def reject_leave(self, request, pk=None):
        """Endpoint for teachers to reject leave requests"""
        leave_request = self.get_object()
        user = self.request.user
        if not user.is_superuser and not user.is_staff and not has_model_permission(user, 'attendance', 'change_attendance'):
            raise PermissionDenied("Only teachers can reject leave requests.")

        if leave_request.status != 'pending':
            return Response({
                'success': False,
                'message': 'Only pending leave requests can be rejected.',
                'status': 400,
                'data': []
            }, status=status.HTTP_400_BAD_REQUEST)

        leave_request.status = 'rejected'
        leave_request.save()

        serializer = self.get_serializer(leave_request)
        return Response({
            'success': True,
            'message': 'Leave request rejected successfully',
            'status': 200,
            'data': serializer.data
        })
    @action(detail=True, methods=['patch'], url_path='approve_leave')
    def approve_leave(self, request, pk=None):
        leave_request = self.get_object()
        user = self.request.user
        if not user.is_superuser and not user.is_staff and not has_model_permission(user, 'attendance', 'change_attendance'):
            raise PermissionDenied("Only teachers can approve leave requests.")

        if leave_request.status != 'pending':
            return Response({
                'success': False,
                'message': 'Only pending leave requests can be approved.',
                'status': 400,
                'data': []
            }, status=status.HTTP_400_BAD_REQUEST)

        new_status = request.data.get('status')
        if new_status not in ['approved', 'rejected']:
            return Response({
                'success': False,
                'message': 'Status must be "approved" or "rejected".',
                'status': 400,
                'data': []
            }, status=status.HTTP_400_BAD_REQUEST)

        leave_request.status = new_status
        leave_request.save()

        # Optionally update related Attendance if it exists (future integration)
        if new_status == 'approved':
            try:
                attendance = Attendance.objects.get(student_id=leave_request.student_id, date=leave_request.date, subject_id=leave_request.subject_id)
                attendance.status = 'Excused'
                attendance.save()
            except Attendance.DoesNotExist:
                pass  # Attendance not yet created, will be handled when taken

        serializer = self.get_serializer(leave_request)
        return Response({
            'success': True,
            'message': f'Leave request {new_status} successfully',
            'status': 200,
            'data': serializer.data
        })

class ExamsViewSet(viewsets.ModelViewSet):
    queryset = Exam.objects.all()
    serializer_class = ExamsSerializer
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
        class_id = self.request.query_params.get('class_id') or self.request.query_params.get('grade_id')
        section_id = self.request.query_params.get('section_id')
        subject_id = self.request.query_params.get('subject_id')

        # Use select_related to properly load related objects
        base_queryset = self.queryset.select_related('subject', 'term', 'class_fk', 'section', 'branch')

        if user.is_superuser:
            queryset = base_queryset.all()
        else:
            # Check if user is a teacher - allow them to see exams for their assigned classes
            from teachers.models import Teacher
            from teachers.models import TeacherAssignment
            teacher = Teacher.objects.filter(user=user).first()
            
            if teacher:
                # Get teacher's class-subject assignments
                assignments = TeacherAssignment.objects.filter(teacher=teacher, is_active=True)
                q_objects = Q()
                for assignment in assignments:
                    if assignment.section:
                        # Teacher assigned to specific section
                        q_objects |= Q(
                            class_fk=assignment.class_fk,
                            section=assignment.section,
                            subject=assignment.subject
                        )
                    else:
                        # Teacher assigned to ALL sections of this class
                        q_objects |= Q(
                            class_fk=assignment.class_fk,
                            subject=assignment.subject
                        )
                if q_objects:
                    queryset = base_queryset.filter(q_objects).distinct()
                    print(f"[ExamsViewSet] Teacher {teacher.teacher_id} found {queryset.count()} exams from {assignments.count()} assignments")
                else:
                    print(f"[ExamsViewSet] Teacher {teacher.teacher_id} has no valid assignments")
                    queryset = base_queryset.none()
            elif student_id:
                if not ParentStudent.objects.filter(parent__user=user, student_id=student_id).exists():
                    raise PermissionDenied("You do not have permission to view this student's exams.")
                student = Student.objects.get(id=student_id)
                queryset = base_queryset.filter(class_fk=student.grade, section=student.section)
            else:
                queryset = base_queryset
                if branch_id:
                    if not has_model_permission(user, 'exams', 'view_exams', branch_id):
                        raise PermissionDenied("You do not have permission to view exams in this branch.")
                    queryset = queryset.filter(branch_id=branch_id)
                else:
                    accessible_branches = UserBranchAccess.objects.filter(user=user).values_list('branch_id', flat=True)
                    if not accessible_branches:
                        raise PermissionDenied("You do not have access to any branches.")
                    queryset = queryset.filter(branch_id__in=accessible_branches)

        # Apply additional filters
        if class_id:
            queryset = queryset.filter(class_fk_id=class_id)
        if section_id:
            queryset = queryset.filter(section_id=section_id)
        if subject_id:
            queryset = queryset.filter(subject_id=subject_id)

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

    def create(self, request, *args, **kwargs):
        user = request.user
        if not self.is_administrative_user(user) and not is_teacher(user):
            raise PermissionDenied("Only administrative users or teachers can create exams.")

        # Branch validation for non-superusers
        if not user.is_superuser:
            branch_id = request.data.get('branch_id') or request.data.get('branch')
            if not branch_id:
                # Teachers might have a primary branch
                from teachers.models import Teacher
                teacher = Teacher.objects.filter(user=user).first()
                if teacher and teacher.branch:
                    branch_id = teacher.branch.id
                else:
                    raise PermissionDenied("Branch ID is required.")

            from users.models import UserBranchAccess
            from teachers.models import Teacher
            
            # Check if user has branch access OR is a teacher assigned to this branch
            has_branch_access = UserBranchAccess.objects.filter(user=user, branch_id=branch_id).exists()
            
            teacher = Teacher.objects.filter(user=user).first()
            is_teacher_for_branch = teacher and teacher.branch and str(teacher.branch.id) == str(branch_id)
            
            if not has_branch_access and not is_teacher_for_branch:
                print(f"[ExamsViewSet] Access denied: User {user.email} has no access to branch {branch_id}")
                print(f"  - Has UserBranchAccess: {has_branch_access}")
                print(f"  - Is teacher for branch: {is_teacher_for_branch}")
                if teacher:
                    print(f"  - Teacher branch: {teacher.branch_id if teacher.branch else 'None'}")
                raise PermissionDenied("You do not have permission to create exams in this branch.")

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            'success': True,
            'message': 'Exam created successfully',
            'status': 201,
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        user = request.user
        if not self.is_administrative_user(user) and not is_teacher(user):

            raise PermissionDenied("Only administrative users or teachers can update exams.")

        instance = self.get_object()
        # Branch validation for non-superusers
        if not user.is_superuser:
            from users.models import UserBranchAccess
            from teachers.models import Teacher
            
            has_branch_access = UserBranchAccess.objects.filter(user=user, branch_id=instance.branch_id).exists()
            teacher = Teacher.objects.filter(user=user).first()
            is_teacher_for_branch = teacher and teacher.branch and str(teacher.branch.id) == str(instance.branch_id)
            
            if not has_branch_access and not is_teacher_for_branch:
                raise PermissionDenied("You do not have permission to update exams in this branch.")

        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            'success': True,
            'message': 'Exam updated successfully',
            'status': 200,
            'data': serializer.data
        })

    def destroy(self, request, *args, **kwargs):
        user = request.user
        if not self.is_administrative_user(user) and not is_teacher(user):
            raise PermissionDenied("Only administrative users or teachers can delete exams.")

        instance = self.get_object()
        # Branch validation for non-superusers
        if not user.is_superuser:
            from users.models import UserBranchAccess
            from teachers.models import Teacher
            
            has_branch_access = UserBranchAccess.objects.filter(user=user, branch_id=instance.branch_id).exists()
            teacher = Teacher.objects.filter(user=user).first()
            is_teacher_for_branch = teacher and teacher.branch and str(teacher.branch.id) == str(instance.branch_id)
            
            if not has_branch_access and not is_teacher_for_branch:
                raise PermissionDenied("You do not have permission to delete exams in this branch.")

        instance.delete()
        return Response({
            'success': True,
            'message': 'Exam deleted successfully',
            'status': 204,
            'data': {}
        }, status=status.HTTP_204_NO_CONTENT)

class SubjectExamDaysViewSet(viewsets.ModelViewSet):
    queryset = SubjectExamDay.objects.all()
    serializer_class = SubjectExamDaysSerializer
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

        if user.is_superuser:
            return self.queryset.all()

        if not ParentStudent.objects.filter(parent__user=user, student_id=student_id).exists():
            raise PermissionDenied("You do not have permission to view this student's exam days.")

        return self.queryset.filter(subject_id__studentsubject__student_id=student_id)

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
        if not user.is_superuser and not is_teacher(user):
            raise PermissionDenied("Only teachers or superusers can create subject exam days.")

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            'success': True,
            'message': 'Subject exam day created successfully',
            'status': 201,
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        user = request.user
        if not user.is_superuser and not is_teacher(user):
            raise PermissionDenied("Only teachers or superusers can update subject exam days.")

        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            'success': True,
            'message': 'Subject exam day updated successfully',
            'status': 200,
            'data': serializer.data
        })

    def destroy(self, request, *args, **kwargs):
        user = request.user
        if not user.is_superuser and not is_teacher(user):
            raise PermissionDenied("Only teachers or superusers can delete subject exam days.")

        instance = self.get_object()
        instance.delete()
        return Response({
            'success': True,
            'message': 'Subject exam day deleted successfully',
            'status': 204,
            'data': {}
        }, status=status.HTTP_204_NO_CONTENT)

def is_teacher(user):
    """Check if user has teacher role"""
    return UserRole.objects.filter(user=user, role__name__iexact='teacher').exists()

def is_parent(user):
    """Check if user has parent role"""
    return UserRole.objects.filter(user=user, role__name__iexact='parent').exists()

def is_student(user):
    """Check if user has student role"""
    return UserRole.objects.filter(user=user, role__name__iexact='student').exists()