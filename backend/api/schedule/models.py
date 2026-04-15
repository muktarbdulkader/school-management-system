from django.db import models
import uuid
# from academics.models import Class, Section, Subject, Term
# from students.models import Student
# from users.models import Branch, User

EXAM_TYPE_CHOICES = (
    ('final', 'Final'),
    ('mid_term', 'Mid Term'),
    ('unit_test', 'Unit Test'),
    ('diagnostic_test', 'Diagnostic Test'),
    ('other', 'Other'),
)

DAY_OF_WEEK_CHOICES = (
    ('Monday', 'Monday'),
    ('Tuesday', 'Tuesday'),
    ('Wednesday', 'Wednesday'),
    ('Thursday', 'Thursday'),
    ('Friday', 'Friday'),
    ('Saturday', 'Saturday'),
    ('Sunday', 'Sunday'),
)

class SlotType(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, unique=True)
    course_type = models.ForeignKey('academics.CourseType', on_delete=models.RESTRICT, null=True, blank=True)
    description = models.TextField(blank=True)

    class Meta:
        db_table = 'slot_types'

    def __str__(self):
        return self.name


class Classroom(models.Model):
    """Classroom/Room model for scheduling"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    building = models.CharField(max_length=100, blank=True, null=True)
    floor = models.CharField(max_length=10, blank=True, null=True)
    capacity = models.PositiveIntegerField(default=30)
    room_type = models.CharField(
        max_length=50,
        choices=[
            ('classroom', 'Classroom'),
            ('lab', 'Laboratory'),
            ('hall', 'Hall'),
            ('library', 'Library'),
            ('other', 'Other'),
        ],
        default='classroom'
    )
    branch = models.ForeignKey(
        'users.Branch',
        on_delete=models.CASCADE,
        related_name='classrooms',
        null=True,
        blank=True
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'classrooms'
        ordering = ['code']
        indexes = [
            models.Index(fields=['branch', 'is_active']),
            models.Index(fields=['code']),
        ]

    def __str__(self):
        return f"{self.code} - {self.name}"


class ClassScheduleSlot(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    term = models.ForeignKey('academics.Term', on_delete=models.CASCADE, related_name='schedule_slots', null=True, blank=True)
    class_fk = models.ForeignKey('academics.Class', on_delete=models.CASCADE)
    section = models.ForeignKey('academics.Section', on_delete=models.CASCADE)
    slot_type = models.ForeignKey(SlotType, on_delete=models.RESTRICT)
    day_of_week = models.CharField(max_length=10, choices=DAY_OF_WEEK_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    subject = models.ForeignKey('academics.Subject', on_delete=models.SET_NULL, null=True, blank=True)
    teacher_assignment = models.ForeignKey('teachers.TeacherAssignment', on_delete=models.SET_NULL, null=True, blank=True)
    classroom = models.ForeignKey(Classroom, on_delete=models.SET_NULL, null=True, blank=True, related_name='schedule_slots')
    period_number = models.PositiveIntegerField(default=1)

    class Meta:
        db_table = 'class_schedule_slots'
        unique_together = ('term', 'class_fk', 'section', 'day_of_week', 'period_number')

    def clean(self):
        """Validate no conflicts before saving"""
        from django.core.exceptions import ValidationError
        
        # Validate time range
        if self.start_time and self.end_time and self.start_time >= self.end_time:
            raise ValidationError("Start time must be before end time")
        
        # Check teacher is not double-booked
        if self.teacher_assignment and self.teacher_assignment.teacher:
            teacher_conflicts = ClassScheduleSlot.objects.filter(
                teacher_assignment=self.teacher_assignment,
                day_of_week=self.day_of_week,
                start_time__lt=self.end_time,
                end_time__gt=self.start_time
            ).exclude(id=self.id if self.id else None)

            if teacher_conflicts.exists():
                raise ValidationError(
                    f"Teacher {self.teacher_assignment.teacher.user.full_name} is already "
                    f"assigned to another slot at this time ({self.day_of_week} {self.start_time}-{self.end_time})"
                )
        
        # Check section is not double-booked (room conflict)
        section_conflicts = ClassScheduleSlot.objects.filter(
            class_fk=self.class_fk,
            section=self.section,
            day_of_week=self.day_of_week,
            start_time__lt=self.end_time,
            end_time__gt=self.start_time
        ).exclude(id=self.id if self.id else None)

        if section_conflicts.exists():
            raise ValidationError(
                f"Section {self.section.name} already has a class scheduled "
                f"at this time ({self.day_of_week} {self.start_time}-{self.end_time})"
            )

        # Check classroom is not double-booked
        if self.classroom:
            classroom_conflicts = ClassScheduleSlot.objects.filter(
                classroom=self.classroom,
                day_of_week=self.day_of_week,
                start_time__lt=self.end_time,
                end_time__gt=self.start_time
            ).exclude(id=self.id if self.id else None)

            if classroom_conflicts.exists():
                raise ValidationError(
                    f"Classroom {self.classroom.name} is already booked "
                    f"at this time ({self.day_of_week} {self.start_time}-{self.end_time})"
                )

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        subject_name = self.subject.name if self.subject else "No Subject"
        return f"{self.class_fk.grade} : (Period {self.period_number}) - {self.slot_type.name} - {subject_name} on {self.day_of_week} from {self.start_time} to {self.end_time}"

class StudentScheduleOverride(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE)
    slot_type = models.ForeignKey(SlotType, on_delete=models.RESTRICT)
    subject = models.ForeignKey('academics.Subject', on_delete=models.CASCADE)
    term = models.ForeignKey('academics.Term', on_delete=models.CASCADE)
    day_of_week = models.CharField(max_length=10, choices=DAY_OF_WEEK_CHOICES, null=True, blank=True)
    period_number = models.PositiveIntegerField(null=True, blank=True)
    teacher_assignment = models.ForeignKey('teachers.TeacherAssignment', on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        db_table = 'student_schedule_overrides'
        unique_together = ('student', 'slot_type', 'term', 'day_of_week', 'period_number')

    def __str__(self):
        return f"{self.student.user.full_name} - {self.slot_type.name} - {self.subject.name} ({self.term.name})"


class Attendance(models.Model):
    STATUS_CHOICES = (
        ('Present', 'Present'),
        ('Late', 'Late'),
        ('Absent', 'Absent'),
        ('Excused', 'Excused'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE)
    schedule_slot = models.ForeignKey('ClassScheduleSlot', on_delete=models.CASCADE, related_name='attendance_records', null=True, blank=True)
    teacher_assignment = models.ForeignKey('teachers.TeacherAssignment', on_delete=models.CASCADE, related_name='attendance_records', null=True, blank=True)
    date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='Present')
    marked_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='marked_attendance')
    marked_at = models.DateTimeField(auto_now_add=True, null=True)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'attendance'
        unique_together = ['student', 'date']

    def __str__(self):
        subject_name = self.teacher_assignment.subject.name if self.teacher_assignment else "Unknown"
        return f"{self.student.user.full_name} - {subject_name} on {self.date} - {self.status}"

class LeaveRequest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE)
    requested_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='leave_requests_made')
    subject = models.ForeignKey('academics.Subject', on_delete=models.SET_NULL, null=True, blank=True)
    date = models.DateField()
    reason = models.TextField()
    status = models.CharField(max_length=10, choices=(('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')), default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Leave request for {self.student.user.full_name} on {self.date}"

class Exam(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    term = models.ForeignKey('academics.Term', on_delete=models.CASCADE)
    exam_type = models.CharField(max_length=50, choices=EXAM_TYPE_CHOICES)
    teacher_assignment = models.ForeignKey('teachers.TeacherAssignment', on_delete=models.CASCADE, null=True, blank=True)
    # Denormalized fields for convenience:
    subject = models.ForeignKey('academics.Subject', on_delete=models.CASCADE, null=True)
    class_fk = models.ForeignKey('academics.Class', on_delete=models.CASCADE, null=True)
    section = models.ForeignKey('academics.Section', on_delete=models.CASCADE, null=True)
    branch = models.ForeignKey('users.Branch', on_delete=models.CASCADE)
    start_date = models.DateField()
    end_date = models.DateField()
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    max_score = models.FloatField(default=100)
    passing_score = models.FloatField(default=40)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'exams'
        # Note: Removed unique_together since teacher_assignment is nullable

    def __str__(self):
        term_name = self.term.name if self.term else "Unknown"
        return f"{self.name} - {term_name} ({self.exam_type})"

class SubjectExamDay(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    subject = models.ForeignKey('academics.Subject', on_delete=models.CASCADE)
    day_of_week = models.CharField(max_length=10, choices=DAY_OF_WEEK_CHOICES, blank=True)

    class Meta:
        db_table = 'subject_exam_days'

    def __str__(self):
        return f"{self.subject.name} - {self.day_of_week}"


class AcademicCalendar(models.Model):
    """School holidays, exam periods, and special events"""
    EVENT_TYPE_CHOICES = (
        ('holiday', 'Holiday'),
        ('exam_period', 'Exam Period'),
        ('event', 'Special Event'),
        ('teacher_training', 'Teacher Training'),
        ('parent_meeting', 'Parent Meeting'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    branch = models.ForeignKey('users.Branch', on_delete=models.CASCADE, related_name='calendar_events')
    date = models.DateField()
    event_type = models.CharField(max_length=20, choices=EVENT_TYPE_CHOICES)
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_working_day = models.BooleanField(default=False, help_text="Is this a working day for teachers?")
    affects_schedule = models.BooleanField(default=True, help_text="Does this event affect the regular schedule?")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'academic_calendar'
        unique_together = ['branch', 'date', 'event_type']
        ordering = ['date']

    def __str__(self):
        return f"{self.branch.name} - {self.title} ({self.date})"


class TeacherSubstitution(models.Model):
    """Handle teacher absences and substitutions"""
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    original_teacher = models.ForeignKey('teachers.Teacher', on_delete=models.CASCADE, related_name='substitutions_out')
    substitute_teacher = models.ForeignKey('teachers.Teacher', on_delete=models.CASCADE, related_name='substitutions_in')
    schedule_slot = models.ForeignKey('ClassScheduleSlot', on_delete=models.CASCADE, related_name='substitutions')
    date = models.DateField()
    reason = models.TextField()
    requested_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='substitution_requests')
    approved_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='approved_substitutions')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'teacher_substitutions'
        unique_together = ['schedule_slot', 'date']

    def __str__(self):
        return f"{self.original_teacher.user.full_name} → {self.substitute_teacher.user.full_name} on {self.date}"


class TimetableConstraint(models.Model):
    """Timetable validation rules and constraints per branch"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    branch = models.ForeignKey('users.Branch', on_delete=models.CASCADE, related_name='timetable_constraints')
    max_periods_per_day = models.PositiveIntegerField(default=8, help_text="Maximum number of periods in a day")
    max_consecutive_periods = models.PositiveIntegerField(default=3, help_text="Maximum consecutive periods for a teacher")
    teacher_max_periods_per_day = models.PositiveIntegerField(default=6, help_text="Maximum periods a teacher can teach per day")
    teacher_max_periods_per_week = models.PositiveIntegerField(default=30, help_text="Maximum periods a teacher can teach per week")
    min_break_between_periods = models.PositiveIntegerField(default=0, help_text="Minimum break required between teacher periods (in minutes)")
    enforce_room_conflicts = models.BooleanField(default=True, help_text="Prevent double-booking of rooms")
    enforce_teacher_conflicts = models.BooleanField(default=True, help_text="Prevent double-booking of teachers")
    enforce_section_conflicts = models.BooleanField(default=True, help_text="Prevent double-booking of sections")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'timetable_constraints'
        unique_together = ['branch']

    def __str__(self):
        return f"{self.branch.name} Constraints"