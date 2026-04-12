from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from .models import Teacher, TeacherTask, TeacherPerformanceRating, TeacherMetrics, TeacherPerformanceReport, TeacherAssignment
from .serializers import (
    TeacherPerformanceRatingSerializer, TeacherSerializer, teacherTaskSerializer,
    TeacherMetricsSerializer, TeacherPerformanceReportSerializer, TeacherRegistrationSerializer,
    TeacherAssignmentSerializer
)
from django.utils import timezone
from users.models import UserBranchAccess, has_model_permission
from rest_framework.decorators import action

class TeacherViewSet(viewsets.ModelViewSet):
    queryset = Teacher.objects.all()
    serializer_class = TeacherSerializer
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
        queryset = self.queryset

        # 1. Access Filtering
        if user.is_superuser:
            if branch_id:
                return queryset.filter(branch=branch_id)
            return queryset.all()

        elif self.is_administrative_user(user) or hasattr(user, 'teacher_profile'):
            from users.models import UserBranchAccess
            accessible_branches = list(UserBranchAccess.objects.filter(user=user).values_list('branch_id', flat=True))

            from django.db.models import Q

            # If admin has no branch access records, they can see all teachers
            if not accessible_branches:
                if branch_id:
                    try:
                        import uuid
                        uuid.UUID(branch_id)
                        return queryset.filter(branch_id=branch_id)
                    except (ValueError, TypeError):
                        return queryset.none()
                return queryset.all()

            # For Teachers/Admins with branch access:
            # 1. Teachers assigned to branches this user has access to
            # 2. ALSO include teachers with NO branch assignment yet (so Admins/Superadmins can find/manage them)
            teacher_filter = Q(branch__in=accessible_branches) | \
                            Q(user__userbranchaccess__branch_id__in=accessible_branches) | \
                            Q(branch__isnull=True, user__userbranchaccess__isnull=True)

            if branch_id:
                try:
                    import uuid
                    if uuid.UUID(branch_id) in accessible_branches:
                        # Use the specific requested branch - NO "unassigned" filter here since branch is specified
                        return queryset.filter(Q(branch=branch_id) | Q(user__userbranchaccess__branch_id=branch_id)).distinct()
                    return queryset.none()
                except (ValueError, TypeError):
                    return queryset.none()
            else:
                # Listing all - include unassigned so they can be assigned
                return queryset.filter(teacher_filter).distinct()

        # 2. Student/Parent View (Contextual)
        # Students see only their teachers
        try:
            from students.models import Student
            student = Student.objects.filter(user=user).first()
            if student:
                from teachers.models import TeacherAssignment
                from django.db.models import Q
                
                # Broad lookup: Teachers assigned to the student's grade or specific section
                # or assigned via a specific subject if that's how it's linked
                teacher_query = Q(class_fk=student.grade)
                if student.section:
                    teacher_query |= Q(section=student.section)
                
                teacher_ids = TeacherAssignment.objects.filter(teacher_query).values_list('teacher', flat=True).distinct()
                return queryset.filter(id__in=teacher_ids)
        except Exception:
            pass

        # Parents see only teachers who teach their children
        try:
            from students.models import ParentStudent, Student
            parent_students = Student.objects.filter(parent_links__parent__user=user)
            if parent_students.exists():
                from teachers.models import TeacherAssignment
                from django.db.models import Q
                
                grade_ids = parent_students.values_list('grade_id', flat=True)
                section_ids = parent_students.values_list('section_id', flat=True)
                
                teacher_query = Q(class_fk__in=grade_ids) | Q(section__in=section_ids)
                teacher_ids = TeacherAssignment.objects.filter(teacher_query).values_list('teacher', flat=True).distinct()
                return queryset.filter(id__in=teacher_ids)
        except Exception:
            pass

        # 3. Teacher View
        # (Combined with administrative check above)

        return queryset.none()

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
        if branch_id and not has_model_permission(self.request.user, 'teacher', 'add_teacher', branch_id):
            raise PermissionDenied("You do not have permission to create teachers in this branch.")
        serializer.save()

    def create(self, request, *args, **kwargs):
        user_id = request.data.get('user')
        if user_id:
            existing_teacher = Teacher.objects.filter(user_id=user_id).first()
            if existing_teacher:
                serializer = self.get_serializer(existing_teacher, data=request.data)
                serializer.is_valid(raise_exception=True)

                # Verify permissions
                branch_id = request.data.get('branch_id')
                if branch_id and not has_model_permission(request.user, 'teacher', 'add_teacher', branch_id):
                    raise PermissionDenied("You do not have permission to create teachers in this branch.")

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

    @action(detail=False, methods=['post'], url_path='register')
    def register(self, request):
        """Custom endpoint to register a new teacher with user account"""
        # Check permission
        branch_id = request.data.get('branch_id')
        if branch_id and not has_model_permission(request.user, 'teacher', 'add_teacher', branch_id):
            raise PermissionDenied("You do not have permission to create teachers in this branch.")

        serializer = TeacherRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        teacher = serializer.save()

        # Return teacher data with nested details
        response_serializer = TeacherSerializer(teacher, context={'request': request})
        return Response({
            'success': True,
            'message': 'Teacher registered successfully',
            'status': 201,
            'data': response_serializer.data
        }, status=201)

    def perform_update(self, serializer):
        branch_id = self.request.data.get('branch_id')
        if branch_id and not has_model_permission(self.request.user, 'teacher', 'change_teacher', branch_id=branch_id):
            raise PermissionDenied("You do not have permission to update teachers.")
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
        branch_id = self.request.data.get('branch_id')
        if branch_id and not has_model_permission(self.request.user, 'teacher', 'delete_teacher', branch_id=branch_id):
            raise PermissionDenied("You do not have permission to delete teachers.")
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

    @action(detail=False, methods=['get'], url_path='overview_dashboard')
    def overview_dashboard(self, request):
        """
        Get overview dashboard data for the current teacher showing their classes,
        students, and assignments.
        """
        user = request.user

        print(f"[TeacherDashboard] User: {user.email} requesting overview dashboard")

        try:
            teacher = Teacher.objects.get(user=user)
            print(f"[TeacherDashboard] Found teacher: {teacher.user.full_name} (ID: {teacher.id})")
        except Teacher.DoesNotExist:
            print(f"[TeacherDashboard] No teacher profile found for user: {user.email}")
            # Return empty data instead of error
            return Response({
                'success': True,
                'message': 'No teaching assignments found. Please contact admin to create your teacher profile.',
                'status': 200,
                'data': {
                    'summary': {
                        'total_classes': 0,
                        'active_students': 0,
                        'assignments_due': 0
                    },
                    'subjects': []
                }
            })

        # Get all classes/subjects the teacher teaches
        from teachers.models import TeacherAssignment
        from students.models import StudentSubject
        from academics.models import Class, Section, Subject
        from lessontopics.models import Assignments
        from django.db.models import Count

        try:
            teacher_subjects = TeacherAssignment.objects.filter(
                teacher=teacher,
                subject__isnull=False
            ).select_related('class_fk', 'section', 'subject').distinct()

            print(f"[TeacherDashboard] Found {teacher_subjects.count()} TeacherAssignment assignments")

            # Build subjects list with class and section info
            subjects_data = []
            total_students = 0

            for ts in teacher_subjects:
                # Count students in this class/section taking this subject
                student_filter = {
                    'subject': ts.subject
                }

                # Add student model filters
                from students.models import Student
                students_in_class = Student.objects.filter(
                    grade=ts.class_fk
                )

                if ts.section:
                    students_in_class = students_in_class.filter(section=ts.section)

                # Get students enrolled in this subject
                student_count = StudentSubject.objects.filter(
                    subject=ts.subject,
                    student__in=students_in_class
                ).count()

                total_students += student_count

                subject_info = {
                    'id': str(ts.subject.id),
                    'name': ts.subject.name,
                    'code': ts.subject.code if hasattr(ts.subject, 'code') else '',
                    'class_id': str(ts.class_fk.id),
                    'branch_id': str(ts.class_fk.branch.id) if ts.class_fk.branch else None,
                    'class_name': ts.class_fk.grade,
                    'class_section': f"{ts.class_fk.grade} - {ts.section.name if ts.section else 'All'}",
                    'section_id': str(ts.section.id) if ts.section else None,
                    'section_name': ts.section.name if ts.section else None,
                    'student_count': student_count
                }
                subjects_data.append(subject_info)
                print(f"[TeacherDashboard] Subject: {subject_info['name']} - Class: {subject_info['class_name']} - Section: {subject_info['section_name']} - Students: {student_count}")

            # Count pending assignments
            today = timezone.now().date()
            assignments_due = Assignments.objects.filter(
                subject_id__in=[ts.subject for ts in teacher_subjects if ts.subject],
                due_date__gte=today
            ).count()

            print(f"[TeacherDashboard] Summary - Classes: {len(subjects_data)}, Students: {total_students}, Assignments Due: {assignments_due}")

            response_data = {
                'success': True,
                'message': 'OK' if len(subjects_data) > 0 else 'No teaching assignments found. Please contact admin to assign classes.',
                'status': 200,
                'data': {
                    'summary': {
                        'total_classes': len(subjects_data),
                        'active_students': total_students,
                        'assignments_due': assignments_due
                    },
                    'subjects': subjects_data,
                    'teacher_id': str(teacher.id),
                    'full_name': teacher.user.full_name
                }
            }
            return Response(response_data)

        except Exception as e:
            import traceback
            print(f"[TeacherDashboard] Error: {str(e)}")
            print(f"[TeacherDashboard] Traceback: {traceback.format_exc()}")
            return Response({
                'success': False,
                'message': f'Error fetching overview: {str(e)}',
                'status': 500,
                'data': {'error': str(e), 'traceback': traceback.format_exc()}
            }, status=500)

    @action(detail=False, methods=['get'], url_path='my_students')
    def my_students(self, request):
        """
        Get all students that this teacher teaches.
        """
        user = request.user

        try:
            teacher = Teacher.objects.get(user=user)
        except Teacher.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Teacher profile not found',
                'status': 404,
                'data': []
            }, status=404)

        from teachers.models import TeacherAssignment
        from students.models import Student

        try:
            # Get all classes/subjects the teacher teaches
            teacher_assignments = TeacherAssignment.objects.filter(
                teacher=teacher,
                subject__isnull=False
            ).select_related('class_fk', 'section', 'subject')

            # Collect all unique students
            students_dict = {}

            for assignment in teacher_assignments:
                # Get students in this class/section
                students = Student.objects.filter(
                    grade=assignment.class_fk
                ).select_related('user', 'grade', 'section')

                if assignment.section:
                    students = students.filter(section=assignment.section)

                for student in students:
                    if student.id not in students_dict:
                        students_dict[student.id] = {
                            'student_id': str(student.id),
                            'name': student.user.full_name,
                            'email': student.user.email,
                            'class': student.grade.grade if student.grade else None,
                            'section': student.section.name if student.section else None,
                            'avatar': None,
                        }

            students_list = list(students_dict.values())

            return Response({
                'success': True,
                'message': 'OK',
                'status': 200,
                'data': students_list
            })

        except Exception as e:
            import traceback
            return Response({
                'success': False,
                'message': f'Error fetching students: {str(e)}',
                'status': 500,
                'data': {'error': str(e), 'traceback': traceback.format_exc()}
            }, status=500)

    @action(detail=False, methods=['get'], url_path='student_behavior_ratings/(?P<student_id>[^/.]+)')
    def student_behavior_ratings(self, request, student_id=None):
        """
        Get behavior ratings for a specific student.
        """
        from students.models import BehaviorRatings, Student

        try:
            student = Student.objects.get(id=student_id)
        except Student.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Student not found',
                'status': 404,
                'data': []
            }, status=404)

        ratings = BehaviorRatings.objects.filter(
            student_id=student
        ).select_related('rated_by').order_by('-rated_on')

        ratings_data = []
        urgent_count = 0
        total_rating_sum = 0

        for rating in ratings:
            r_val = rating.rating or 0
            is_urgent = getattr(rating, 'priority', '').lower() == 'urgent'
            if is_urgent:
                urgent_count += 1
            total_rating_sum += r_val

            ratings_data.append({
                'id': str(rating.id),
                'category': rating.category,
                'rating': r_val,
                'notes': rating.notes,
                'rated_on': str(rating.rated_on),
                'rated_by': rating.rated_by.full_name if rating.rated_by else 'Unknown',
                'priority': getattr(rating, 'priority', None)
            })

        avg_rating = round(total_rating_sum / len(ratings_data), 2) if ratings_data else 0

        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': {
                'student': {
                    'id': str(student.id),
                    'full_name': student.user.full_name,
                },
                'statistics': {
                    'total_ratings': len(ratings_data),
                    'average_rating': avg_rating,
                    'urgent_ratings_count': urgent_count
                },
                'ratings': ratings_data
            }
        })

    @action(detail=False, methods=['get'], url_path='class_dashboard/(?P<class_fk>[^/.]+)/(?P<section_id>[^/.]+)/(?P<subject>[^/.]+)/?')
    def class_dashboard(self, request, class_fk=None, section_id=None, subject=None):
        """
        Get detailed dashboard for a specific class/section/subject combination.
        """
        user = request.user

        try:
            teacher = Teacher.objects.get(user=user)
        except Teacher.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Teacher profile not found',
                'status': 404,
                'data': {}
            }, status=404)

        from academics.models import Class, Section, Subject
        from students.models import StudentSubject
        from schedule.models import Attendance
        from students.models import Student
        from lessontopics.models import Assignments
        from django.db.models import Count, Q, Avg

        try:
            class_obj = Class.objects.get(id=class_fk)
            section_obj = Section.objects.get(id=section_id) if section_id != 'null' else None
            subject_obj = Subject.objects.get(id=subject)
        except (Class.DoesNotExist, Section.DoesNotExist, Subject.DoesNotExist):
            return Response({
                'success': False,
                'message': 'Class, section, or subject not found',
                'status': 404,
                'data': {}
            }, status=404)

        # Get students in this class/section
        students = Student.objects.filter(
            grade=class_obj
        ).select_related('user')

        if section_obj:
            students = students.filter(section=section_obj)

        total_students = students.count()

        # Get today's attendance
        today = timezone.now().date()
        attendance_records = Attendance.objects.filter(
            student_id__in=students,
            date=today
        )

        # Calculate attendance stats
        present_count = attendance_records.filter(status='present').count()
        late_count = attendance_records.filter(status='late').count()
        absent_count = attendance_records.filter(status='absent').count()
        attendance_rate = (present_count / total_students * 100) if total_students > 0 else 0

        # Build student list with attendance
        students_list = []
        for student in students:
            attendance = attendance_records.filter(student_id=student).first()
            students_list.append({
                'id': str(student.id),
                'student_id': student.student_id,
                'name': student.user.full_name,
                'email': student.user.email,
                'attendance_status': attendance.status if attendance else 'not_marked',
                'attendance_date': str(attendance.date) if attendance else None
            })

        # Get assignments for this subject
        assignments = Assignments.objects.filter(
            subject=subject_obj
        ).order_by('-due_date')[:5]

        assignments_data = []
        for assignment in assignments:
            assignments_data.append({
                'id': str(assignment.id),
                'title': assignment.title,
                'due_date': str(assignment.due_date),
                'status': 'active' if assignment.due_date >= today else 'past_due'
            })

        # Summary cards data
        summary_cards = [
            {
                'title': 'Total Students',
                'value': str(total_students),
                'change': None,
                'change_positive': None
            },
            {
                'title': 'Attendance Rate',
                'value': f'{attendance_rate:.1f}%',
                'change': None,
                'change_positive': None
            },
            {
                'title': 'Present Today',
                'value': str(present_count),
                'change': None,
                'change_positive': None
            },
            {
                'title': 'Absent Today',
                'value': str(absent_count),
                'change': None,
                'change_positive': None
            }
        ]

        response_data = {
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': {
                'header': {
                    'class_name': class_obj.grade,
                    'section_name': section_obj.name if section_obj else None,
                    'subject_name': subject_obj.name,
                    'date': str(today),
                    'schedule': f'{class_obj.grade} - {subject_obj.name}'
                },
                'summary_cards': summary_cards,
                'students': {
                    'list': students_list,
                    'stats': {
                        'total': total_students,
                        'present': present_count,
                        'late': late_count,
                        'absent': absent_count,
                        'attendance_rate': attendance_rate
                    }
                },
                'assignments': assignments_data,
                'behavior_notes': [],  # TODO: Implement behavior notes
                'class': {
                    'id': str(class_obj.id),
                    'name': class_obj.grade,
                    'branch_id': str(class_obj.branch.id) if class_obj.branch else None
                },
                'section': {
                    'id': str(section_obj.id) if section_obj else None,
                    'name': section_obj.name if section_obj else None
                },
                'subject': {
                    'id': str(subject_obj.id),
                    'name': subject_obj.name
                },
                'total_students': total_students
            }
        }
        return Response(response_data)

    @action(detail=False, methods=['get'], url_path='attendance_dashboard/(?P<class_id>[^/.]+)/(?P<section_id>[^/.]+)/(?P<subject_id>[^/.]+)/?')
    def attendance_dashboard(self, request, class_id=None, section_id=None, subject_id=None):
        """
        """
        from students.models import Student
        from schedule.models import Attendance
        from academics.models import Class, Section, Subject
        from datetime import date

        try:
            teacher = Teacher.objects.get(user=request.user)
        except Teacher.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Teacher profile not found',
                'status': 404,
                'data': {}
            }, status=404)

        # Get the date from query params or use today
        attendance_date = request.query_params.get('date', str(date.today()))

        try:
            class_obj = Class.objects.get(id=class_id)
            section_obj = Section.objects.get(id=section_id) if section_id and section_id != 'null' else None
            subject_obj = Subject.objects.get(id=subject_id)
        except (Class.DoesNotExist, Section.DoesNotExist, Subject.DoesNotExist) as e:
            return Response({
                'success': False,
                'message': f'Invalid class, section, or subject: {str(e)}',
                'status': 404,
                'data': {}
            }, status=404)

        # Get students in this class/section
        students_query = Student.objects.filter(grade=class_obj)
        if section_obj:
            students_query = students_query.filter(section=section_obj)

        students_data = []
        for student in students_query:
            # Check if attendance already marked for today
            attendance_record = Attendance.objects.filter(
                student=student,
                date=attendance_date,
                schedule_slot__subject=subject_obj
            ).first()

            students_data.append({
                'id': str(student.id),
                'student_id': student.student_id,
                'name': student.user.full_name if student.user else 'Unknown',
                'full_name': student.user.full_name if student.user else 'Unknown',
                'avatar': None,  # Add avatar URL if available
                'status': attendance_record.status.lower() if attendance_record else None,
                'comment': '', # attendance_record.comment if attendance_record else '', # Field not in model yet
                'attendance_comment': '', # Field not in model yet
            })

        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': {
                'students': students_data,
                'class_name': class_obj.grade,
                'section_name': section_obj.name if section_obj else 'All',
                'subject_name': subject_obj.name,
                'date': attendance_date
            }
        })

    @action(detail=False, methods=['post'], url_path='mark_attendance/(?P<class_id>[^/.]+)/(?P<section_id>[^/.]+)/(?P<subject_id>[^/.]+)/?')
    def mark_attendance(self, request, class_id=None, section_id=None, subject_id=None):
        """
        Mark attendance for individual students.
        Expects: { "attendance": [{"student_id": "...", "status": "Present|Late|Absent|Excused|No permission", "comment": "..."}], "date": "YYYY-MM-DD" }
        """
        from students.models import Student
        from schedule.models import Attendance
        from academics.models import Class, Section, Subject
        from datetime import date

        print(f"[MarkAttendance] Received request data: {request.data}")
        print(f"[MarkAttendance] Params - Class: {class_id}, Section: {section_id}, Subject: {subject_id}")

        try:
            teacher = Teacher.objects.get(user=request.user)
        except Teacher.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Teacher profile not found',
                'status': 404,
                'data': {}
            }, status=404)

        attendance_data = request.data.get('attendance', [])
        attendance_date = request.data.get('date', str(date.today()))

        if not attendance_data:
            return Response({
                'success': False,
                'message': 'No attendance data provided',
                'status': 400,
                'data': {}
            }, status=400)

        try:
            class_obj = Class.objects.get(id=class_id)
            section_obj = Section.objects.get(id=section_id) if section_id and section_id != 'null' else None
            subject_obj = Subject.objects.get(id=subject_id)
        except (Class.DoesNotExist, Section.DoesNotExist, Subject.DoesNotExist) as e:
            return Response({
                'success': False,
                'message': f'Invalid class, section, or subject: {str(e)}',
                'status': 404,
                'data': {}
            }, status=404)

        from django.db import transaction
        from schedule.models import ClassScheduleSlot
        marked_count = 0
        try:
            with transaction.atomic():
                # Find schedule slot for this class/section/subject
                schedule_slot = ClassScheduleSlot.objects.filter(
                    class_fk=class_obj,
                    section=section_obj,
                    subject=subject_obj
                ).first()
                
                for record in attendance_data:
                    student_id = record.get('student_id')
                    status = record.get('status', 'Absent').capitalize()
                    # comment = record.get('comment', '') # Field not in model yet

                    try:
                        student = Student.objects.get(id=student_id)

                        # Update or create attendance record
                        defaults = {
                            'status': status,
                            # 'comment': comment, # Field not in model yet
                            # 'marked_by': request.user # Field not in model yet
                        }
                        if schedule_slot:
                            defaults['schedule_slot'] = schedule_slot
                            # Also set teacher_assignment from schedule slot if available
                            if schedule_slot.teacher_assignment:
                                defaults['teacher_assignment'] = schedule_slot.teacher_assignment
                        
                        Attendance.objects.update_or_create(
                            student=student,
                            date=attendance_date,
                            defaults=defaults
                        )
                        marked_count += 1
                    except Student.DoesNotExist:
                        print(f"[MarkAttendance] Student {student_id} not found")
                        continue
        except Exception as e:
            print(f"[MarkAttendance] Transaction failed: {str(e)}")
            return Response({
                'success': False,
                'message': f'Database error: {str(e)}',
                'status': 500,
                'data': {}
            }, status=500)

        return Response({
            'success': True,
            'message': f'Attendance marked for {marked_count} student(s)',
            'status': 200,
            'data': {'marked_count': marked_count}
        })

    @action(detail=False, methods=['post'], url_path='bulk_mark_attendance/(?P<class_id>[^/.]+)/(?P<section_id>[^/.]+)/(?P<subject_id>[^/.]+)/?')
    def bulk_mark_attendance(self, request, class_id=None, section_id=None, subject_id=None):
        """
        Mark attendance for all students in a class/section with the same status.
        Expects: { "status": "Present|Late|Absent|Excused|No permission", "date": "YYYY-MM-DD" }
        """
        from students.models import Student
        from schedule.models import Attendance
        from academics.models import Class, Section, Subject
        from datetime import date

        try:
            teacher = Teacher.objects.get(user=request.user)
        except Teacher.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Teacher profile not found',
                'status': 404,
                'data': {}
            }, status=404)

        status = request.data.get('status', 'Absent')
        attendance_date = request.data.get('date', str(date.today()))

        try:
            class_obj = Class.objects.get(id=class_id)
            section_obj = Section.objects.get(id=section_id) if section_id and section_id != 'null' else None
            subject_obj = Subject.objects.get(id=subject_id)
        except (Class.DoesNotExist, Section.DoesNotExist, Subject.DoesNotExist) as e:
            return Response({
                'success': False,
                'message': f'Invalid class, section, or subject: {str(e)}',
                'status': 404,
                'data': {}
            }, status=404)

        # Get all students in this class/section
        students_query = Student.objects.filter(grade=class_obj)
        if section_obj:
            students_query = students_query.filter(section=section_obj)

        from schedule.models import ClassScheduleSlot
        schedule_slot = ClassScheduleSlot.objects.filter(
            class_fk=class_obj,
            section=section_obj,
            subject=subject_obj
        ).first()

        marked_count = 0
        for student in students_query:
            defaults = {
                'status': status.capitalize() if status else 'Absent',
                # 'comment': '',
                # 'marked_by': request.user
            }
            if schedule_slot:
                defaults['schedule_slot'] = schedule_slot
                # Also set teacher_assignment from schedule slot if available
                if schedule_slot.teacher_assignment:
                    defaults['teacher_assignment'] = schedule_slot.teacher_assignment
            
            Attendance.objects.update_or_create(
                student=student,
                date=attendance_date,
                defaults=defaults
            )
            marked_count += 1

        return Response({
            'success': True,
            'message': f'Bulk attendance marked for {marked_count} student(s)',
            'status': 200,
            'data': {'marked_count': marked_count}
        })

    @action(detail=False, methods=['get'], url_path='class_assessments/(?P<class_id>[^/.]+)/(?P<section_id>[^/.]+)/(?P<subject_id>[^/.]+)/?')
    def class_assessments(self, request, class_id=None, section_id=None, subject_id=None):
        """
        Get all assessments/exams for a specific class/section/subject.
        """
        user = request.user

        try:
            teacher = Teacher.objects.get(user=user)
        except Teacher.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Teacher profile not found',
                'status': 404,
                'data': []
            }, status=404)

        from schedule.models import Exam
        from lessontopics.models import ExamResults
        from academics.models import Class, Section, Subject
        from students.models import Student
        from django.db.models import Avg, Count, Q

        try:
            class_obj = Class.objects.get(id=class_id)
            section_obj = Section.objects.get(id=section_id) if section_id and section_id != 'null' else None
            subject_obj = Subject.objects.get(id=subject_id)
        except (Class.DoesNotExist, Section.DoesNotExist, Subject.DoesNotExist) as e:
            return Response({
                'success': False,
                'message': f'Invalid class, section, or subject: {str(e)}',
                'status': 404,
                'data': []
            }, status=404)

        # Get all exams for this class/section/subject
        exams_query = Exam.objects.filter(
            class_fk=class_obj,
            subject=subject_obj
        )

        if section_obj:
            exams_query = exams_query.filter(section=section_obj)

        exams_query = exams_query.order_by('-start_date')

        # Get students in this class/section
        students = Student.objects.filter(grade=class_obj)
        if section_obj:
            students = students.filter(section=section_obj)
        total_students = students.count()

        assessments_data = []
        for exam in exams_query:
            # Get exam results for this exam
            results = ExamResults.objects.filter(exam=exam)

            # Calculate statistics
            total_submitted = results.count()
            avg_score = results.aggregate(Avg('score'))['score__avg'] or 0
            max_possible = results.first().max_score if results.exists() else 100

            # Calculate pass rate (assuming 50% is passing)
            passing_threshold = max_possible * 0.5
            passed = results.filter(score__gte=passing_threshold).count()
            pass_rate = (passed / total_submitted * 100) if total_submitted > 0 else 0

            assessments_data.append({
                'id': str(exam.id),
                'name': exam.name,
                'exam_type': exam.exam_type,
                'exam_type_display': exam.get_exam_type_display() if hasattr(exam, 'get_exam_type_display') else exam.exam_type,
                'start_date': str(exam.start_date),
                'end_date': str(exam.end_date),
                'description': exam.description or '',
                'total_students': total_students,
                'submitted': total_submitted,
                'pending': total_students - total_submitted,
                'average_score': round(avg_score, 2),
                'max_score': max_possible,
                'pass_rate': round(pass_rate, 2),
                'status': 'completed' if exam.end_date < timezone.now().date() else 'active'
            })

        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': {
                'assessments': assessments_data,
                'summary': {
                    'total_assessments': len(assessments_data),
                    'total_students': total_students
                }
            }
        })

