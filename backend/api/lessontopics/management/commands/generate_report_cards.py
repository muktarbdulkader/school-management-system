"""Management command to generate report cards for all students in a term"""
from django.core.management.base import BaseCommand, CommandError
from django.db.models import Avg, Count, Q
from django.utils import timezone
from decimal import Decimal

from academics.models import Term, Class, Section
from students.models import Student
from teachers.models import TeacherAssignment
from lessontopics.models import (
    ReportCard, ReportCardSubject, 
    ExamResults, StudentAssignments, Assignments
)
from schedule.models import Attendance, ClassScheduleSlot


class Command(BaseCommand):
    help = 'Generate report cards for all students in a specified term'

    def add_arguments(self, parser):
        parser.add_argument(
            'term_id',
            type=str,
            help='UUID of the term to generate report cards for'
        )
        parser.add_argument(
            '--class-id',
            type=str,
            help='Optional: Generate only for a specific class'
        )
        parser.add_argument(
            '--section-id',
            type=str,
            help='Optional: Generate only for a specific section'
        )
        parser.add_argument(
            '--publish',
            action='store_true',
            help='Auto-publish the generated report cards'
        )

    def handle(self, *args, **options):
        term_id = options['term_id']
        class_id = options.get('class_id')
        section_id = options.get('section_id')
        publish = options['publish']

        try:
            term = Term.objects.get(id=term_id)
        except Term.DoesNotExist:
            raise CommandError(f'Term with ID {term_id} does not exist')

        # Get students to process
        students = Student.objects.filter(current_term=term)
        if class_id:
            students = students.filter(class_fk_id=class_id)
        if section_id:
            students = students.filter(section_id=section_id)

        self.stdout.write(f'Generating report cards for {students.count()} students in {term.name}...')

        generated_count = 0
        for student in students:
            try:
                self.generate_report_card(student, term, publish)
                generated_count += 1
                self.stdout.write(f'  ✓ Generated report card for {student.user.full_name}')
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  ✗ Failed for {student.user.full_name}: {str(e)}'))

        self.stdout.write(self.style.SUCCESS(f'Successfully generated {generated_count} report cards'))

    def generate_report_card(self, student, term, publish=False):
        """Generate a single report card for a student"""
        # Get or create report card
        report_card, created = ReportCard.objects.update_or_create(
            student=student,
            term=term,
            defaults={
                'class_fk': student.class_fk,
                'section': student.section,
                'generated_at': timezone.now(),
                'is_published': publish,
                'published_at': timezone.now() if publish else None,
            }
        )

        # Get all teacher assignments for this student
        teacher_assignments = TeacherAssignment.objects.filter(
            class_fk=student.class_fk,
            section=student.section,
            is_active=True
        ).select_related('subject')

        total_percentage = Decimal('0')
        subject_count = 0

        for ta in teacher_assignments:
            # Calculate exam score (70% weight)
            exam_results = ExamResults.objects.filter(
                student=student,
                teacher_assignment=ta,
                exam__term=term
            )
            
            exam_avg = exam_results.aggregate(avg=Avg('percentage'))['avg'] or 0
            exam_score = (exam_avg * Decimal('0.7')) if exam_avg else None

            # Calculate assignment average (20% weight)
            assignments = Assignments.objects.filter(
                teacher_assignment=ta,
                term=term
            )
            student_assignments = StudentAssignments.objects.filter(
                student=student,
                assignment__in=assignments
            )
            
            assignment_avg = student_assignments.aggregate(avg=Avg('grade'))['avg'] or 0
            if assignments.exists():
                assignment_max = assignments.first().max_score
                assignment_percentage = (assignment_avg / assignment_max * 100) if assignment_max else 0
                assignment_score = assignment_percentage * Decimal('0.2')
            else:
                assignment_score = None

            # Calculate attendance score (10% weight)
            attendance_records = Attendance.objects.filter(
                student=student,
                teacher_assignment=ta,
                date__range=[term.start_date, term.end_date]
            )
            
            if attendance_records.exists():
                present = attendance_records.filter(status='Present').count()
                total = attendance_records.count()
                attendance_pct = (present / total * 100) if total > 0 else 0
                attendance_score = Decimal(str(attendance_pct)) * Decimal('0.1')
            else:
                attendance_score = None

            # Calculate total
            total = Decimal('0')
            total_max = Decimal('0')
            
            if exam_score is not None:
                total += exam_score
                total_max += Decimal('70')
            if assignment_score is not None:
                total += Decimal(str(assignment_score))
                total_max += Decimal('20')
            if attendance_score is not None:
                total += attendance_score
                total_max += Decimal('10')

            # Normalize to 100
            if total_max > 0:
                normalized_percentage = (total / total_max) * 100
            else:
                normalized_percentage = 0

            # Create or update report card subject
            ReportCardSubject.objects.update_or_create(
                report_card=report_card,
                teacher_assignment=ta,
                defaults={
                    'subject': ta.subject,
                    'exam_score': exam_avg if exam_avg else None,
                    'exam_max_score': 100,
                    'assignment_avg': assignment_avg if assignment_avg else None,
                    'assignment_max': 100,
                    'attendance_score': attendance_pct if attendance_records.exists() else None,
                    'attendance_max': 100,
                    'total_score': float(normalized_percentage),
                    'total_max': 100,
                    'percentage': normalized_percentage,
                    # Determine which grading system to use based on class grade level
                    'descriptive_grade': self.calculate_descriptive_grade(normalized_percentage) if student.class_fk.grade <= 8 else None,
                    'letter_grade': self.calculate_letter_grade(normalized_percentage) if student.class_fk.grade >= 9 else None,
                }
            )

            total_percentage += normalized_percentage
            subject_count += 1

        # Calculate overall percentage and rank
        if subject_count > 0:
            overall_percentage = total_percentage / subject_count
        else:
            overall_percentage = Decimal('0')

        report_card.overall_percentage = overall_percentage
        
        # Calculate rank in class
        if publish:
            self.calculate_ranks(report_card.class_fk, report_card.section, term)

        report_card.save()

    def calculate_descriptive_grade(self, percentage):
        """Calculate descriptive grade for grades 1-8"""
        p = float(percentage)
        if p >= 90:
            return 'EX'
        elif p >= 80:
            return 'VG'
        elif p >= 70:
            return 'G'
        elif p >= 60:
            return 'S'
        elif p >= 50:
            return 'NI'
        else:
            return 'U'

    def calculate_letter_grade(self, percentage):
        """Calculate letter grade for grades 9-12"""
        p = float(percentage)
        if p >= 90:
            return 'A'
        elif p >= 80:
            return 'B'
        elif p >= 70:
            return 'C'
        elif p >= 60:
            return 'D'
        elif p >= 50:
            return 'E'
        else:
            return 'F'

    def calculate_ranks(self, class_fk, section, term):
        """Calculate ranks for all students in a class/section"""
        report_cards = ReportCard.objects.filter(
            class_fk=class_fk,
            section=section,
            term=term
        ).order_by('-overall_percentage')

        total_students = report_cards.count()
        
        for index, rc in enumerate(report_cards, start=1):
            rc.rank_in_class = index
            rc.total_students = total_students
            rc.save()


