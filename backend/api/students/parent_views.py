from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import check_password
from users.models import User
from .models import Parent, Student, ParentStudent
from .parent_serializers import (
    ParentSerializer, 
    ParentRegistrationSerializer,
    ParentDashboardSerializer
)
from academics.models import Class, Section

class ParentLoginView(APIView):
    """
    Parent login using email and password
    Returns JWT token and parent info with linked students
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response(
                {'error': 'Please provide both email and password'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(email=email, role='parent')
        except User.DoesNotExist:
            return Response(
                {'error': 'Invalid credentials or not a parent account'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Check password
        if not check_password(password, user.password):
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Get parent profile
        try:
            parent = Parent.objects.get(user=user)
        except Parent.DoesNotExist:
            return Response(
                {'error': 'Parent profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get linked students
        parent_students = ParentStudent.objects.filter(parent=parent).select_related('student', 'relationship')
        students_data = []
        
        for ps in parent_students:
            student = ps.student
            students_data.append({
                'id': str(student.id),
                'student_id': student.student_id,
                'full_name': student.user.full_name,
                'grade': student.grade.name if student.grade else None,
                'section': student.section.name if student.section else None,
                'relationship': ps.relationship.name if ps.relationship else None,
                'gender': student.gender,
            })
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'parent': {
                'id': str(parent.id),
                'email': user.email,
                'full_name': user.full_name,
                'phone': parent.mobile_telephone,
            },
            'students': students_data
        }, status=status.HTTP_200_OK)

class ParentDashboardView(APIView):
    """
    Get parent dashboard data for a specific student
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, student_id=None):
        try:
            # Verify the user is a parent
            try:
                parent = Parent.objects.get(user=request.user)
            except Parent.DoesNotExist:
                return Response(
                    {'success': True, 'message': 'Parent profile not found', 'data': {
                        'student': None,
                        'all_students': [],
                        'attendance': [],
                        'schedule': [],
                        'assignments': [],
                        'announcements': [],
                        'progress': {},
                    }},
                    status=status.HTTP_200_OK
                )
            
            # Get linked students
            parent_students = ParentStudent.objects.filter(parent=parent).select_related('student')
            
            if not parent_students.exists():
                # Return empty dashboard data instead of 404
                return Response({
                    'success': True,
                    'message': 'No students linked to this parent yet',
                    'data': {
                        'student': None,
                        'all_students': [],
                        'attendance': [],
                        'schedule': [],
                        'assignments': [],
                        'announcements': [],
                        'progress': {},
                    }
                }, status=status.HTTP_200_OK)
            
            # If student_id provided, use that student, otherwise use first student
            if student_id:
                try:
                    parent_student = parent_students.get(student_id=student_id)
                    student = parent_student.student
                except ParentStudent.DoesNotExist:
                    return Response(
                        {'success': True, 'message': 'Student not found or not linked to this parent', 'data': {
                            'student': None,
                            'all_students': [],
                            'attendance': [],
                            'schedule': [],
                            'assignments': [],
                            'announcements': [],
                            'progress': {},
                        }},
                        status=status.HTTP_200_OK
                    )
            else:
                parent_student = parent_students.first()
                student = parent_student.student
            
            # Gather dashboard data with error handling
            try:
                dashboard_data = {
                    'student': {
                        'id': str(student.id),
                        'student_id': student.student_id,
                        'full_name': student.user.full_name,
                        'email': student.user.email,
                        'grade': student.grade.name if student.grade else None,
                        'section': student.section.name if student.section else None,
                        'gender': student.gender,
                        'birth_date': student.birth_date,
                        'citizenship': student.citizenship,
                    },
                    'all_students': [
                        {
                            'id': str(ps.student.id),
                            'student_id': ps.student.student_id,
                            'full_name': ps.student.user.full_name,
                            'grade': ps.student.grade.name if ps.student.grade else None,
                            'section': ps.student.section.name if ps.student.section else None,
                            'relationship': ps.relationship.name if ps.relationship else None,
                        }
                        for ps in parent_students
                    ],
                    'enrolled_subjects_count': self._get_enrolled_subjects_count(student),
                    'attendance': self._get_attendance(student),
                    'schedule': self._get_schedule(student),
                    'assignments': self._get_assignments(student),
                    'announcements': self._get_announcements(student),
                    'exams': self._get_exams(student),
                    'exam_results': self._get_exam_results(student),
                    'progress': self._get_progress(student),
                }
            except Exception as e:
                # If there's an error gathering dashboard data, return basic student info only
                dashboard_data = {
                    'student': {
                        'id': str(student.id),
                        'student_id': student.student_id,
                        'full_name': student.user.full_name,
                        'email': student.user.email,
                        'grade': student.grade.name if student.grade else None,
                        'section': student.section.name if student.section else None,
                    },
                    'all_students': [
                        {
                            'id': str(ps.student.id),
                            'student_id': ps.student.student_id,
                            'full_name': ps.student.user.full_name,
                            'grade': ps.student.grade.name if ps.student.grade else None,
                            'section': ps.student.section.name if ps.student.section else None,
                            'relationship': ps.relationship.name if ps.relationship else None,
                        }
                        for ps in parent_students
                    ],
                    'attendance': [],
                    'schedule': [],
                    'assignments': [],
                    'announcements': [],
                    'progress': {},
                }
            
            return Response({
                'success': True,
                'message': 'Dashboard data retrieved successfully',
                'data': dashboard_data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            # Catch any unexpected errors and return safe response
            return Response({
                'success': True,
                'message': f'Dashboard loaded with limited functionality',
                'data': {
                    'student': None,
                    'all_students': [],
                    'attendance': [],
                    'schedule': [],
                    'assignments': [],
                    'announcements': [],
                    'progress': {},
                }
            }, status=status.HTTP_200_OK)
    
    def _get_attendance(self, student):
        """Get attendance summary for student"""
        from attendance.models import Attendance
        
        attendance_records = Attendance.objects.filter(student=student).order_by('-date')[:30]
        
        present_count = attendance_records.filter(status='present').count()
        absent_count = attendance_records.filter(status='absent').count()
        late_count = attendance_records.filter(status='late').count()
        total = attendance_records.count()
        
        attendance_percentage = (present_count / total * 100) if total > 0 else 0
        
        return {
            'summary': {
                'present': present_count,
                'absent': absent_count,
                'late': late_count,
                'total': total,
                'percentage': round(attendance_percentage, 2),
            },
            'recent_records': [
                {
                    'date': record.date.isoformat(),
                    'status': record.status,
                    'notes': record.notes,
                }
                for record in attendance_records[:10]
            ]
        }
    
    def _get_enrolled_subjects_count(self, student):
        """Get count of subjects enrolled by student"""
        from .models import StudentSubject
        return StudentSubject.objects.filter(student=student).count()

    def _get_schedule(self, student):
        """Get weekly schedule for student"""
        from schedule.models import ClassScheduleSlot
        from datetime import datetime
        import pytz

        if not student.grade or not student.section:
            return []

        # Get today's schedule
        today = datetime.now(pytz.UTC).strftime('%A')

        schedules = ClassScheduleSlot.objects.filter(
            class_fk=student.grade,
            section=student.section,
            day_of_week=today
        ).select_related('subject', 'teacher_assignment', 'classroom').order_by('start_time')

        schedule_list = []
        for slot in schedules:
            teacher_name = None
            if slot.teacher_assignment and slot.teacher_assignment.teacher:
                teacher_name = slot.teacher_assignment.teacher.user.full_name

            schedule_list.append({
                'id': str(slot.id),
                'subject': slot.subject.name if slot.subject else None,
                'subject_details': {'name': slot.subject.name} if slot.subject else None,
                'teacher': teacher_name,
                'teacher_details': {'teacher_id': {'user': {'full_name': teacher_name}}} if teacher_name else None,
                'start_time': slot.start_time.strftime('%H:%M') if slot.start_time else None,
                'end_time': slot.end_time.strftime('%H:%M') if slot.end_time else None,
                'classroom': slot.classroom.name if slot.classroom else None,
                'day_of_week': slot.day_of_week,
                'period_number': slot.period_number,
            })

        return schedule_list

    def _get_exams(self, student):
        """Get upcoming exams for student's class/section"""
        from schedule.models import Exam
        from datetime import datetime
        import pytz

        if not student.grade:
            return []

        today = datetime.now(pytz.UTC).date()

        exams = Exam.objects.filter(
            class_fk=student.grade,
            start_date__gte=today
        ).select_related('subject', 'term').order_by('start_date', 'start_time')[:10]

        if student.section:
            exams = exams.filter(section=student.section)

        return [
            {
                'id': str(exam.id),
                'name': exam.name,
                'exam_type': exam.exam_type,
                'subject': exam.subject.name if exam.subject else 'N/A',
                'subject_details': {'name': exam.subject.name} if exam.subject else None,
                'start_date': exam.start_date.isoformat() if exam.start_date else None,
                'end_date': exam.end_date.isoformat() if exam.end_date else None,
                'start_time': exam.start_time.strftime('%H:%M') if exam.start_time else None,
                'end_time': exam.end_time.strftime('%H:%M') if exam.end_time else None,
                'max_score': exam.max_score,
                'description': exam.description,
            }
            for exam in exams
        ]

    def _get_exam_results(self, student):
        """Get exam results for student"""
        from lessontopics.models import ExamResults

        results = ExamResults.objects.filter(
            student=student
        ).select_related('exam', 'subject', 'teacher_assignment').order_by('-recorded_at')[:10]

        return [
            {
                'id': str(result.id),
                'exam_id': str(result.exam.id) if result.exam else None,
                'exam_details': {
                    'name': result.exam.name if result.exam else 'N/A',
                    'exam_type': result.exam.exam_type if result.exam else None,
                },
                'subject_id_name': result.subject.name if result.subject else (
                    result.teacher_assignment.subject.name if result.teacher_assignment and result.teacher_assignment.subject else 'N/A'
                ),
                'subject_details': {
                    'name': result.subject.name if result.subject else (
                        result.teacher_assignment.subject.name if result.teacher_assignment and result.teacher_assignment.subject else 'N/A'
                    )
                },
                'score': result.score,
                'max_score': result.max_score,
                'percentage': float(result.percentage) if result.percentage else None,
                'grade': result.grade,
                'remarks': result.remarks,
                'recorded_at': result.recorded_at.isoformat() if result.recorded_at else None,
            }
            for result in results
        ]
    
    def _get_assignments(self, student):
        """Get assignments for student's grade/section"""
        from tasks.models import Task
        
        if not student.grade or not student.section:
            return []
        
        assignments = Task.objects.filter(
            grade=student.grade,
            section=student.section,
            task_type='assignment'
        ).order_by('-created_at')[:10]
        
        return [
            {
                'id': str(assignment.id),
                'title': assignment.title,
                'description': assignment.description,
                'due_date': assignment.due_date.isoformat() if assignment.due_date else None,
                'subject': assignment.subject.name if assignment.subject else None,
                'status': assignment.status,
            }
            for assignment in assignments
        ]
    
    def _get_announcements(self, student):
        """Get announcements filtered by student's grade/section"""
        from communication.models import Announcement
        
        announcements = Announcement.objects.filter(
            target_audience='all'
        ).order_by('-created_at')[:10]
        
        # Filter by grade/section if specified
        if student.grade:
            grade_announcements = Announcement.objects.filter(
                target_grade=student.grade
            ).order_by('-created_at')[:10]
            announcements = announcements.union(grade_announcements)
        
        return [
            {
                'id': str(ann.id),
                'title': ann.title,
                'message': ann.message,
                'urgency': ann.urgency,
                'event_date': ann.event_date.isoformat() if ann.event_date else None,
                'created_at': ann.created_at.isoformat() if ann.created_at else None,
            }
            for ann in announcements[:10]
        ]
    
    def _get_progress(self, student):
        """Get academic progress for student"""
        from academics.models import Grade
        
        grades = Grade.objects.filter(student=student).select_related('subject')
        
        subject_progress = {}
        for grade in grades:
            subject_name = grade.subject.name if grade.subject else 'Unknown'
            if subject_name not in subject_progress:
                subject_progress[subject_name] = []
            subject_progress[subject_name].append({
                'score': grade.score,
                'max_score': grade.max_score,
                'percentage': (grade.score / grade.max_score * 100) if grade.max_score else 0,
                'grade_type': grade.grade_type,
            })
        
        # Calculate overall averages
        overall_average = 0
        subject_count = len(subject_progress)
        
        if subject_count > 0:
            total_percentage = sum(
                sum(g['percentage'] for g in grades) / len(grades)
                for grades in subject_progress.values()
            )
            overall_average = total_percentage / subject_count
        
        return {
            'overall_average': round(overall_average, 2),
            'subject_progress': subject_progress,
        }

class ParentProfileView(APIView):
    """
    Get/Update parent profile
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        try:
            parent = Parent.objects.get(user=request.user)
        except Parent.DoesNotExist:
            return Response(
                {'error': 'Parent profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = ParentSerializer(parent)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def put(self, request):
        try:
            parent = Parent.objects.get(user=request.user)
        except Parent.DoesNotExist:
            return Response(
                {'error': 'Parent profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = ParentSerializer(parent, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
