import logging

from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from .models import (Teacher, TeacherTask, TeacherPerformanceRating, TeacherMetrics,
                     TeacherPerformanceReport, TeacherAssignment, PerformanceMeasurementCriteria,
                     TeacherPerformanceEvaluation, TeacherPerformanceEvaluationRating)

logger = logging.getLogger(__name__)
from .serializers import (
    TeacherPerformanceRatingSerializer, TeacherSerializer, teacherTaskSerializer,
    TeacherMetricsSerializer, TeacherPerformanceReportSerializer, TeacherRegistrationSerializer,
    TeacherAssignmentSerializer, PerformanceMeasurementCriteriaSerializer,
    TeacherPerformanceEvaluationSerializer, TeacherPerformanceEvaluationCreateSerializer
)
from django.utils import timezone
from datetime import timedelta
from users.models import User, UserBranchAccess, has_model_permission
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

    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        """Get current teacher's profile including branch info"""
        user = request.user
        try:
            teacher = Teacher.objects.select_related('branch').get(user=user)
            return Response({
                'success': True,
                'message': 'OK',
                'status': 200,
                'data': {
                    'id': str(teacher.id),
                    'teacher_id': teacher.teacher_id,
                    'full_name': teacher.user.full_name,
                    'email': teacher.user.email,
                    'branch_id': str(teacher.branch.id) if teacher.branch else None,
                    'branch_name': teacher.branch.name if teacher.branch else None,
                }
            })
        except Teacher.DoesNotExist:
            return Response({
                'success': False,
                'message': 'No teacher profile found for this user',
                'status': 404,
                'data': {}
            }, status=404)

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

            # Import models for attendance calculation
            from students.models import Student
            from schedule.models import Attendance
            from django.db.models import Avg, Count, Q

            today = timezone.now().date()

            for ts in teacher_subjects:
                # Count students in this class/section taking this subject
                student_filter = {
                    'subject': ts.subject
                }

                # Add student model filters
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

                # Calculate attendance rate for this class/section/subject
                # Get attendance records for the last 7 days
                from datetime import timedelta
                week_ago = today - timedelta(days=7)

                attendance_records = Attendance.objects.filter(
                    student__in=students_in_class,
                    date__gte=week_ago,
                    date__lte=today,
                    schedule_slot__subject=ts.subject
                )

                # Calculate average attendance rate
                total_attendance_records = attendance_records.count()
                present_count = attendance_records.filter(status='Present').count()
                late_count = attendance_records.filter(status='Late').count()

                if total_attendance_records > 0:
                    # Count late as 0.5 present
                    attendance_rate = round(((present_count + (late_count * 0.5)) / total_attendance_records) * 100, 1)
                else:
                    attendance_rate = 0

                # Get last activity date (most recent attendance marked)
                last_activity_record = attendance_records.order_by('-date').first()
                last_activity = str(last_activity_record.date) if last_activity_record else None

                # Determine attendance color based on rate
                if attendance_rate >= 80:
                    attendance_color = '#22c55e'  # green
                elif attendance_rate >= 60:
                    attendance_color = '#3b82f6'  # blue
                elif attendance_rate >= 40:
                    attendance_color = '#f59e0b'  # yellow
                else:
                    attendance_color = '#ef4444'  # red

                subject_info = {
                    'id': str(ts.subject.id),
                    'assignment_id': str(ts.id),  # TeacherAssignment ID for grade entry
                    'name': ts.subject.name,
                    'code': ts.subject.code if hasattr(ts.subject, 'code') else '',
                    'class_id': str(ts.class_fk.id),
                    'branch_id': str(ts.class_fk.branch.id) if ts.class_fk.branch else None,
                    'class_name': ts.class_fk.grade,
                    'class_section': f"{ts.class_fk.grade} - {ts.section.name if ts.section else 'All'}",
                    'section_id': str(ts.section.id) if ts.section else None,
                    'section_name': ts.section.name if ts.section else None,
                    'student_count': student_count,
                    'attendance_rate': attendance_rate,
                    'last_activity': last_activity,
                    'attendance_color': attendance_color
                }
                subjects_data.append(subject_info)
                print(f"[TeacherDashboard] Subject: {subject_info['name']} - Class: {subject_info['class_name']} - Section: {subject_info['section_name']} - Students: {student_count} - Attendance: {attendance_rate}%")

            # Count pending assignments
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

        # Get attendance for the last 7 days for accurate rate calculation
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        attendance_records = Attendance.objects.filter(
            student_id__in=students,
            date__gte=week_ago,
            date__lte=today
        )

        # Get today's attendance records for "Present Today" and "Absent Today" cards
        today_attendance_records = Attendance.objects.filter(
            student_id__in=students,
            date=today
        )

        # Calculate today's attendance stats
        today_present_count = today_attendance_records.filter(status='Present').count()
        today_late_count = today_attendance_records.filter(status='Late').count()
        today_absent_count = today_attendance_records.filter(status='Absent').count()
        today_permission_count = today_attendance_records.filter(status='Excused').count()
        today_no_permission_count = today_attendance_records.filter(status='No permission').count()
        today_not_marked_count = total_students - (today_present_count + today_late_count + today_absent_count + today_permission_count + today_no_permission_count)

        # Calculate attendance stats based on last 7 days for the rate
        total_records = attendance_records.count()
        present_count = attendance_records.filter(status='Present').count()
        late_count = attendance_records.filter(status='Late').count()
        absent_count = attendance_records.filter(status='Absent').count()
        # Count late as 0.5 present for rate calculation
        if total_records > 0:
            attendance_rate = round(((present_count + (late_count * 0.5)) / total_records) * 100, 1)
        else:
            attendance_rate = 0

        # Build student list with attendance and individual attendance percentage
        students_list = []
        for student in students:
            # Get today's attendance status
            today_attendance = today_attendance_records.filter(student_id=student).first()
            attendance_status = today_attendance.status.lower() if today_attendance else 'not_marked'

            # Calculate student's attendance percentage for last 7 days
            student_records = Attendance.objects.filter(
                student_id=student,
                date__gte=week_ago,
                date__lte=today
            )
            student_total = student_records.count()
            if student_total > 0:
                student_present = student_records.filter(status='Present').count()
                student_late = student_records.filter(status='Late').count()
                attendance_percentage = round(((student_present + (student_late * 0.5)) / student_total) * 100, 1)
            else:
                attendance_percentage = 0
            
            students_list.append({
                'id': str(student.id),
                'student_id': student.student_id,
                'name': student.user.full_name,
                'email': student.user.email,
                'attendance_status': attendance_status,
                'attendance_date': str(today_attendance.date) if today_attendance else None,
                'attendance_percentage': attendance_percentage
            })

        # Get assignments for this subject
        assignments = Assignments.objects.filter(
            subject=subject_obj
        ).order_by('-due_date')

        print(f"[ClassDashboard] Subject ID: {subject_obj.id}, Assignments found: {assignments.count()}")
        for a in assignments[:10]:
            print(f"  - Assignment: {a.title}, Subject: {a.subject_id}, Due: {a.due_date}")

        assignments_data = []
        for assignment in assignments[:20]:
            # Count student submissions - check if submission_url exists
            from lessontopics.models import StudentAssignments
            student_assignments = StudentAssignments.objects.filter(assignment=assignment)
            total_students = assignment.students.count()  # Use the students ManyToMany count
            submitted_count = student_assignments.exclude(submission_url__isnull=True).exclude(submission_url='').count()

            # Get student details for this assignment
            student_list = []
            for student in assignment.students.all():
                student_list.append({
                    'id': str(student.id),
                    'name': student.user.full_name if student.user else 'Unknown',
                    'email': student.user.email if student.user else ''
                })

            assignments_data.append({
                'id': str(assignment.id),
                'title': assignment.title,
                'description': assignment.description or '',
                'due_date': str(assignment.due_date),
                'assigned_date': str(assignment.assigned_date) if assignment.assigned_date else str(assignment.created_at.date()),
                'status': 'active' if assignment.due_date >= today else 'past_due',
                'type': 'Assignment',
                'is_group_assignment': assignment.is_group_assignment or False,
                'max_points': assignment.max_score or 100,
                'file_url': assignment.file_url or None,
                'students': student_list,
                'student_count': len(student_list),
                'submitted': f"{submitted_count}/{total_students}",
                'submission_count': submitted_count,
                'total_students': total_students
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
                'value': str(today_present_count),
                'change': None,
                'change_positive': None
            },
            {
                'title': 'Absent Today',
                'value': str(today_absent_count),
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
                        'present': today_present_count,
                        'late': today_late_count,
                        'absent': today_absent_count,
                        'with_permission': today_permission_count,
                        'not_marked': today_not_marked_count,
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
            # Filter by date and student, then check if it matches the subject/section
            attendance_query = Attendance.objects.filter(
                student=student,
                date=attendance_date
            )
            
            # If section is specified, only show attendance for that section
            if section_obj:
                attendance_query = attendance_query.filter(
                    schedule_slot__section=section_obj
                )
            
            # Filter by subject
            attendance_query = attendance_query.filter(
                schedule_slot__subject=subject_obj
            )
            
            attendance_record = attendance_query.first()

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
                        
                        # Update or create attendance record with schedule_slot for uniqueness
                        if schedule_slot:
                            Attendance.objects.update_or_create(
                                student=student,
                                date=attendance_date,
                                schedule_slot=schedule_slot,
                                defaults=defaults
                            )
                        else:
                            # Fallback if no schedule slot exists (shouldn't happen in normal flow)
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
        user = self.request.user
        teacher_id = self.request.query_params.get('teacher')

        # If user is a teacher, only show their own ratings
        try:
            teacher = Teacher.objects.get(user=user)
            return queryset.filter(teacher=teacher).order_by('-rating_date')
        except Teacher.DoesNotExist:
            pass
        except Exception as e:
            logger.error(f"Error checking teacher status: {e}")

        # For admins/students/parents, allow filtering by teacher_id
        if teacher_id:
            queryset = queryset.filter(teacher_id=teacher_id)

        return queryset.order_by('-rating_date')

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({'success': True, 'message': 'OK', 'status': 200, 'data': serializer.data})

    def create(self, request, *args, **kwargs):
        user = request.user
        
        # Check if evaluation period is open
        from .models import EvaluationPeriodSettings
        eval_settings_obj = EvaluationPeriodSettings.get_settings()
        
        if not eval_settings_obj.is_open:
            return Response({
                'success': False,
                'message': 'Evaluation period is closed. You cannot submit ratings at this time.',
                'status': 403
            }, status=403)

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
            
            # Check if user has already rated this teacher in current evaluation period
            from django.utils import timezone
            from datetime import datetime
            
            existing_ratings_query = TeacherPerformanceRating.objects.filter(
                teacher=teacher,
                rated_by=user
            )
            
            # If evaluation period has a start date, only check ratings after that date
            # Use created_at (DateTimeField) instead of rating_date (DateField) for proper comparison
            if eval_settings_obj.start_date:
                existing_ratings_query = existing_ratings_query.filter(created_at__gte=eval_settings_obj.start_date)
            
            if existing_ratings_query.exists():
                return Response({
                    'success': False,
                    'message': 'You have already rated this teacher. You can only rate once per evaluation period.',
                    'status': 403
                }, status=403)

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
        
        # Validate that all active criteria are rated
        from .models import PerformanceMeasurementCriteria
        active_criteria = PerformanceMeasurementCriteria.objects.filter(is_active=True)
        required_criteria_count = active_criteria.count()
        
        submitted_categories = set()
        for item in ratings_list:
            category = item.get('category')
            if category:
                submitted_categories.add(category)
        
        if len(submitted_categories) < required_criteria_count:
            return Response({
                'success': False,
                'message': 'Please fill all measurements',
                'required_count': required_criteria_count,
                'submitted_count': len(submitted_categories),
                'status': 400
            }, status=400)

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

    @action(detail=False, methods=['post'], url_path='submit')
    def submit_ratings(self, request):
        """
        Dedicated endpoint for submitting teacher ratings.
        Expects: { teacher: 'teacher_id', ratings: [{ category: 'code', rating: 4, comment: '' }] }
        """
        return self.create(request)

    @action(detail=False, methods=['get'], url_path='my-ratings')
    def my_ratings(self, request):
        """
        Get all ratings submitted by the current user (student/parent).
        Shows which teachers they rated and what ratings they gave.
        Only returns ratings from the current evaluation period.
        """
        user = request.user
        
        # Get current evaluation period settings
        from .models import EvaluationPeriodSettings
        eval_settings = EvaluationPeriodSettings.get_settings()
        
        # STRICT: If no start_date is set (period not properly initialized), return NO ratings
        # This prevents showing old ratings when a new period is opened without proper dates
        if not eval_settings.start_date:
            return Response({
                'success': True,
                'message': 'OK',
                'status': 200,
                'count': 0,
                'data': []
            })
        
        # Only show ratings from current evaluation period (after start_date)
        # Use created_at (DateTimeField) instead of rating_date (DateField) for proper comparison
        ratings = TeacherPerformanceRating.objects.filter(
            rated_by=user,
            created_at__gte=eval_settings.start_date
        ).select_related('teacher', 'teacher__user').order_by('-created_at')
        
        data = []
        for r in ratings:
            data.append({
                'id': str(r.id),
                'teacher_id': str(r.teacher.id),
                'teacher_name': r.teacher.user.full_name,
                'teacher_code': r.teacher.teacher_id,
                'category': r.category,
                'rating': r.rating,
                'comment': r.comment,
                'rating_date': r.rating_date.isoformat(),
            })
        
        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'count': len(data),
            'data': data
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

    def create(self, request, *args, **kwargs):
        """Create a new performance report with duplicate prevention"""
        from .models import EvaluationPeriodSettings, Teacher
        
        # Get current evaluation period settings
        eval_settings_obj = EvaluationPeriodSettings.get_settings()
        
        # Get teacher from request data
        teacher_id = request.data.get('teacher')
        if not teacher_id:
            return Response({
                'success': False,
                'message': 'Teacher ID is required',
                'status': 400
            }, status=400)
        
        try:
            teacher = Teacher.objects.get(id=teacher_id)
        except Teacher.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Teacher not found',
                'status': 404
            }, status=404)
        
        # Check if evaluation period is open
        if not eval_settings_obj.is_open:
            return Response({
                'success': False,
                'message': 'Evaluation period is closed. Cannot generate reports.',
                'status': 403
            }, status=403)
        
        # Check if a report already exists for this teacher in current evaluation period
        if eval_settings_obj.start_date:
            existing_report = TeacherPerformanceReport.objects.filter(
                teacher=teacher,
                generated_at__gte=eval_settings_obj.start_date
            ).exists()
            
            if existing_report:
                return Response({
                    'success': False,
                    'message': 'A report has already been generated for this teacher in the current evaluation period.',
                    'status': 403
                }, status=403)
        
        # Proceed with creation
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        return Response({
            'success': True,
            'message': 'Performance report generated successfully',
            'status': 201,
            'data': serializer.data
        }, status=201)

    def perform_create(self, serializer):
        # Get current evaluation period ID from database
        from .models import EvaluationPeriodSettings
        eval_settings_obj = EvaluationPeriodSettings.get_settings()
        
        serializer.save(
            generated_by=self.request.user,
            evaluation_period_id=eval_settings_obj.period_id
        )

    @action(detail=False, methods=['get'], url_path='rankings')
    def rankings(self, request):
        """
        Get teacher rankings - ONE entry per teacher with latest report.
        Uses actual system data (metrics, ratings) for accurate scoring.
        """
        branch_id = request.query_params.get('branch_id')
        
        # Get evaluation period settings for filtering
        from .models import EvaluationPeriodSettings
        eval_settings_obj = EvaluationPeriodSettings.get_settings()
        
        # Get all teachers (not reports) to ensure one entry per teacher
        from .models import Teacher
        teachers = Teacher.objects.all().select_related('user', 'branch').order_by('id')
        
        # Apply branch filter
        if branch_id:
            teachers = teachers.filter(branch_id=branch_id)
        elif not request.user.is_superuser:
            from users.models import UserBranchAccess
            accessible_branches = list(UserBranchAccess.objects.filter(
                user=request.user
            ).values_list('branch_id', flat=True))
            teachers = teachers.filter(branch_id__in=accessible_branches)
        
        # Get latest report for each teacher (subquery for efficiency)
        from django.db.models import OuterRef, Subquery, Avg
        latest_report_subquery = TeacherPerformanceReport.objects.filter(
            teacher=OuterRef('pk')
        ).order_by('-generated_at').values('id')[:1]
        
        # Prefetch latest reports
        latest_reports = {
            r.teacher_id: r 
            for r in TeacherPerformanceReport.objects.filter(
                id__in=Subquery(latest_report_subquery)
            ).select_related('teacher__user', 'teacher__branch')
        }
        
        # Build rankings - one per teacher
        data = []
        seen_teachers = set()
        
        for teacher in teachers:
            if str(teacher.id) in seen_teachers:
                continue
            seen_teachers.add(str(teacher.id))
            
            # Get teacher's latest report - ONLY use if generated in current evaluation period
            report = latest_reports.get(teacher.id)
            use_report = False
            if report and eval_settings_obj.start_date:
                # Only use report if it was generated AFTER the evaluation period started
                use_report = report.generated_at >= eval_settings_obj.start_date
            
            if use_report:
                # Use report data (generated during current evaluation period)
                overall_score = float(report.overall_score)
                attendance_score = float(report.attendance_score)
                task_completion_score = float(report.task_completion_score)
                student_performance_score = float(report.student_performance_score)
                rating_score = float(report.rating_score)
                period = report.report_period
                last_updated = report.generated_at
                source = 'report'
                
                # Debug logging for report usage
                import logging
                logger = logging.getLogger(__name__)
                logger.info(f"[RANKINGS] Teacher {teacher.teacher_id}: source={source}, generated_at={report.generated_at}, overall={overall_score}")
            else:
                # No valid report - calculate from actual system data (metrics + ratings)
                source = 'calculated'
                metrics = teacher.metrics.order_by('-month').first()
                if metrics:
                    attendance_score = float(metrics.attendance_percentage or 0)
                    task_completion_score = float(metrics.task_completion_rate or 0) * 100
                    student_performance_score = float(metrics.average_student_performance or 0)
                else:
                    attendance_score = 0
                    task_completion_score = 0
                    student_performance_score = 0
                
                # Get average rating - FILTERED by evaluation period start_date
                ratings_query = teacher.performance_ratings.all()
                total_ratings_count = ratings_query.count()
                
                # Debug: List all ratings for this teacher
                all_ratings = list(ratings_query.values('id', 'rating', 'created_at', 'rated_by_id')[:5])
                
                # Filter by evaluation period start_date if set, otherwise use all ratings
                if eval_settings_obj.start_date:
                    ratings_query = ratings_query.filter(created_at__gte=eval_settings_obj.start_date)
                filtered_count = ratings_query.count()
                avg_rating = ratings_query.aggregate(avg=Avg('rating'))['avg'] or 0
                rating_score = (avg_rating / 5) * 100 if avg_rating else 0
                
                # Debug logging
                import logging
                logger = logging.getLogger(__name__)
                logger.info(f"[RANKINGS] Teacher {teacher.teacher_id}: source={source}, total_ratings={total_ratings_count}, filtered={filtered_count}, start_date={eval_settings_obj.start_date}, avg={avg_rating}, rating_score={rating_score}, attendance={attendance_score}, tasks={task_completion_score}")
                if all_ratings:
                    logger.info(f"[RANKINGS] Teacher {teacher.teacher_id}: sample_ratings={all_ratings}")
                
                # Calculate weighted overall score
                overall_score = (
                    rating_score * 0.40 +
                    attendance_score * 0.25 +
                    task_completion_score * 0.20 +
                    student_performance_score * 0.15
                )
                period = 'system_calculated'
                last_updated = timezone.now()
            
            data.append({
                'teacher_id': str(teacher.id),
                'teacher_name': teacher.user.full_name,
                'teacher_code': teacher.teacher_id,
                'branch': teacher.branch.name if teacher.branch else 'N/A',
                'overall_score': overall_score,
                'attendance_score': attendance_score,
                'task_completion_score': task_completion_score,
                'student_performance_score': student_performance_score,
                'rating_score': rating_score,
                'period': period,
                'last_updated': last_updated
            })
        
        # Sort by rating_score descending and assign ranks (matches frontend display)
        data.sort(key=lambda x: x['rating_score'], reverse=True)
        for idx, item in enumerate(data):
            item['rank'] = idx + 1
        
        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': data[:25]  # Top 25
        })

    @action(detail=False, methods=['get'], url_path='my-evaluations')
    def my_evaluations(self, request):
        """
        Get the latest admin evaluation with recommendations for the current teacher.
        Teachers can see admin-written strengths, areas for improvement, and recommendations.
        """
        user = request.user
        
        try:
            teacher = Teacher.objects.get(user=user)
        except Teacher.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Teacher profile not found',
                'status': 404
            }, status=404)
        
        # Get the latest approved evaluation with admin recommendations
        latest_eval = TeacherPerformanceEvaluation.objects.filter(
            teacher=teacher,
            status='approved'
        ).order_by('-evaluated_at').first()
        
        if not latest_eval:
            return Response({
                'success': True,
                'message': 'No formal evaluation available yet',
                'status': 200,
                'data': None
            })
        
        # Get criteria ratings for this evaluation
        criteria_ratings = []
        for rating in latest_eval.criteria_ratings.all():
            criteria_ratings.append({
                'criteria_name': rating.criteria.name if rating.criteria else 'Unknown',
                'rating': rating.rating,
                'weight': rating.criteria.weight if rating.criteria else 1
            })
        
        data = {
            'id': str(latest_eval.id),
            'term_name': latest_eval.term.name if latest_eval.term else 'N/A',
            'academic_year': latest_eval.academic_year,
            'overall_score': latest_eval.overall_score,
            'weighted_average': latest_eval.weighted_average,
            'status': latest_eval.status,
            'evaluated_by': latest_eval.evaluated_by.full_name if latest_eval.evaluated_by else 'Admin',
            'evaluated_at': latest_eval.evaluated_at.isoformat() if latest_eval.evaluated_at else None,
            'strengths': latest_eval.strengths or '',
            'areas_for_improvement': latest_eval.areas_for_improvement or '',
            'recommendations': latest_eval.recommendations or '',
            'action_items': latest_eval.action_items or '',
            'criteria_ratings': criteria_ratings
        }
        
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
            teacher = Teacher.objects.get(user=user)
            # Teachers can see their own assignments
            queryset = queryset.filter(teacher=teacher)
            if class_id:
                queryset = queryset.filter(class_fk_id=class_id)
            return queryset
        except Teacher.DoesNotExist:
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

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'message': 'Teacher assignments retrieved successfully',
            'status': 200,
            'data': serializer.data
        })

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            'success': True,
            'message': 'Teacher assignment created successfully',
            'status': 201,
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        user = self.request.user
        if not self.is_administrative_user(user):
            raise PermissionDenied("Only administrators can create teacher assignments")
        serializer.save()

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            'success': True,
            'message': 'Teacher assignment updated successfully',
            'status': 200,
            'data': serializer.data
        })

    def perform_update(self, serializer):
        user = self.request.user
        if not self.is_administrative_user(user):
            raise PermissionDenied("Only administrators can update teacher assignments")
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({
            'success': True,
            'message': 'Teacher assignment deleted successfully',
            'status': 204,
            'data': []
        }, status=status.HTTP_204_NO_CONTENT)

    def perform_destroy(self, instance):
        user = self.request.user
        if not self.is_administrative_user(user):
            raise PermissionDenied("Only administrators can delete teacher assignments")
        instance.delete()

    @action(detail=False, methods=['get'], url_path='teacher-detail/(?P<teacher_id>[^/.]+)')
    def teacher_detail(self, request, teacher_id=None):
        """Get detailed information about a teacher including all their scheduled classes"""
        from schedule.models import ClassScheduleSlot
        from django.db.models import Prefetch

        try:
            teacher = Teacher.objects.select_related('user').get(id=teacher_id)
        except Teacher.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Teacher not found',
                'status': 404
            }, status=404)

        # Get all schedule slots where this teacher is assigned
        # This fetches from the Class Schedule (Schedule Management page)
        schedule_slots = ClassScheduleSlot.objects.filter(
            teacher_assignment__teacher=teacher
        ).select_related(
            'class_fk', 'section', 'subject', 'term', 'teacher_assignment'
        ).distinct()

        # Build teaching info from scheduled slots
        teaching_info = []
        seen_assignments = set()  # Track unique class-section-subject combinations

        for slot in schedule_slots:
            if slot.subject:  # Only include slots with a subject assigned
                assignment_key = (slot.class_fk.id, slot.section.id if slot.section else None, slot.subject.id)
                if assignment_key not in seen_assignments:
                    seen_assignments.add(assignment_key)
                    teaching_info.append({
                        'class': {
                            'id': str(slot.class_fk.id),
                            'grade': slot.class_fk.grade
                        },
                        'section': {
                            'id': str(slot.section.id) if slot.section else None,
                            'name': slot.section.name if slot.section else 'All Sections'
                        },
                        'subject': {
                            'id': str(slot.subject.id),
                            'name': slot.subject.name,
                            'code': slot.subject.code
                        },
                        'term': {
                            'id': str(slot.term.id) if slot.term else None,
                            'name': slot.term.name if slot.term else None
                        },
                        'is_primary': slot.teacher_assignment.is_primary if slot.teacher_assignment else False,
                        'is_active': slot.teacher_assignment.is_active if slot.teacher_assignment else True,
                        'assigned_on': slot.teacher_assignment.assigned_on if slot.teacher_assignment else None,
                        'schedule_count': 1  # Count of scheduled periods for this class-section-subject
                    })
                else:
                    # Increment schedule count for existing assignment
                    for info in teaching_info:
                        if (info['class']['id'] == str(slot.class_fk.id) and
                            info['section']['id'] == (str(slot.section.id) if slot.section else None) and
                            info['subject']['id'] == str(slot.subject.id)):
                            info['schedule_count'] += 1
                            break

        # Also include teacher assignments that don't have schedule slots yet
        # (for teachers who are assigned but not yet scheduled)
        teacher_assignments = TeacherAssignment.objects.filter(
            teacher=teacher
        ).select_related('class_fk', 'section', 'subject', 'term')

        for assignment in teacher_assignments:
            assignment_key = (assignment.class_fk.id, assignment.section.id if assignment.section else None, assignment.subject.id)
            if assignment_key not in seen_assignments:
                seen_assignments.add(assignment_key)
                teaching_info.append({
                    'class': {
                        'id': str(assignment.class_fk.id),
                        'grade': assignment.class_fk.grade
                    },
                    'section': {
                        'id': str(assignment.section.id) if assignment.section else None,
                        'name': assignment.section.name if assignment.section else 'All Sections'
                    },
                    'subject': {
                        'id': str(assignment.subject.id),
                        'name': assignment.subject.name,
                        'code': assignment.subject.code
                    },
                    'term': {
                        'id': str(assignment.term.id) if assignment.term else None,
                        'name': assignment.term.name if assignment.term else None
                    },
                    'is_primary': assignment.is_primary,
                    'is_active': assignment.is_active,
                    'assigned_on': assignment.assigned_on,
                    'schedule_count': 0  # Not scheduled yet
                })

        # Calculate summary stats from scheduled data
        unique_classes = set(info['class']['grade'] for info in teaching_info)
        unique_subjects = set(info['subject']['name'] for info in teaching_info)
        unique_sections = set(info['section']['name'] for info in teaching_info if info['section']['name'] != 'All Sections')

        # Get user data safely
        user = teacher.user
        teacher_data = {
            'teacher': {
                'id': str(teacher.id),
                'teacher_id': teacher.teacher_id,
                'name': user.full_name if user else 'N/A',
                'email': user.email if user else 'N/A',
                'phone': getattr(user, 'phone', None) or getattr(user, 'mobile', None) or 'N/A',
                'is_active': user.is_active if user else False
            },
            'summary': {
                'total_assignments': len(teaching_info),
                'unique_classes': len(unique_classes),
                'unique_subjects': len(unique_subjects),
                'unique_sections': len(unique_sections),
                'classes_list': sorted(list(unique_classes)),
                'subjects_list': sorted(list(unique_subjects)),
                'sections_list': sorted(list(unique_sections))
            },
            'assignments': teaching_info
        }

        return Response({
            'success': True,
            'message': 'Teacher details retrieved successfully from Class Schedule',
            'status': 200,
            'data': teacher_data
        })