class TeacherTaskViewSet(viewsets.ModelViewSet):
    queryset = TeacherTask.objects.all()
    serializer_class = teacherTaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = self.queryset

        if not user.is_superuser:
            try:
                teacher = Teacher.objects.get(user=user)
                queryset = queryset.filter(teacher=teacher)
            except Teacher.DoesNotExist:
                return queryset.none()

        teacher_id = self.request.query_params.get('teacher_id')
        if teacher_id:
            queryset = queryset.filter(teacher_id=teacher_id)

        return queryset.order_by('-date')

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({'success': True, 'message': 'OK', 'status': 200, 'data': serializer.data})

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({'success': True, 'message': 'Task created', 'status': 201, 'data': serializer.data}, status=201)

    @action(detail=True, methods=['post'], url_path='complete')
    def complete_task(self, request, pk=None):
        task = self.get_object()
        task.status = 'completed'
        task.completion_time = timezone.now()
        task.save()
        return Response({'success': True, 'message': 'Task completed', 'status': 200, 'data': self.get_serializer(task).data})


class TeacherPerformanceRatingViewSet(viewsets.ModelViewSet):
    queryset = TeacherPerformanceRating.objects.all()
    serializer_class = TeacherPerformanceRatingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = self.queryset
        teacher_id = self.request.query_params.get('teacher')
        if teacher_id:
            queryset = queryset.filter(teacher_id=teacher_id)
        return queryset.order_by('-rating_date')

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({'success': True, 'message': 'OK', 'status': 200, 'data': serializer.data})

    def create(self, request, *args, **kwargs):
        user = request.user

        # Check if user is a teacher - teachers cannot rate
        try:
            teacher_profile = Teacher.objects.filter(user=user).first()
            if teacher_profile:
                return Response({
                    'success': False,
                    'message': 'Teachers cannot rate other teachers or themselves',
                    'status': 403
                }, status=403)
        except:
            pass

        # Check if user is an admin, student or parent
        from students.models import Student, ParentStudent

        is_admin = user.is_staff or user.is_superuser
        is_student = Student.objects.filter(user=user).exists()
        is_parent = ParentStudent.objects.filter(parent__user=user).exists()

        if not (is_admin or is_student or is_parent):
            return Response({
                'success': False,
                'message': 'Only admins, students and parents can rate teachers',
                'status': 403
            }, status=403)

        # Extract Teacher ID if possible (from root or bulk list)
        teacher_id = request.data.get('teacher')
        ratings_list = request.data.get('ratings', [])

        if not teacher_id and ratings_list and isinstance(ratings_list, list) and len(ratings_list) > 0:
            teacher_id = ratings_list[0].get('teacher')

        # Always resolve teacher_id to a valid teacher object
        teacher = None
        if teacher_id:
            try:
                import uuid
                try:
                    # Try lookup by UUID first
                    uuid_val = uuid.UUID(teacher_id)
                    teacher = Teacher.objects.get(id=uuid_val)
                except (ValueError, TypeError):
                    # Fallback to teacher_id code (e.g., TCH-2026-XXXX)
                    teacher = Teacher.objects.get(teacher_id=teacher_id)
            except Teacher.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'Teacher not found',
                    'status': 404
                }, status=404)

        # Admins can rate any teacher, but students/parents have restrictions
        if not is_admin:
            # If student, verify they are enrolled in a subject taught by this teacher
            if not teacher:
                return Response({
                    'success': False,
                    'message': 'Teacher ID is required (either at root or inside ratings list)',
                    'status': 400
                }, status=400)

            # Verify student/parent has connection to this teacher
            if is_student:
                student = Student.objects.get(user=user)
                from students.models import StudentSubject
                from teachers.models import TeacherAssignment

                # Get student's enrolled subjects
                student_subjects = StudentSubject.objects.filter(
                    student=student
                ).values_list('subject', flat=True)

                # Check if teacher teaches any of these subjects
                teacher_teaches_student = TeacherAssignment.objects.filter(
                    teacher=teacher,
                    subject__in=student_subjects
                ).exists()

                if not teacher_teaches_student:
                    return Response({
                        'success': False,
                        'message': 'You can only rate teachers who teach your subjects',
                        'status': 403
                    }, status=403)

            elif is_parent:
                # Get parent's children
                parent_students = ParentStudent.objects.filter(
                    parent__user=user
                ).values_list('student_id', flat=True)

                from students.models import StudentSubject
                from teachers.models import TeacherAssignment

                # Get all subjects taught to parent's children
                children_subjects = StudentSubject.objects.filter(
                    student__in=parent_students
                ).values_list('subject', flat=True)

                # Check if teacher teaches any of these subjects
                teacher_teaches_children = TeacherAssignment.objects.filter(
                    teacher=teacher,
                    subject__in=children_subjects
                ).exists()

                if not teacher_teaches_children:
                    return Response({
                        'success': False,
                        'message': 'You can only rate teachers who teach your children',
                        'status': 403
                    }, status=403)

        # Process ratings (individual or bulk)
        if not ratings_list:
            if not teacher:
                return Response({'success': False, 'message': 'Teacher ID or ratings list required', 'status': 400}, status=400)
            ratings_list = [request.data]

        results = []
        errors = []

        try:
            for item in ratings_list:
                # Ensure teacher is set in the item (using resolved UUID if available)
                if teacher:
                    item['teacher'] = str(teacher.id)
                elif 'teacher' not in item and teacher_id:
                    item['teacher'] = teacher_id

                serializer = self.get_serializer(data=item)
                if serializer.is_valid():
                    serializer.save(rated_by=request.user)
                    results.append(serializer.data)
                else:
                    errors.append({'item': item.get('category', 'unknown'), 'errors': serializer.errors})

            if not results and errors:
                return Response({
                    'success': False,
                    'message': 'Failed to submit ratings',
                    'errors': errors,
                    'status': 400
                }, status=400)

            return Response({
                'success': True, 
                'message': f'Successfully submitted {len(results)} ratings', 
                'status': 201, 
                'data': results,
                'partial_errors': errors if errors else None
            }, status=201)

        except Exception as e:
            return Response({'success': False, 'message': str(e), 'status': 500}, status=500)

    @action(detail=False, methods=['get'], url_path='rankings')
    def rankings(self, request):
        """Get teacher performance rankings filtered by branch (SRS 5.2/8.2)"""
        branch_id = request.query_params.get('branch_id')
        
        # Base query for teachers
        from .models import Teacher
        teachers = Teacher.objects.all()
        
        # Filter by branch if user is not superuser or branch specified
        if not request.user.is_superuser:
            from users.models import UserBranchAccess
            accessible_branches = list(UserBranchAccess.objects.filter(user=request.user).values_list('branch_id', flat=True))
            if branch_id:
                if branch_id in [str(b) for b in accessible_branches]:
                    teachers = teachers.filter(branch_id=branch_id)
                else:
                    return Response({'success': False, 'message': 'Unauthorized branch access'}, status=403)
            else:
                teachers = teachers.filter(branch_id__in=accessible_branches)
        elif branch_id:
            teachers = teachers.filter(branch_id=branch_id)

        # Annotate with average rating and sort
        from django.db.models import Avg
        ranking_data = []
        for t in teachers:
            avg_rating = t.performance_ratings.aggregate(Avg('rating'))['rating__avg'] or 0
            # Calculate total tasks vs completed if models exist (SRS 8.2)
            total_tasks = t.tasks.count()
            completed_tasks = t.tasks.filter(status='completed').count()
            task_completion = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0

            ranking_data.append({
                'id': str(t.id),
                'full_name': t.user.full_name,
                'teacher_id': t.teacher_id,
                'average_rating': round(avg_rating, 2),
                'task_completion': round(task_completion, 1),
                'total_tasks': total_tasks,
                'branch': t.branch.name if t.branch else 'Unassigned'
            })
            
        # Sort by average rating descending
        ranking_data.sort(key=lambda x: x['average_rating'], reverse=True)

        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': ranking_data[:50] # Top 50
        })

