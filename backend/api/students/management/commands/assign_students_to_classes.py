from django.core.management.base import BaseCommand
from django.db import transaction
from students.models import Student
from academics.models import Class, Section


class Command(BaseCommand):
    help = 'Assign existing students to classes and sections'

    def add_arguments(self, parser):
        parser.add_argument(
            '--student-email',
            type=str,
            help='Email of specific student to assign',
        )
        parser.add_argument(
            '--class-grade',
            type=str,
            help='Grade/class name (e.g., "Grade 10", "Form 1")',
        )
        parser.add_argument(
            '--section-name',
            type=str,
            help='Section name (e.g., "A", "B")',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        student_email = options.get('student_email')
        class_grade = options.get('class_grade')
        section_name = options.get('section_name')

        if student_email and class_grade and section_name:
            # Assign specific student
            self.assign_single_student(student_email, class_grade, section_name)
        else:
            # Assign all unassigned students to default classes
            self.assign_all_students()

    def assign_single_student(self, email, class_grade, section_name):
        """Assign a specific student to a class and section"""
        try:
            student = Student.objects.get(user__email=email)
        except Student.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'Student with email {email} not found')
            )
            return

        try:
            class_obj = Class.objects.get(grade=class_grade)
        except Class.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'Class "{class_grade}" not found')
            )
            return

        try:
            section_obj = Section.objects.get(class_id=class_obj, name=section_name)
        except Section.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'Section "{section_name}" not found for class "{class_grade}"')
            )
            return

        student.grade = class_obj
        student.section = section_obj
        student.save()

        self.stdout.write(
            self.style.SUCCESS(
                f'Assigned {student.user.full_name} to {class_grade} - Section {section_name}'
            )
        )

    def assign_all_students(self):
        """Assign all unassigned students to available classes and sections"""

        # Get all students without class/section assignments
        unassigned_students = Student.objects.filter(
            grade__isnull=True
        ) | Student.objects.filter(
            section__isnull=True
        )

        if not unassigned_students.exists():
            self.stdout.write(
                self.style.SUCCESS('All students are already assigned to classes and sections')
            )
            return

        # Get available classes and sections
        classes = Class.objects.all()
        if not classes.exists():
            self.stdout.write(
                self.style.ERROR('No classes found. Please create classes first.')
            )
            return

        assigned_count = 0
        skipped_count = 0

        for student in unassigned_students:
            # Get first available class
            class_obj = classes.first()

            # Get first available section for this class
            sections = Section.objects.filter(class_id=class_obj)
            if not sections.exists():
                self.stdout.write(
                    self.style.WARNING(
                        f'No sections found for class {class_obj.grade}. Skipping {student.user.full_name}'
                    )
                )
                skipped_count += 1
                continue

            section_obj = sections.first()

            # Assign student
            student.grade = class_obj
            student.section = section_obj
            student.save()

            self.stdout.write(
                self.style.SUCCESS(
                    f'Assigned {student.user.full_name} to {class_obj.grade} - Section {section_obj.name}'
                )
            )
            assigned_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'\nSummary: {assigned_count} students assigned, {skipped_count} skipped'
            )
        )
