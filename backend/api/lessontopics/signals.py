"""Signals for auto-calculating report card totals when grades are entered"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Avg
from decimal import Decimal

from .models import ExamResults, StudentAssignments, ReportCard, ReportCardSubject
from schedule.models import Attendance


def get_or_create_report_card_subject(student, teacher_assignment, term):
    """Get or create a ReportCardSubject for the given student, assignment and term"""
    # Get or create the report card
    report_card, _ = ReportCard.objects.get_or_create(
        student=student,
        term=term,
        defaults={
            'class_fk': student.grade,
            'section': student.section,
        }
    )

    # Get or create the report card subject
    report_card_subject, _ = ReportCardSubject.objects.get_or_create(
        report_card=report_card,
        teacher_assignment=teacher_assignment,
        defaults={
            'subject': teacher_assignment.subject,
        }
    )

    return report_card_subject


def update_report_card_subject_from_exam_results(student, teacher_assignment, term):
    """Update ReportCardSubject exam scores from all exam results for this term"""
    # Get all exam results for this student, assignment and term
    exam_results = ExamResults.objects.filter(
        student=student,
        teacher_assignment=teacher_assignment,
        exam__term=term
    )

    if exam_results.exists():
        # Calculate average percentage from all exams
        avg_percentage = exam_results.aggregate(avg=Avg('percentage'))['avg'] or 0

        # Get or create report card subject
        report_card_subject = get_or_create_report_card_subject(student, teacher_assignment, term)

        # Update exam score (store the average percentage)
        report_card_subject.exam_score = float(avg_percentage)
        report_card_subject.exam_max_score = 100

        # Save will trigger calculate_total()
        report_card_subject.save()

        return report_card_subject

    return None


def update_report_card_subject_from_assignments(student, teacher_assignment, term):
    """Update ReportCardSubject assignment scores from all assignments for this term"""
    from .models import Assignments

    # Get all assignments for this teacher assignment and term
    assignments = Assignments.objects.filter(
        teacher_assignment=teacher_assignment,
        term=term
    )

    # Get student's assignment submissions
    student_assignments = StudentAssignments.objects.filter(
        student=student,
        assignment__in=assignments
    )

    if student_assignments.exists():
        # Calculate average grade
        avg_grade = student_assignments.aggregate(avg=Avg('grade'))['avg'] or 0

        # Get or create report card subject
        report_card_subject = get_or_create_report_card_subject(student, teacher_assignment, term)

        # Update assignment average (store the raw average, will be normalized in calculation)
        report_card_subject.assignment_avg = float(avg_grade)
        report_card_subject.assignment_max = 100

        # Save will trigger calculate_total()
        report_card_subject.save()

        return report_card_subject

    return None


def update_report_card_subject_attendance(student, teacher_assignment, term):
    """Update ReportCardSubject attendance score"""
    # Get attendance records for this student, assignment and term
    attendance_records = Attendance.objects.filter(
        student=student,
        teacher_assignment=teacher_assignment,
        date__range=[term.start_date, term.end_date]
    )

    if attendance_records.exists():
        present = attendance_records.filter(status='Present').count()
        total = attendance_records.count()
        attendance_pct = (present / total * 100) if total > 0 else 0

        # Get or create report card subject
        report_card_subject = get_or_create_report_card_subject(student, teacher_assignment, term)

        # Update attendance score
        report_card_subject.attendance_score = attendance_pct
        report_card_subject.attendance_max = 100

        # Save will trigger calculate_total()
        report_card_subject.save()

        return report_card_subject

    return None


@receiver(post_save, sender=ExamResults)
def on_exam_result_saved(sender, instance, created, **kwargs):
    """Auto-update ReportCardSubject when an exam result is saved"""
    if instance.student and instance.teacher_assignment and instance.exam:
        update_report_card_subject_from_exam_results(
            instance.student,
            instance.teacher_assignment,
            instance.exam.term
        )


@receiver(post_delete, sender=ExamResults)
def on_exam_result_deleted(sender, instance, **kwargs):
    """Auto-update ReportCardSubject when an exam result is deleted"""
    if instance.student and instance.teacher_assignment and instance.exam:
        update_report_card_subject_from_exam_results(
            instance.student,
            instance.teacher_assignment,
            instance.exam.term
        )


@receiver(post_save, sender=StudentAssignments)
def on_assignment_grade_saved(sender, instance, created, **kwargs):
    """Auto-update ReportCardSubject when an assignment grade is saved"""
    if instance.student and instance.assignment and instance.assignment.teacher_assignment:
        assignment = instance.assignment
        update_report_card_subject_from_assignments(
            instance.student,
            assignment.teacher_assignment,
            assignment.term
        )


@receiver(post_delete, sender=StudentAssignments)
def on_assignment_grade_deleted(sender, instance, **kwargs):
    """Auto-update ReportCardSubject when an assignment grade is deleted"""
    if instance.student and instance.assignment and instance.assignment.teacher_assignment:
        assignment = instance.assignment
        update_report_card_subject_from_assignments(
            instance.student,
            assignment.teacher_assignment,
            assignment.term
        )


@receiver(post_save, sender=Attendance)
def on_attendance_saved(sender, instance, created, **kwargs):
    """Auto-update ReportCardSubject when attendance is recorded"""
    if instance.student and instance.teacher_assignment:
        # Get current term from student's enrollment
        student = instance.student
        if student.current_term:
            update_report_card_subject_attendance(
                student,
                instance.teacher_assignment,
                student.current_term
            )


@receiver(post_delete, sender=Attendance)
def on_attendance_deleted(sender, instance, **kwargs):
    """Auto-update ReportCardSubject when attendance is deleted"""
    if instance.student and instance.teacher_assignment:
        student = instance.student
        if student.current_term:
            update_report_card_subject_attendance(
                student,
                instance.teacher_assignment,
                student.current_term
            )
