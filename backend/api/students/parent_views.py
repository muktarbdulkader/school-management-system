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
                        'grade': student.grade.grade if student.grade else None,
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
                            'grade': ps.student.grade.grade if ps.student.grade else None,
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
                    'report_card': self._get_report_card(student),
                    'progress': self._get_progress(student),
                    'behavior_ratings': self._get_behavior_ratings_summary(student),
                }
            except Exception as e:
                # If there's an error gathering dashboard data, return basic student info only
                import traceback
                print(f"[PARENT DASHBOARD ERROR] {str(e)}")
                print(f"[PARENT DASHBOARD TRACEBACK] {traceback.format_exc()}")
                dashboard_data = {
                    'student': {
                        'id': str(student.id),
                        'student_id': student.student_id,
                        'full_name': student.user.full_name,
                        'email': student.user.email,
                        'grade': student.grade.grade if student.grade else None,
                        'section': student.section.name if student.section else None,
                    },
                    'all_students': [
                        {
                            'id': str(ps.student.id),
                            'student_id': ps.student.student_id,
                            'full_name': ps.student.user.full_name,
                            'grade': ps.student.grade.grade if ps.student.grade else None,
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
                    'behavior_ratings': {
                        'average_rating': 0,
                        'raw_average': 0,
                        'total_ratings': 0,
                        'recent_incidents_count': 0,
                        'category_averages': {}
                    },
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
        from schedule.models import Attendance
        from django.db.models import Count, Q
        
        # Get all records for counting (filter before slicing)
        all_records = Attendance.objects.filter(student=student)
        
        # Calculate counts from full queryset
        present_count = all_records.filter(status='present').count()
        absent_count = all_records.filter(status='absent').count()
        late_count = all_records.filter(status='late').count()
        total = all_records.count()
        
        attendance_percentage = (present_count / total * 100) if total > 0 else 0
        
        # Get recent records (slice after filtering)
        recent_records = all_records.order_by('-date')[:30]
        
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
                for record in recent_records[:10]
            ]
        }
    
    def _get_enrolled_subjects_count(self, student):
        """Get count of subjects enrolled by student"""
        from .models import StudentSubject
        return StudentSubject.objects.filter(student=student).count()

    def _get_schedule(self, student):
        """Get schedule for student - show all classes for the week with lesson plan info"""
        from schedule.models import ClassScheduleSlot
        from lessontopics.models import LessonPlans
        from datetime import datetime
        import pytz
        
        if not student.grade or not student.section:
            return []
        
        # Get schedule slots for student's class/section (all days)
        schedule_slots = ClassScheduleSlot.objects.filter(
            class_fk=student.grade,
            section=student.section
        ).select_related('subject', 'classroom', 'teacher_assignment', 'teacher_assignment__teacher', 'teacher_assignment__teacher__user').order_by('day_of_week', 'start_time')[:20]
        
        # Get current time for status calculation
        now = datetime.now(pytz.UTC)
        current_time = now.time()
        today = now.strftime('%A').lower()
        
        schedule_list = []
        for slot in schedule_slots:
            # Get teacher info
            teacher_name = None
            if slot.teacher_assignment and slot.teacher_assignment.teacher and slot.teacher_assignment.teacher.user:
                teacher_name = slot.teacher_assignment.teacher.user.full_name
            
            # Calculate class status based on current time
            status = 'Scheduled'
            if slot.day_of_week.lower() == today and slot.start_time and slot.end_time:
                if slot.start_time <= current_time <= slot.end_time:
                    status = 'In Progress'
                elif current_time > slot.end_time:
                    status = 'Completed'
            
            # Get current lesson plan for this slot
            current_unit = None
            try:
                lesson_plan = LessonPlans.objects.filter(
                    class_fk=student.grade,
                    section=student.section,
                    subject=slot.subject
                ).select_related('unit').first()
                
                if lesson_plan and lesson_plan.unit:
                    current_unit = {
                        'id': str(lesson_plan.unit.id),
                        'name': lesson_plan.unit.name
                    }
            except:
                pass
            
            schedule_list.append({
                'id': str(slot.id),
                'day_of_week': slot.day_of_week,
                'start_time': slot.start_time.strftime('%H:%M') if slot.start_time else None,
                'end_time': slot.end_time.strftime('%H:%M') if slot.end_time else None,
                'subject': slot.subject.name if slot.subject else 'Unknown Subject',
                'teacher_name': teacher_name or 'Not assigned',
                'teacher_id': str(slot.teacher_assignment.teacher.id) if slot.teacher_assignment and slot.teacher_assignment.teacher else None,
                'room': slot.classroom.name if slot.classroom else 'TBD',
                'period_number': slot.period_number,
                'status': status,
                'current_unit': current_unit,
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

        # Build query filters first, then slice
        exams_query = Exam.objects.filter(
            class_fk=student.grade,
            start_date__gte=today
        )
        
        if student.section:
            exams_query = exams_query.filter(section=student.section)
        
        exams = exams_query.select_related('subject', 'term').order_by('start_date', 'start_time')[:10]

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

    def _get_report_card(self, student):
        """Get current term report card for student with subject grades"""
        from lessontopics.models import ReportCard, ReportCardSubject
        from academics.models import Term

        # Get current term
        current_term = Term.objects.filter(is_current=True).first()
        if not current_term and student.current_term:
            current_term = student.current_term

        if not current_term:
            return None

        # Get report card for current term
        report_card = ReportCard.objects.filter(
            student=student,
            term=current_term
        ).prefetch_related('subjects').first()

        if not report_card:
            return None

        # Build subjects data with component breakdown
        subjects_data = []
        for subject in report_card.subjects.all():
            subjects_data.append({
                'id': str(subject.id),
                'subject': subject.subject.name if subject.subject else 'N/A',
                'subject_details': {
                    'name': subject.subject.name if subject.subject else 'N/A',
                    'code': subject.subject.code if subject.subject else None,
                },
                'exam_score': float(subject.exam_score) if subject.exam_score else None,
                'exam_max_score': float(subject.exam_max_score) if subject.exam_max_score else 100,
                'assignment_avg': float(subject.assignment_avg) if subject.assignment_avg else None,
                'assignment_max': float(subject.assignment_max) if subject.assignment_max else 100,
                'attendance_score': float(subject.attendance_score) if subject.attendance_score else None,
                'attendance_max': float(subject.attendance_max) if subject.attendance_max else 100,
                'total_score': float(subject.total_score) if subject.total_score else None,
                'total_max': float(subject.total_max) if subject.total_max else 100,
                'percentage': float(subject.percentage) if subject.percentage else None,
                'descriptive_grade': subject.descriptive_grade,
                'letter_grade': subject.letter_grade,
                'teacher_comment': subject.teacher_comment,
            })

        return {
            'id': str(report_card.id),
            'term': {
                'id': str(report_card.term.id) if report_card.term else None,
                'name': report_card.term.name if report_card.term else 'N/A',
            },
            'overall_percentage': float(report_card.overall_percentage) if report_card.overall_percentage else None,
            'rank_in_class': report_card.rank_in_class,
            'total_students': report_card.total_students,
            'teacher_remarks': report_card.teacher_remarks,
            'principal_remarks': report_card.principal_remarks,
            'is_published': report_card.is_published,
            'subjects': subjects_data,
        }

    def _get_exam_results(self, student):
        """Get exam results for student"""
        from lessontopics.models import ExamResults

        results = ExamResults.objects.filter(
            student=student
        ).select_related('exam', 'subject', 'teacher_assignment').order_by('-recorded_at')[:10]

        def infer_exam_type(exam):
            """Infer exam type from exam name or existing type"""
            if not exam:
                return None
            # Use existing exam_type if available
            if exam.exam_type:
                return exam.exam_type
            # Try to infer from name
            name_lower = exam.name.lower() if exam.name else ''
            if 'mid' in name_lower or 'midterm' in name_lower:
                return 'mid_term'
            if 'final' in name_lower:
                return 'final'
            if 'diagnostic' in name_lower:
                return 'diagnostic_test'
            if 'quiz' in name_lower or 'unit' in name_lower:
                return 'unit_test'
            return 'other'

        return [
            {
                'id': str(result.id),
                'exam_id': str(result.exam.id) if result.exam else None,
                'exam_details': {
                    'name': result.exam.name if result.exam else 'N/A',
                    'exam_type': infer_exam_type(result.exam),
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
        from lessontopics.models import Assignments
        from django.db.models import Q
        
        if not student.grade or not student.section:
            return []
        
        # Get assignments by class/section OR class-only OR directly assigned to student
        assignments = Assignments.objects.filter(
            Q(class_fk=student.grade, section=student.section) |  # Class + section specific
            Q(class_fk=student.grade, section__isnull=True) |      # Class-level (no section)
            Q(students=student)                                     # Directly assigned
        ).distinct().order_by('-created_at')[:10]
        
        return [
            {
                'id': str(assignment.id),
                'title': assignment.title,
                'description': assignment.description,
                'due_date': assignment.due_date.isoformat() if assignment.due_date else None,
                'subject': assignment.teacher_assignment.subject.name if assignment.teacher_assignment and assignment.teacher_assignment.subject else None,
                'is_active': assignment.is_active,
            }
            for assignment in assignments
        ]
    
    def _get_announcements(self, student):
        """Get announcements for student"""
        from communication.models import Announcement
        
        # Get recent announcements (announcement model has audience_roles, not target_audience)
        announcements = Announcement.objects.all().order_by('-created_at')[:10]
        
        return [
            {
                'id': str(ann.id),
                'title': ann.title,
                'message': ann.message,
                'urgency': ann.urgency,
                'event_date': ann.event_date.isoformat() if ann.event_date else None,
                'created_at': ann.created_at.isoformat() if ann.created_at else None,
            }
            for ann in announcements
        ]
    
    def _get_progress(self, student):
        """Get academic progress for student using ExamResults"""
        from lessontopics.models import ExamResults
        from django.db.models import Avg
        
        # Get exam results for the student
        exam_results = ExamResults.objects.filter(student=student).select_related('subject', 'teacher_assignment')
        
        subject_progress = {}
        for result in exam_results:
            # Get subject name from either subject or teacher_assignment
            subject_name = 'Unknown'
            if result.subject:
                subject_name = result.subject.name
            elif result.teacher_assignment and result.teacher_assignment.subject:
                subject_name = result.teacher_assignment.subject.name
                
            if subject_name not in subject_progress:
                subject_progress[subject_name] = []
            subject_progress[subject_name].append({
                'score': result.score,
                'max_score': result.max_score,
                'percentage': float(result.percentage) if result.percentage else 0,
                'grade': result.grade,
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
    
    def _get_behavior_ratings_summary(self, student):
        """Get behavior ratings summary for student"""
        from django.db.models import Avg
        from .models import BehaviorRatings, BehaviorIncidents
        
        print(f"[BEHAVIOR SUMMARY] Getting ratings for student: {student.id}")
        
        # Calculate average behavior rating (1-5 scale)
        ratings = BehaviorRatings.objects.filter(student=student)
        avg_rating = ratings.aggregate(Avg('rating'))['rating__avg']
        print(f"[BEHAVIOR SUMMARY] Average rating: {avg_rating}, Count: {ratings.count()}")
        
        # Get behavior incidents count
        incidents = BehaviorIncidents.objects.filter(student=student)
        incident_count = incidents.count()
        
        # Calculate behavior score
        if avg_rating:
            # Use ratings if available
            average_rating = (avg_rating / 5) * 100
        elif incident_count > 0:
            # No ratings but has incidents
            deduction = min(incident_count * 10, 50)
            average_rating = 100 - deduction
            avg_rating = average_rating / 20
        else:
            average_rating = 0
            avg_rating = 0
        
        # Get recent behavior incidents
        recent_incidents = incidents.order_by('-incident_date')[:5]
        
        # Calculate rating distribution
        rating_counts = {}
        for r in ratings:
            rating_counts[r.category] = rating_counts.get(r.category, {'count': 0, 'total': 0})
            rating_counts[r.category]['count'] += 1
            rating_counts[r.category]['total'] += r.rating
        
        category_averages = {}
        for cat, data in rating_counts.items():
            cat_avg = (data['total'] / data['count']) if data['count'] > 0 else 0
            category_averages[cat] = round((cat_avg / 5) * 100, 1)
        
        return {
            'average_rating': round(average_rating, 1),
            'raw_average': round(avg_rating, 1) if avg_rating else 0,
            'total_ratings': ratings.count(),
            'recent_incidents_count': incident_count,
            'category_averages': category_averages,
            'rating_scale': '1-5 (converted to 0-100%)',
            'has_incidents': incident_count > 0
        }
    
    def _get_unit_progress(self, student):
        """Get unit/subunit progress for student with completion details"""
        from lessontopics.models import ClassUnitProgress, ClassSubunitProgress, ObjectiveUnits, ObjectiveSubunits
        from lessontopics.serializers import LessonPlansSerializer
        
        # Get student's class and section
        class_obj = student.grade
        section = student.section
        
        # Get all units for student's class/subjects
        unit_progress = ClassUnitProgress.objects.filter(
            class_fk=class_obj,
            section=section
        ).select_related('unit', 'subject')
        
        progress_data = {
            'completed': [],
            'in_progress': [],
            'upcoming': []
        }
        
        for prog in unit_progress:
            unit_data = {
                'unit_id': str(prog.unit.id),
                'unit_name': prog.unit.name,
                'subject_name': prog.subject.name if prog.subject else 'Unknown',
                'is_completed': prog.is_completed,
                'is_current': prog.is_current,
                'completed_at': prog.completed_at.isoformat() if prog.completed_at else None,
                'updated_at': prog.updated_at.isoformat() if prog.updated_at else None,
            }
            
            # Get subunits for this unit
            subunits = ObjectiveSubunits.objects.filter(unit=prog.unit)
            subunit_progress = []
            completed_subunits = 0
            
            for sub in subunits:
                sub_prog = ClassSubunitProgress.objects.filter(
                    class_fk=class_obj,
                    section=section,
                    subunit=sub
                ).first()
                
                is_sub_completed = sub_prog.is_completed if sub_prog else False
                if is_sub_completed:
                    completed_subunits += 1
                
                # Get lesson plans for this subunit
                from lessontopics.models import LessonPlans
                lessons = LessonPlans.objects.filter(
                    class_fk=class_obj,
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
                
                subunit_progress.append({
                    'subunit_id': str(sub.id),
                    'subunit_name': sub.name,
                    'is_completed': is_sub_completed,
                    'completed_at': sub_prog.completed_at.isoformat() if sub_prog and sub_prog.completed_at else None,
                    'lessons': lesson_data
                })
            
            # Calculate completion percentage
            total_subunits = len(subunits)
            completion_percentage = int((completed_subunits / total_subunits * 100)) if total_subunits > 0 else (100 if prog.is_completed else 0)
            
            unit_data['subunits'] = subunit_progress
            unit_data['completion_percentage'] = completion_percentage
            unit_data['completed_subunits'] = completed_subunits
            unit_data['total_subunits'] = total_subunits
            
            # Categorize
            if prog.is_completed:
                progress_data['completed'].append(unit_data)
            elif prog.is_current:
                progress_data['in_progress'].append(unit_data)
            else:
                progress_data['upcoming'].append(unit_data)
        
        return {
            'total_units': len(unit_progress),
            'completed_count': len(progress_data['completed']),
            'in_progress_count': len(progress_data['in_progress']),
            'upcoming_count': len(progress_data['upcoming']),
            'overall_percentage': int((len(progress_data['completed']) / len(unit_progress) * 100)) if len(unit_progress) > 0 else 0,
            'units': progress_data
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


class ParentStudentUnitProgressView(APIView):
    """
    Get detailed unit progress for a parent's child
    Shows completed units, in-progress units, and upcoming units with lesson details
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, student_id=None):
        user = request.user
        
        # Verify this is a parent viewing their own child
        try:
            parent = Parent.objects.get(user=user)
            student = Student.objects.get(id=student_id)
            
            # Check if this student belongs to this parent
            if not ParentStudent.objects.filter(parent=parent, student=student).exists():
                return Response(
                    {'error': 'You can only view progress for your own children'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except (Parent.DoesNotExist, Student.DoesNotExist):
            return Response(
                {'error': 'Parent or student not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get unit progress using the ParentDashboardView method
        dashboard_view = ParentDashboardView()
        unit_progress = dashboard_view._get_unit_progress(student)
        
        return Response({
            'success': True,
            'student_id': str(student.id),
            'student_name': student.user.full_name if student.user else 'Unknown',
            'class': student.grade.grade if student.grade else 'Unknown',
            'section': student.section.name if student.section else 'Unknown',
            'unit_progress': unit_progress
        }, status=status.HTTP_200_OK)
