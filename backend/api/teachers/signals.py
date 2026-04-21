"""Signals for auto-calculating teacher performance metrics"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Avg, Count, Q
from decimal import Decimal

from lessontopics.models import ExamResults
from schedule.models import Attendance
from .models import TeacherMetrics, TeacherAssignment, TeacherTask


@receiver(post_save, sender=ExamResults)
@receiver(post_delete, sender=ExamResults)
def update_teacher_exam_metrics(sender, instance, **kwargs):
    """Update teacher metrics when exam results are saved/deleted"""
    teacher_assignment = instance.teacher_assignment
    teacher = teacher_assignment.teacher
    term = instance.exam.term
    # Use first day of the month from term's start_date
    month = term.start_date.replace(day=1)

    # Get or create metrics for this teacher-month
    metrics, created = TeacherMetrics.objects.get_or_create(
        teacher=teacher,
        month=month,
        defaults={
            'average_student_performance': Decimal('0'),
            'attendance_percentage': Decimal('100'),
            'total_working_days': 0,
            'days_present': 0,
            'days_absent': 0,
            'task_completion_rate': Decimal('0'),
            'total_tasks_assigned': 0,
            'total_tasks_completed': 0,
            'tasks_overdue': 0,
            'lesson_coverage_percentage': Decimal('0'),
            'lessons_planned': 0,
            'lessons_completed': 0,
            'average_rating': None,
            'total_ratings_received': 0,
        }
    )

    # Calculate exam metrics for this teacher in this term
    exam_results = ExamResults.objects.filter(
        teacher_assignment__teacher=teacher,
        exam__term=term
    )

    if exam_results.exists():
        avg_score = exam_results.aggregate(avg=Avg('percentage'))['avg'] or 0
        total_exams = exam_results.values('exam').distinct().count()
        total_students = exam_results.values('student').distinct().count()

        # Store exam-derived metrics in average_student_performance field
        metrics.average_student_performance = Decimal(str(avg_score))
        metrics.save()


@receiver(post_save, sender=Attendance)
@receiver(post_delete, sender=Attendance)
def update_teacher_attendance_metrics(sender, instance, **kwargs):
    """Update teacher attendance-related metrics"""
    teacher_assignment = instance.teacher_assignment
    if not teacher_assignment:
        return
    teacher = teacher_assignment.teacher
    
    # Calculate average attendance percentage for classes taught by this teacher
    from schedule.models import ClassScheduleSlot
    
    # Get all schedule slots for this teacher
    teacher_slots = ClassScheduleSlot.objects.filter(
        teacher_assignment__teacher=teacher
    )
    
    if teacher_slots.exists():
        # Calculate average attendance across all their classes
        attendance_records = Attendance.objects.filter(
            schedule_slot__in=teacher_slots
        )
        
        if attendance_records.exists():
            present_count = attendance_records.filter(status='Present').count()
            total_count = attendance_records.count()
            avg_attendance = (present_count / total_count * 100) if total_count > 0 else 0
            
            # Get month from attendance instance date (first day of month)
            from datetime import date, datetime
            attendance_date = instance.date
            # Handle both date objects and strings
            if isinstance(attendance_date, str):
                attendance_date = datetime.strptime(attendance_date, '%Y-%m-%d').date()
            month_start = date(attendance_date.year, attendance_date.month, 1)
            
            metrics, _ = TeacherMetrics.objects.get_or_create(
                teacher=teacher,
                month=month_start,
                defaults={
                    'attendance_percentage': Decimal('0'),
                    'average_student_performance': Decimal('0'),
                    'task_completion_rate': Decimal('0'),
                    'lesson_coverage_percentage': Decimal('0')
                }
            )
            metrics.attendance_percentage = Decimal(str(avg_attendance))
            metrics.save()


@receiver(post_save, sender=TeacherTask)
@receiver(post_delete, sender=TeacherTask)
def update_teacher_task_metrics(sender, instance, **kwargs):
    """Update teacher task completion metrics when tasks are saved/deleted"""
    teacher = instance.teacher
    
    # Get month from task date (first day of month)
    from datetime import date
    month_start = date(instance.date.year, instance.date.month, 1)
    
    # Calculate task metrics for this teacher-month
    tasks = TeacherTask.objects.filter(
        teacher=teacher,
        date__year=instance.date.year,
        date__month=instance.date.month
    )
    
    total_tasks = tasks.count()
    completed_tasks = tasks.filter(status='completed').count()
    
    # Calculate completion rate
    completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
    
    metrics, _ = TeacherMetrics.objects.get_or_create(
        teacher=teacher,
        month=month_start,
        defaults={
            'attendance_percentage': Decimal('0'),
            'average_student_performance': Decimal('0'),
            'task_completion_rate': Decimal('0'),
            'lesson_coverage_percentage': Decimal('0')
        }
    )
    metrics.task_completion_rate = Decimal(str(completion_rate))
    metrics.total_tasks_assigned = total_tasks
    metrics.total_tasks_completed = completed_tasks
    metrics.save()