class PerformanceMeasurementCriteriaViewSet(viewsets.ModelViewSet):
    """ViewSet for managing dynamic performance measurement criteria.
    
    Only super admins and admins can create, update, or delete criteria.
    All authenticated users can view active criteria.
    """
    queryset = PerformanceMeasurementCriteria.objects.all()
    serializer_class = PerformanceMeasurementCriteriaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = self.queryset
        # Filter by active status if requested
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        return queryset.order_by('-is_active', 'name')

    def is_admin_user(self, user):
        """Check if user is a super admin or admin"""
        if user.is_superuser:
            return True
        user_roles = list(user.userrole_set.values_list('role__name', flat=True))
        admin_roles = ['admin', 'super_admin', 'superadmin', 'head_admin', 'ceo']
        return any(role.lower() in admin_roles for role in user_roles)

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
        if not self.is_admin_user(request.user):
            return Response({
                'success': False,
                'message': 'Only admins and super admins can create criteria',
                'status': 403
            }, status=403)
        
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save(created_by=request.user)
            return Response({
                'success': True,
                'message': 'Criteria created successfully',
                'status': 201,
                'data': serializer.data
            }, status=201)
        return Response({
            'success': False,
            'message': 'Validation failed',
            'errors': serializer.errors,
            'status': 400
        }, status=400)

    def update(self, request, *args, **kwargs):
        if not self.is_admin_user(request.user):
            return Response({
                'success': False,
                'message': 'Only admins and super admins can update criteria',
                'status': 403
            }, status=403)
        
        instance = self.get_object()
        # Prevent modification of default criteria code/name by non-superusers
        if instance.is_default and not request.user.is_superuser:
            return Response({
                'success': False,
                'message': 'Default criteria can only be modified by super admins',
                'status': 403
            }, status=403)
        
        serializer = self.get_serializer(instance, data=request.data, partial=kwargs.get('partial', False))
        if serializer.is_valid():
            serializer.save()
            return Response({
                'success': True,
                'message': 'Criteria updated successfully',
                'status': 200,
                'data': serializer.data
            })
        return Response({
            'success': False,
            'message': 'Validation failed',
            'errors': serializer.errors,
            'status': 400
        }, status=400)

    def destroy(self, request, *args, **kwargs):
        if not self.is_admin_user(request.user):
            return Response({
                'success': False,
                'message': 'Only admins and super admins can delete criteria',
                'status': 403
            }, status=403)
        
        instance = self.get_object()
        if instance.is_default:
            return Response({
                'success': False,
                'message': 'Default criteria cannot be deleted',
                'status': 400
            }, status=400)
        
        instance.delete()
        return Response({
            'success': True,
            'message': 'Criteria deleted successfully',
            'status': 200
        })

    @action(detail=False, methods=['post'], url_path='bulk-create')
    def bulk_create(self, request):
        """Bulk create multiple criteria at once"""
        if not self.is_admin_user(request.user):
            return Response({
                'success': False,
                'message': 'Only admins and super admins can create criteria',
                'status': 403
            }, status=403)
        
        criteria_list = request.data.get('criteria', [])
        if not isinstance(criteria_list, list) or not criteria_list:
            return Response({
                'success': False,
                'message': 'Please provide a list of criteria to create',
                'status': 400
            }, status=400)
        
        created = []
        errors = []
        
        for idx, criteria_data in enumerate(criteria_list):
            serializer = self.get_serializer(data=criteria_data)
            if serializer.is_valid():
                serializer.save(created_by=request.user)
                created.append(serializer.data)
            else:
                errors.append({'index': idx, 'errors': serializer.errors})
        
        return Response({
            'success': len(errors) == 0,
            'message': f'Created {len(created)} criteria, {len(errors)} failed',
            'status': 201 if len(errors) == 0 else 207,
            'data': created,
            'errors': errors if errors else None
        }, status=201 if len(errors) == 0 else 207)

    @action(detail=False, methods=['get'], url_path='active')
    def active_criteria(self, request):
        """Get only active criteria for use in evaluations"""
        criteria = self.queryset.filter(is_active=True).order_by('name')
        serializer = self.get_serializer(criteria, many=True)
        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        })

    @action(detail=False, methods=['get'], url_path='evaluation-settings')
    def evaluation_settings(self, request):
        """Get evaluation period settings - accessible to all authenticated users"""
        from .models import EvaluationPeriodSettings
        
        # Get settings from database (persistent, survives restarts)
        settings_obj = EvaluationPeriodSettings.get_settings()
        settings = settings_obj.to_dict()
        
        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': settings
        })
    
    @action(detail=False, methods=['post'], url_path='set-evaluation-period')
    def set_evaluation_period(self, request):
        """Admin/Super Admin control to open/close evaluation period"""
        if not self.is_admin_user(request.user):
            return Response({
                'success': False,
                'message': 'Only admins and super admins can control evaluation period',
                'status': 403
            }, status=403)
        
        from .models import EvaluationPeriodSettings
        from django.utils import timezone
        from datetime import datetime
        import uuid
        
        is_open = request.data.get('is_open', True)
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')
        message = request.data.get('message', 'Evaluation period is open' if is_open else 'Evaluation period is closed')
        
        # Get current settings from database
        settings_obj = EvaluationPeriodSettings.get_settings()
        was_open = settings_obj.is_open
        
        # Generate a new evaluation period ID when opening a fresh period
        if is_open and not was_open:
            # Opening a new period - generate fresh period ID and start date
            period_id = str(uuid.uuid4())
            if not start_date:
                start_date = timezone.now()
            # Reset message for new period
            message = 'Evaluation period is now OPEN - Students/Parents can rate teachers'
        elif not is_open and was_open:
            # Closing the period - keep the period_id for reference
            period_id = settings_obj.period_id
            if not message:
                message = 'Evaluation period is CLOSED - No new ratings allowed'
        else:
            # No change in state, keep existing period_id
            period_id = settings_obj.period_id
            if not start_date and settings_obj.start_date:
                start_date = settings_obj.start_date
        
        # If closing the period, keep the existing start_date
        if not is_open and not start_date:
            start_date = settings_obj.start_date
        
        # Parse dates if they are strings
        if isinstance(start_date, str):
            try:
                start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            except:
                start_date = timezone.now()
        
        if isinstance(end_date, str):
            try:
                end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            except:
                end_date = None
        
        # Save to database (persistent)
        settings_obj.is_open = is_open
        settings_obj.period_id = period_id
        settings_obj.start_date = start_date
        settings_obj.end_date = end_date
        settings_obj.message = message
        settings_obj.updated_by = request.user
        settings_obj.save()
        
        # Also update cache for performance (but now it's backed by database)
        settings = settings_obj.to_dict()
        
        return Response({
            'success': True,
            'message': f'Evaluation period {"opened" if is_open else "closed"} successfully',
            'status': 200,
            'data': settings
        })
    
    @action(detail=False, methods=['get'], url_path='all-evaluations')
    def all_evaluations(self, request):
        """
        Get all evaluations for a specific teacher with aggregate calculations.
        Shows ratings from students, parents, and admins with breakdown by criteria.
        """
        from students.models import Student, ParentStudent
        from django.db.models import Avg
        from django.utils import timezone
        import uuid
        
        teacher_id = request.query_params.get('teacher_id')
        if not teacher_id:
            return Response({
                'success': False,
                'message': 'teacher_id is required',
                'status': 400
            }, status=400)
        
        try:
            try:
                uuid_val = uuid.UUID(teacher_id)
                teacher = Teacher.objects.get(id=uuid_val)
            except (ValueError, TypeError):
                teacher = Teacher.objects.get(teacher_id=teacher_id)
        except Teacher.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Teacher not found',
                'status': 404
            }, status=404)
        
        # Get all ratings for this teacher
        ratings = TeacherPerformanceRating.objects.filter(teacher=teacher).select_related('rated_by')
        
        # Get evaluations
        evaluations = TeacherPerformanceEvaluation.objects.filter(teacher=teacher, status='approved')
        
        # Calculate aggregate statistics
        student_ratings = ratings.filter(
            rated_by__in=Student.objects.values_list('user', flat=True)
        )
        parent_ratings = ratings.filter(
            rated_by__in=ParentStudent.objects.values_list('parent__user', flat=True)
        )
        admin_ratings = ratings.filter(
            rated_by__in=User.objects.filter(is_staff=True).values_list('id', flat=True)
        )
        
        # Calculate criteria breakdown
        criteria_stats = {}
        all_criteria = PerformanceMeasurementCriteria.objects.filter(is_active=True)
        
        for c in all_criteria:
            cat_ratings = ratings.filter(category=c.code)
            avg_rating = cat_ratings.aggregate(Avg('rating'))['rating__avg'] or 0
            criteria_stats[c.code] = {
                'criteria_name': c.name,
                'criteria_code': c.code,
                'total_ratings': cat_ratings.count(),
                'average_rating': round(avg_rating, 2),
                'percentage': round(avg_rating / 5 * 100),
                'student_count': cat_ratings.filter(
                    rated_by__in=Student.objects.values_list('user', flat=True)
                ).count(),
                'parent_count': cat_ratings.filter(
                    rated_by__in=ParentStudent.objects.values_list('parent__user', flat=True)
                ).count(),
                'admin_count': cat_ratings.filter(
                    rated_by__in=User.objects.filter(is_staff=True).values_list('id', flat=True)
                ).count()
            }
        
        # Overall statistics
        total_ratings = ratings.count()
        overall_avg = ratings.aggregate(Avg('rating'))['rating__avg'] or 0
        
        # Get latest evaluation with admin recommendations
        latest_evaluation = evaluations.order_by('-evaluated_at').first()
        admin_recommendations = {
            'strengths': latest_evaluation.strengths if latest_evaluation else '',
            'areas_for_improvement': latest_evaluation.areas_for_improvement if latest_evaluation else '',
            'recommendations': latest_evaluation.recommendations if latest_evaluation else '',
            'action_items': latest_evaluation.action_items if latest_evaluation else '',
            'evaluated_by': latest_evaluation.evaluated_by.full_name if latest_evaluation and latest_evaluation.evaluated_by else None,
            'evaluated_at': latest_evaluation.evaluated_at.isoformat() if latest_evaluation and latest_evaluation.evaluated_at else None,
            'term_name': latest_evaluation.term.name if latest_evaluation and latest_evaluation.term else 'N/A'
        } if latest_evaluation else None
        
        # Get evaluation period settings
        from .models import EvaluationPeriodSettings
        eval_settings = EvaluationPeriodSettings.get_settings()
        
        result = {
            'teacher': {
                'id': str(teacher.id),
                'teacher_id': teacher.teacher_id,
                'full_name': teacher.user.full_name,
                'email': teacher.user.email,
                'branch': teacher.branch.name if teacher.branch else 'N/A'
            },
            'evaluation_period': {
                'is_open': eval_settings.is_open,
                'period_id': eval_settings.period_id,
                'start_date': eval_settings.start_date.isoformat() if eval_settings.start_date else None,
                'end_date': eval_settings.end_date.isoformat() if eval_settings.end_date else None,
                'message': eval_settings.message
            },
            'summary': {
                'total_ratings': total_ratings,
                'overall_average': round(overall_avg, 2),
                'overall_percentage': round(overall_avg / 5 * 100),
                'student_ratings_count': student_ratings.count(),
                'parent_ratings_count': parent_ratings.count(),
                'admin_ratings_count': admin_ratings.count(),
                'evaluation_count': evaluations.count()
            },
            'admin_recommendations': admin_recommendations,
            'criteria_breakdown': criteria_stats,
            'recent_ratings': [
                {
                    'id': str(r.id),
                    'category': r.category,
                    'rating': r.rating,
                    # Only show name for Admin raters, hide Student/Parent names for privacy
                    'rated_by_name': r.rated_by.full_name if r.rated_by and r.rated_by.is_staff else None,
                    'rated_by_role': 'Student' if Student.objects.filter(user=r.rated_by).exists() 
                                     else 'Parent' if ParentStudent.objects.filter(parent__user=r.rated_by).exists()
                                     else 'Admin' if r.rated_by.is_staff else 'Other',
                    'rating_date': r.rating_date.isoformat(),
                    'comment': r.comment
                }
                for r in ratings.order_by('-rating_date')[:20]
            ],
            'evaluations': [
                {
                    'id': str(e.id),
                    'term_name': e.term.name if e.term else 'N/A',
                    'overall_score': e.overall_score,
                    'status': e.status,
                    'evaluated_by': e.evaluated_by.full_name if e.evaluated_by else None,
                    'evaluated_at': e.evaluated_at.isoformat() if e.evaluated_at else None,
                    'evaluation_period_id': e.evaluation_period_id,
                    'is_previous_period': e.is_previous_period
                }
                for e in evaluations.order_by('-evaluated_at')
            ],
            'current_period_evaluations': [
                {
                    'id': str(e.id),
                    'term_name': e.term.name if e.term else 'N/A',
                    'overall_score': e.overall_score,
                    'status': e.status,
                    'evaluated_by': e.evaluated_by.full_name if e.evaluated_by else None,
                    'evaluated_at': e.evaluated_at.isoformat() if e.evaluated_at else None,
                }
                for e in evaluations.filter(
                    is_previous_period=False
                ).order_by('-evaluated_at')
            ],
            'previous_period_evaluations': [
                {
                    'id': str(e.id),
                    'term_name': e.term.name if e.term else 'N/A',
                    'overall_score': e.overall_score,
                    'status': e.status,
                    'evaluated_by': e.evaluated_by.full_name if e.evaluated_by else None,
                    'evaluated_at': e.evaluated_at.isoformat() if e.evaluated_at else None,
                }
                for e in evaluations.filter(
                    is_previous_period=True
                ).order_by('-evaluated_at')
            ]
        }
        
        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': result
        })


class TeacherPerformanceEvaluationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing term-based teacher performance evaluations.
    
    Only super admins and admins can create, update, or delete evaluations.
    Teachers can view their own evaluations.
    """
    queryset = TeacherPerformanceEvaluation.objects.all()
    serializer_class = TeacherPerformanceEvaluationSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return TeacherPerformanceEvaluationCreateSerializer
        return TeacherPerformanceEvaluationSerializer

    def is_admin_user(self, user):
        """Check if user is a super admin or admin"""
        if user.is_superuser:
            return True
        user_roles = list(user.userrole_set.values_list('role__name', flat=True))
        admin_roles = ['admin', 'super_admin', 'superadmin', 'head_admin', 'ceo']
        return any(role.lower() in admin_roles for role in user_roles)

    def get_queryset(self):
        queryset = self.queryset
        user = self.request.user
        
        # If user is a teacher, only show their own evaluations
        try:
            teacher = Teacher.objects.get(user=user)
            return queryset.filter(teacher=teacher).order_by('-evaluated_at')
        except Teacher.DoesNotExist:
            pass
        
        # For admins, allow filtering
        teacher_id = self.request.query_params.get('teacher')
        term_id = self.request.query_params.get('term')
        academic_year = self.request.query_params.get('academic_year')
        status = self.request.query_params.get('status')
        
        if teacher_id:
            queryset = queryset.filter(teacher_id=teacher_id)
        if term_id:
            queryset = queryset.filter(term_id=term_id)
        if academic_year:
            queryset = queryset.filter(academic_year=academic_year)
        if status:
            queryset = queryset.filter(status=status)
        
        return queryset.order_by('-evaluated_at')

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
        if not self.is_admin_user(request.user):
            return Response({
                'success': False,
                'message': 'Only admins and super admins can create performance evaluations',
                'status': 403
            }, status=403)
        
        serializer = self.get_serializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            instance = serializer.save()
            # Return with full serializer
            response_serializer = TeacherPerformanceEvaluationSerializer(instance)
            return Response({
                'success': True,
                'message': 'Performance evaluation created successfully',
                'status': 201,
                'data': response_serializer.data
            }, status=201)
        return Response({
            'success': False,
            'message': 'Validation failed',
            'errors': serializer.errors,
            'status': 400
        }, status=400)

    def update(self, request, *args, **kwargs):
        if not self.is_admin_user(request.user):
            return Response({
                'success': False,
                'message': 'Only admins and super admins can update performance evaluations',
                'status': 403
            }, status=403)
        
        instance = self.get_object()
        partial = kwargs.get('partial', False)
        serializer = self.get_serializer(instance, data=request.data, partial=partial, context={'request': request})
        if serializer.is_valid():
            instance = serializer.save()
            response_serializer = TeacherPerformanceEvaluationSerializer(instance)
            return Response({
                'success': True,
                'message': 'Performance evaluation updated successfully',
                'status': 200,
                'data': response_serializer.data
            })
        return Response({
            'success': False,
            'message': 'Validation failed',
            'errors': serializer.errors,
            'status': 400
        }, status=400)

    def destroy(self, request, *args, **kwargs):
        if not self.is_admin_user(request.user):
            return Response({
                'success': False,
                'message': 'Only admins and super admins can delete performance evaluations',
                'status': 403
            }, status=403)
        
        instance = self.get_object()
        instance.delete()
        return Response({
            'success': True,
            'message': 'Performance evaluation deleted successfully',
            'status': 200
        })

    @action(detail=True, methods=['post'], url_path='submit')
    def submit(self, request, pk=None):
        """Submit a draft evaluation for review"""
        if not self.is_admin_user(request.user):
            return Response({
                'success': False,
                'message': 'Only admins and super admins can submit evaluations',
                'status': 403
            }, status=403)
        
        evaluation = self.get_object()
        if evaluation.status != 'draft':
            return Response({
                'success': False,
                'message': f'Evaluation is already {evaluation.status}',
                'status': 400
            }, status=400)
        
        evaluation.status = 'submitted'
        evaluation.save()
        serializer = self.get_serializer(evaluation)
        return Response({
            'success': True,
            'message': 'Evaluation submitted for review',
            'status': 200,
            'data': serializer.data
        })

    @action(detail=True, methods=['post'], url_path='review')
    def review(self, request, pk=None):
        """Review an evaluation (move from submitted to reviewed)"""
        if not self.is_admin_user(request.user):
            return Response({
                'success': False,
                'message': 'Only admins and super admins can review evaluations',
                'status': 403
            }, status=403)
        
        evaluation = self.get_object()
        if evaluation.status != 'submitted':
            return Response({
                'success': False,
                'message': f'Evaluation must be submitted before review. Current status: {evaluation.status}',
                'status': 400
            }, status=400)
        
        evaluation.status = 'reviewed'
        evaluation.reviewed_by = request.user
        evaluation.reviewed_at = timezone.now()
        evaluation.save()
        serializer = self.get_serializer(evaluation)
        return Response({
            'success': True,
            'message': 'Evaluation reviewed',
            'status': 200,
            'data': serializer.data
        })

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        """Approve an evaluation (move from reviewed to approved)"""
        if not self.is_admin_user(request.user):
            return Response({
                'success': False,
                'message': 'Only admins and super admins can approve evaluations',
                'status': 403
            }, status=403)
        
        evaluation = self.get_object()
        if evaluation.status != 'reviewed':
            return Response({
                'success': False,
                'message': f'Evaluation must be reviewed before approval. Current status: {evaluation.status}',
                'status': 400
            }, status=400)
        
        evaluation.status = 'approved'
        evaluation.approved_by = request.user
        evaluation.approved_at = timezone.now()
        evaluation.save()
        serializer = self.get_serializer(evaluation)
        return Response({
            'success': True,
            'message': 'Evaluation approved',
            'status': 200,
            'data': serializer.data
        })

    @action(detail=False, methods=['get'], url_path='by-teacher/(?P<teacher_id>[^/.]+)')
    def by_teacher(self, request, teacher_id=None):
        """Get all evaluations for a specific teacher"""
        try:
            teacher = Teacher.objects.get(id=teacher_id)
        except Teacher.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Teacher not found',
                'status': 404
            }, status=404)
        
        # Check permission - teachers can only view their own
        user = request.user
        try:
            user_teacher = Teacher.objects.get(user=user)
            if user_teacher.id != teacher.id and not self.is_admin_user(user):
                return Response({
                    'success': False,
                    'message': 'You can only view your own evaluations',
                    'status': 403
                }, status=403)
        except Teacher.DoesNotExist:
            if not self.is_admin_user(user):
                return Response({
                    'success': False,
                    'message': 'Permission denied',
                    'status': 403
                }, status=403)
        
        evaluations = self.queryset.filter(teacher=teacher).order_by('-evaluated_at')
        serializer = self.get_serializer(evaluations, many=True)
        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        })

    @action(detail=False, methods=['get'], url_path='my-evaluations')
    def my_evaluations(self, request):
        """Get evaluations for the logged-in teacher"""
        try:
            teacher = Teacher.objects.get(user=request.user)
        except Teacher.DoesNotExist:
            return Response({
                'success': False,
                'message': 'You are not registered as a teacher',
                'status': 403
            }, status=403)
        
        evaluations = self.queryset.filter(teacher=teacher).order_by('-evaluated_at')
        serializer = self.get_serializer(evaluations, many=True)
        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        })
