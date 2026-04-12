"""Signals for auto-calculating teacher performance metrics"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Avg, Count, Q
from decimal import Decimal

from lessontopics.models import ExamResults
from schedule.models import Attendance
from .models import TeacherMetrics, TeacherAssignment


@receiver(post_save, sender=ExamResults)
@receiver(post_delete, sender=ExamResults)
def update_teacher_exam_metrics(sender, instance, **kwargs):
    """Update teacher metrics when exam results are saved/deleted"""
    teacher_assignment = instance.teacher_assignment
    teacher = teacher_assignment.teacher
    term = instance.exam.term
    
    # Get or create metrics for this teacher-term
    metrics, created = TeacherMetrics.objects.get_or_create(
        teacher=teacher,
        term=term,
        defaults={
            'average_exam_score': 0,
            'student_pass_rate': 0,
            'total_exams_conducted': 0,
            'total_students_evaluated': 0,
            'assignment_completion_rate': 0,
            'average_attendance_percentage': 0,
            'classroom_observation_score': 0,
            'parent_satisfaction_score': 0,
            'peer_review_score': 0,
            'professional_development_hours': 0,
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
        
        # Calculate pass rate (>= 60%)
        passed = exam_results.filter(percentage__gte=60).count()
        total = exam_results.count()
        pass_rate = (passed / total * 100) if total > 0 else 0
        
        metrics.average_exam_score = Decimal(str(avg_score))
        metrics.student_pass_rate = Decimal(str(pass_rate))
        metrics.total_exams_conducted = total_exams
        metrics.total_students_evaluated = total_students
        metrics.save()


@receiver(post_save, sender=Attendance)
@receiver(post_delete, sender=Attendance)
def update_teacher_attendance_metrics(sender, instance, **kwargs):
    """Update teacher attendance-related metrics"""
    teacher_assignment = instance.teacher_assignment
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
            
            # Update metrics for all terms this teacher has records for
            from academics.models import Term
            terms = Term.objects.filter(
                classscheduleslot__teacher_assignment__teacher=teacher
            ).distinct()
            
            for term in terms:
                metrics, _ = TeacherMetrics.objects.get_or_create(
                    teacher=teacher,
                    term=term,
                    defaults={'average_attendance_percentage': Decimal('0')}
                )
                metrics.average_attendance_percentage = Decimal(str(avg_attendance))
                metrics.save()