class TeacherMetricsViewSet(viewsets.ModelViewSet):
    queryset = TeacherMetrics.objects.all()
    serializer_class = TeacherMetricsSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = self.queryset
        teacher_id = self.request.query_params.get('teacher')
        if teacher_id:
            queryset = queryset.filter(teacher_id=teacher_id)
        return queryset.order_by('-created_at')

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({'success': True, 'message': 'OK', 'status': 200, 'data': serializer.data})


class TeacherPerformanceReportViewSet(viewsets.ModelViewSet):
    queryset = TeacherPerformanceReport.objects.all()
    serializer_class = TeacherPerformanceReportSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = self.queryset

        # For non-superusers, filter by their teacher profile
        if not user.is_superuser:
            try:
                teacher = Teacher.objects.get(user=user)
                queryset = queryset.filter(teacher=teacher)
            except Teacher.DoesNotExist:
                return queryset.none()

        # Allow filtering by teacher_id query param (for admins)
        teacher_id = self.request.query_params.get('teacher_id')
        if teacher_id:
            queryset = queryset.filter(teacher_id=teacher_id)

        return queryset.order_by('-generated_at')

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({'success': True, 'message': 'OK', 'status': 200, 'data': serializer.data})

    def perform_create(self, serializer):
        serializer.save(generated_by=self.request.user)

    @action(detail=False, methods=['get'], url_path='rankings')
    def rankings(self, request):
        """
        Get teacher rankings based on the latest performance reports.
        Returns top 25 teachers by overall score with detailed breakdowns.
        """
        reports = self.queryset.select_related('teacher__user', 'teacher__branch').order_by('-overall_score')[:25]
        
        data = []
        for idx, r in enumerate(reports):
            data.append({
                'rank': idx + 1,
                'teacher_id': str(r.teacher.id),
                'teacher_name': r.teacher.user.full_name,
                'teacher_code': r.teacher.teacher_id,
                'branch': r.teacher.branch.name if r.teacher.branch else 'N/A',
                'overall_score': float(r.overall_score),
                'attendance_score': float(r.attendance_score),
                'task_completion_score': float(r.task_completion_score),
                'student_performance_score': float(r.student_performance_score),
                'rating_score': float(r.rating_score),
                'period': r.report_period,
                'last_updated': r.generated_at
            })
            
        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': data
        })


