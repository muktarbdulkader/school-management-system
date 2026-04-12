from django.core.management.base import BaseCommand
from django.db import transaction
from students.models import Student, ParentStudent, StudentHealthRecords, BehaviorIncidents, BehaviorRatings, StudentSubject, StudentElectiveChoice, StudentExtraChoice
from schedule.models import StudentScheduleOverride, Attendance, LeaveRequest
from lessontopics.models import LessonPlanObjectives, StudentAssignments, ExamResults, Assignments
from django.db.models import Count


class Command(BaseCommand):
    help = 'Find and automatically merge duplicate student records'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', help='Show what would be done without making changes')

    def handle(self, *args, **options):
        dry_run = options.get('dry_run')

        # Find duplicate students by user email
        duplicates = Student.objects.values('user__email', 'user__full_name').annotate(
            count=Count('id')
        ).filter(count__gt=1)

        if not duplicates:
            self.stdout.write(self.style.SUCCESS('No duplicate students found'))
            return

        for dup in duplicates:
            email = dup['user__email']
            name = dup['user__full_name']

            self.stdout.write(self.style.WARNING(f'\nProcessing duplicate students for: {name} ({email})'))

            students = list(Student.objects.filter(user__email=email).order_by('id'))

            # Decide which one to keep
            # Criteria: 
            # 1. Has a grade and section
            # 2. Has the most StudentSubject records
            # 3. Oldest ID (stable choice)

            scored_students = []
            for s in students:
                score = 0
                if s.grade: score += 10
                if s.section: score += 10
                if s.student_id: score += 5

                # Count related records
                score += StudentSubject.objects.filter(student_id=s).count()
                score += StudentHealthRecords.objects.filter(student_id=s).count()
                score += Attendance.objects.filter(student_id=s).count()

                scored_students.append((score, s))

            # Sort by score descending, then ID ascending
            scored_students.sort(key=lambda x: (-x[0], x[1].id))

            primary_student = scored_students[0][1]
            duplicates_to_remove = [s for score, s in scored_students[1:]]

            self.stdout.write(self.style.SUCCESS(f'  KEEPING Primary Student ID: {primary_student.id} (Score: {scored_students[0][0]})'))
            for score, s in scored_students[1:]:
                self.stdout.write(self.style.WARNING(f'  REMOVING Duplicate Student ID: {s.id} (Score: {score})'))

            if dry_run:
                continue

            with transaction.atomic():
                for dup_student in duplicates_to_remove:
                    # 1. Update ForeignKey references
                    ParentStudent.objects.filter(student=dup_student).update(student=primary_student)
                    StudentHealthRecords.objects.filter(student=dup_student).update(student=primary_student)
                    BehaviorIncidents.objects.filter(student=dup_student).update(student=primary_student)
                    BehaviorRatings.objects.filter(student=dup_student).update(student=primary_student)
                    StudentScheduleOverride.objects.filter(student=dup_student).update(student=primary_student)
                    Attendance.objects.filter(student=dup_student).update(student=primary_student)
                    LeaveRequest.objects.filter(student=dup_student).update(student=primary_student)
                    StudentSubject.objects.filter(student=dup_student).update(student=primary_student)
                    StudentElectiveChoice.objects.filter(student=dup_student).update(student=primary_student)
                    StudentExtraChoice.objects.filter(student=dup_student).update(student=primary_student)
                    LessonPlanObjectives.objects.filter(student=dup_student).update(student=primary_student)
                    StudentAssignments.objects.filter(student=dup_student).update(student=primary_student)
                    ExamResults.objects.filter(student=dup_student).update(student=primary_student)

                    # 2. Handle ManyToMany fields
                    # Assignments.students
                    for assignment in dup_student.assignments.all():
                        assignment.students.add(primary_student)
                        assignment.students.remove(dup_student)

                    # 3. Transfer any fields if primary is empty but duplicate has data
                    modified = False
                    fields_to_check = ['birth_date', 'family_status', 'family_residence', 'emergency_contact', 'citizenship', 'gender', 'grade', 'section', 'branch']
                    for field in fields_to_check:
                        if not getattr(primary_student, field) and getattr(dup_student, field):
                            setattr(primary_student, field, getattr(dup_student, field))
                            modified = True

                    if modified:
                        primary_student.save()

                    # 4. Delete the duplicate
                    dup_student.delete()

                self.stdout.write(self.style.SUCCESS(f'  Successfully merged duplicates into {primary_student.id}'))

        self.stdout.write(self.style.SUCCESS('\nAll duplicates processed.'))