# Standalone function for use in views
def calculate_ranks_for_class(class_id, section_id, term_id):
    """Calculate and save student ranks for a class/section/term - can be called from views"""
    from lessontopics.models import ReportCard, StudentRank

    report_cards = ReportCard.objects.filter(
        class_fk_id=class_id,
        section_id=section_id,
        term_id=term_id
    ).order_by('-overall_percentage')

    total_students = report_cards.count()

    for index, rc in enumerate(report_cards, start=1):
        # Update ReportCard
        rc.rank_in_class = index
        rc.total_students = total_students
        rc.save()

        # Create or update StudentRank
        rank, _ = StudentRank.objects.update_or_create(
            student=rc.student,
            class_fk_id=class_id,
            section_id=section_id,
            term_id=term_id,
            defaults={
                'total_score': rc.overall_percentage or 0,
                'total_max': 100,
                'percentage': rc.overall_percentage or 0,
                'position': index,
                'total_students': total_students,
                'out_of': f"{index}{'st' if index==1 else 'nd' if index==2 else 'rd' if index==3 else 'th'} out of {total_students}",
                'remark': 'Excellent' if rc.overall_percentage >= 80 else 'Very Good' if rc.overall_percentage >= 70 else 'Good' if rc.overall_percentage >= 60 else 'Satisfactory' if rc.overall_percentage >= 50 else 'Needs Improvement'
            }
        )