class TeacherAssignmentViewSet(viewsets.ModelViewSet):
    queryset = TeacherAssignment.objects.all()
    serializer_class = TeacherAssignmentSerializer
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
        class_id = self.request.query_params.get('class_fk')
        section_id = self.request.query_params.get('section_id')
        teacher_id = self.request.query_params.get('teacher_id')
        term_id = self.request.query_params.get('term_id')
        subject_id = self.request.query_params.get('subject_id')
        is_active = self.request.query_params.get('is_active')

        queryset = self.queryset.select_related('teacher', 'class_fk', 'section', 'subject', 'term')

        # Apply filters
        if term_id:
            queryset = queryset.filter(term_id=term_id)
        if subject_id:
            queryset = queryset.filter(subject_id=subject_id)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        # Handle null section filter (for class-level assignments)
        if section_id == 'null' or section_id == '':
            queryset = queryset.filter(section__isnull=True)
        elif section_id:
            queryset = queryset.filter(section_id=section_id)

        # Superusers can see all
        if user.is_superuser:
            if branch_id:
                queryset = queryset.filter(class_fk__branch_id=branch_id)
            if class_id:
                queryset = queryset.filter(class_fk_id=class_id)
            if teacher_id:
                queryset = queryset.filter(teacher_id=teacher_id)
            return queryset

        # Check if user is a teacher
        try:
            teacher = user.teacher_profile
            # Teachers can see their own assignments
            queryset = queryset.filter(teacher=teacher)
            if class_id:
                queryset = queryset.filter(class_fk_id=class_id)
            return queryset
        except:
            pass

        # Admins can see assignments for their accessible branches
        if self.is_administrative_user(user):
            from users.models import UserBranchAccess
            accessible_branches = UserBranchAccess.objects.filter(user=user).values_list('branch_id', flat=True)
            queryset = queryset.filter(class_fk__branch_id__in=accessible_branches)
            if branch_id:
                queryset = queryset.filter(class_fk__branch_id=branch_id)
            if class_id:
                queryset = queryset.filter(class_fk_id=class_id)
            if teacher_id:
                queryset = queryset.filter(teacher_id=teacher_id)
            return queryset

        return self.queryset.none()
