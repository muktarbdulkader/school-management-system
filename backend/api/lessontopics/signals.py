"""Signals for auto-calculating report card totals when grades are entered"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Avg
from decimal import Decimal

from .models import ExamResults, StudentAssignments, ReportCard, ReportCardSubject, ContinuousAssessment
from schedule.models import Attendance


def get_or_create_report_card_subject(student, teacher_assignment, term):
    """Get or create a ReportCardSubject for the given student, assignment and term"""
    # Skip if term is not available
    if not term:
        # Try to get student's current term as fallback
        from academics.models import Term
        term = student.current_term if hasattr(student, 'current_term') else None
        if not term:
            # Try to get current active term
            term = Term.objects.filter(is_current=True).first()
        if not term:
            print(f"[ReportCard] Skipping: No term available for student {student.id}")
            return None

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
    """Update ReportCardSubject exam scores from all exam results for this term
    Also auto-applies weight profile from the exam if not already set."""
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
        if not report_card_subject:
            return None

        # Update exam score (store the average percentage)
        report_card_subject.exam_score = float(avg_percentage)
        report_card_subject.exam_max_score = 100

        # Auto-apply weight profile from the first exam if weights not yet customized
        first_exam = exam_results.first().exam
        if first_exam and not hasattr(report_card_subject, '_weights_customized'):
            weights = first_exam.get_weights()
            # Only apply if weights haven't been manually set (default values)
            if (report_card_subject.exam_weight == 60 and
                report_card_subject.ca_weight == 20 and
                report_card_subject.assignment_weight == 10 and
                report_card_subject.attendance_weight == 10):
                report_card_subject.exam_weight = weights['exam']
                report_card_subject.ca_weight = weights['ca']
                report_card_subject.assignment_weight = weights['assignment']
                report_card_subject.attendance_weight = weights['attendance']
                print(f"[Auto-Weights] Applied {first_exam.weight_profile} weights for {student}: {weights}")

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
        if not report_card_subject:
            return None

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
        if not report_card_subject:
            return None

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
        # Skip if assignment has no term
        if not assignment.term:
            print(f"[AssignmentSignal] Skipping: Assignment {assignment.id} has no term")
            return
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
        # Skip if assignment has no term
        if not assignment.term:
            print(f"[AssignmentSignal] Skipping: Assignment {assignment.id} has no term")
            return
        update_report_card_subject_from_assignments(
            instance.student,
            assignment.teacher_assignment,
            assignment.term
        )


@receiver(post_save, sender=Attendance)
def on_attendance_saved(sender, instance, created, **kwargs):
    """Auto-update ReportCardSubject when attendance is recorded"""
    if instance.student and instance.teacher_assignment:
        # Get term from attendance date
        from academics.models import Term
        attendance_date = instance.date
        term = Term.objects.filter(
            start_date__lte=attendance_date,
            end_date__gte=attendance_date
        ).first()

        if term:
            update_report_card_subject_attendance(
                instance.student,
                instance.teacher_assignment,
                term
            )


@receiver(post_delete, sender=Attendance)
def on_attendance_deleted(sender, instance, **kwargs):
    """Auto-update ReportCardSubject when attendance is deleted"""
    if instance.student and instance.teacher_assignment:
        # Get term from attendance date
        from academics.models import Term
        attendance_date = instance.date
        term = Term.objects.filter(
            start_date__lte=attendance_date,
            end_date__gte=attendance_date
        ).first()

        if term:
            update_report_card_subject_attendance(
                instance.student,
                instance.teacher_assignment,
                term
            )


# ==================== Continuous Assessment (CA) Signals ====================

def update_report_card_subject_ca(student, teacher_assignment, term):
    """Update ReportCardSubject CA score from all Continuous Assessments"""
    # Get all CA entries for this student, assignment and term
    ca_entries = ContinuousAssessment.objects.filter(
        student=student,
        teacher_assignment=teacher_assignment,
        term=term
    )

    if not ca_entries.exists():
        return

    # Calculate weighted average of all CA entries
    total_weighted_score = Decimal('0')
    total_weight = Decimal('0')

    for ca in ca_entries:
        weight = Decimal(str(ca.weight)) if ca.weight else Decimal('1')
        percentage = (Decimal(str(ca.score)) / Decimal(str(ca.max_score))) * 100
        total_weighted_score += percentage * weight
        total_weight += weight

    if total_weight > 0:
        weighted_avg = float(total_weighted_score / total_weight)

        # Get or create report card subject
        report_card_subject = get_or_create_report_card_subject(student, teacher_assignment, term)
        if report_card_subject:
            report_card_subject.ca_score = weighted_avg
            report_card_subject.ca_max = 100
            report_card_subject.save()
            print(f"[CASignal] Updated CA score for {student}: {weighted_avg:.2f}% from {ca_entries.count()} assessments")


@receiver(post_save, sender=ContinuousAssessment)
def on_ca_saved(sender, instance, created, **kwargs):
    """Auto-update ReportCardSubject when a Continuous Assessment is saved"""
    if instance.student and instance.teacher_assignment and instance.term:
        update_report_card_subject_ca(
            instance.student,
            instance.teacher_assignment,
            instance.term
        )


@receiver(post_delete, sender=ContinuousAssessment)
def on_ca_deleted(sender, instance, **kwargs):
    """Auto-update ReportCardSubject when a Continuous Assessment is deleted"""
    if instance.student and instance.teacher_assignment and instance.term:
        update_report_card_subject_ca(
            instance.student,
            instance.teacher_assignment,
            instance.term
        )
