import uuid
from django.db import models
from users.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


class Teacher(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    teacher_id = models.CharField(max_length=20, unique=True, null=True, blank=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='teacher_profiles')
    branch = models.ForeignKey('users.Branch', on_delete=models.CASCADE, related_name='teachers', null=True, blank=True)
    class_grade = models.ForeignKey('academics.Class', on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_teachers')
    section = models.ForeignKey('academics.Section', on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_teachers')
    subjects = models.ManyToManyField('academics.Subject', blank=True, related_name='teachers')
    subject_specialties = models.TextField(null=True, blank=True)
    rating = models.FloatField(default=0.0, null=True, blank=True)
    attendance_percentage = models.FloatField(default=100.0, null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'teachers'

    def __str__(self):
        return f"Teacher: {self.user.full_name} ({self.teacher_id})"

    def save(self, *args, **kwargs):
        if not self.teacher_id:
            import datetime
            import random
            year = datetime.datetime.now().year
            last_teacher = Teacher.objects.filter(teacher_id__startswith=f'TCH-{year}-').order_by('teacher_id').last()
            if last_teacher and last_teacher.teacher_id:
                try:
                    last_num = int(last_teacher.teacher_id.split('-')[-1])
                    num = last_num + 1
                except:
                    num = random.randint(1000, 9999)
            else:
                num = 1
            self.teacher_id = f"TCH-{year}-{num:04d}"
        super().save(*args, **kwargs)
class TeacherTask(models.Model):
    """Daily task logging for teachers"""
    TASK_TYPE_CHOICES = [
        ('lesson_plan', 'Lesson Planning'),
        ('grading', 'Grading'),
        ('meeting', 'Meeting'),
        ('parent_communication', 'Parent Communication'),
        ('professional_development', 'Professional Development'),
        ('administrative', 'Administrative'),
        ('other', 'Other'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    teacher = models.ForeignKey('teachers.Teacher', on_delete=models.CASCADE, related_name='tasks')
    task_type = models.CharField(max_length=50, choices=TASK_TYPE_CHOICES)
    title = models.CharField(max_length=255)
    description = models.TextField()
    date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    completion_time = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['teacher', 'date']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.teacher.user.full_name} - {self.title} ({self.date})"


class TeacherPerformanceRating(models.Model):
    """Star ratings and comments from admins/heads"""
    CATEGORY_CHOICES = [
        ('teaching_quality', 'Teaching Quality'),
        ('punctuality', 'Punctuality'),
        ('communication', 'Communication'),
        ('classroom_management', 'Classroom Management'),
        ('student_engagement', 'Student Engagement'),
        ('professionalism', 'Professionalism'),
        ('collaboration', 'Collaboration'),
        ('innovation', 'Innovation'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    teacher = models.ForeignKey('teachers.Teacher', on_delete=models.CASCADE, related_name='performance_ratings')
    rated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='ratings_given')
    rating = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Rating from 1 to 5 stars"
    )
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    comment = models.TextField(blank=True, null=True)
    rating_date = models.DateField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-rating_date']
        indexes = [
            models.Index(fields=['teacher', 'rating_date']),
            models.Index(fields=['category']),
        ]

    def __str__(self):
        return f"{self.teacher.user.full_name} - {self.category}: {self.rating}/5"


class TeacherMetrics(models.Model):
    """Quantitative performance metrics"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    teacher = models.ForeignKey('teachers.Teacher', on_delete=models.CASCADE, related_name='metrics')
    month = models.DateField(help_text="First day of the month")

    # Attendance metrics
    attendance_percentage = models.DecimalField(
        max_digits=5, 
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Percentage of days present"
    )
    total_working_days = models.PositiveIntegerField(default=0)
    days_present = models.PositiveIntegerField(default=0)
    days_absent = models.PositiveIntegerField(default=0)

    # Task metrics
    task_completion_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Percentage of tasks completed on time"
    )
    total_tasks_assigned = models.PositiveIntegerField(default=0)
    total_tasks_completed = models.PositiveIntegerField(default=0)
    tasks_overdue = models.PositiveIntegerField(default=0)

    # Lesson coverage
    lesson_coverage_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Percentage of planned lessons covered"
    )
    lessons_planned = models.PositiveIntegerField(default=0)
    lessons_completed = models.PositiveIntegerField(default=0)

    # Rating metrics
    average_rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        help_text="Average rating for the month"
    )
    total_ratings_received = models.PositiveIntegerField(default=0)

    # Student metrics
    average_student_performance = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Average performance of students taught"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-month']
        unique_together = ['teacher', 'month']
        indexes = [
            models.Index(fields=['teacher', 'month']),
        ]

    def __str__(self):
        return f"{self.teacher.user.full_name} - {self.month.strftime('%B %Y')}"


class TeacherPerformanceReport(models.Model):
    """Generated performance reports"""
    PERIOD_CHOICES = [
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('semester', 'Semester'),
        ('annual', 'Annual'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    teacher = models.ForeignKey('teachers.Teacher', on_delete=models.CASCADE, related_name='performance_reports')
    report_period = models.CharField(max_length=20, choices=PERIOD_CHOICES)
    start_date = models.DateField()
    end_date = models.DateField()

    # Overall metrics
    overall_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Overall performance score (0-100)"
    )
    ranking = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Ranking among all teachers"
    )
    total_teachers = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Total number of teachers in ranking"
    )

    # Summary fields
    strengths = models.TextField(blank=True, help_text="Key strengths identified")
    areas_for_improvement = models.TextField(blank=True, help_text="Areas needing improvement")
    recommendations = models.TextField(blank=True, help_text="Recommendations for growth")

    # Detailed metrics
    attendance_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    task_completion_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    lesson_coverage_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    rating_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    student_performance_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    # Metadata
    generated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='reports_generated')
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-generated_at']
        indexes = [
            models.Index(fields=['teacher', 'report_period']),
            models.Index(fields=['start_date', 'end_date']),
        ]

    def __str__(self):
        return f"{self.teacher.user.full_name} - {self.report_period} ({self.start_date} to {self.end_date})"


# Model moved from academics app to eliminate circular dependencies

class TeacherAssignment(models.Model):
    """Teacher assignment to Class-Section-Subject combinations
    
    Moved from academics.ClassSubjectTeacher to teachers.TeacherAssignment
    to eliminate circular dependency between academics and teachers apps.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='assignments')
    class_fk = models.ForeignKey('academics.Class', on_delete=models.CASCADE)
    section = models.ForeignKey('academics.Section', on_delete=models.CASCADE, null=True, blank=True, 
                                 help_text="Leave blank to assign teacher to ALL sections of this class")
    subject = models.ForeignKey('academics.Subject', on_delete=models.CASCADE)
    term = models.ForeignKey('academics.Term', on_delete=models.CASCADE, null=True, blank=True, related_name='teacher_assignments')
    assigned_on = models.DateField(auto_now_add=True)
    is_primary = models.BooleanField(default=True, help_text="Is this the primary teacher for this subject/section")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'teacher_assignments'
        # Prevent duplicate: One teacher cannot teach same subject to same class/section twice
        unique_together = ['teacher', 'class_fk', 'section', 'subject', 'term']
        # Also prevent multiple primary teachers for same class-section-subject
        constraints = [
            models.UniqueConstraint(
                fields=['class_fk', 'section', 'subject', 'term'],
                name='unique_primary_teacher_per_class_section_subject_term',
                condition=models.Q(is_primary=True, is_active=True)
            )
        ]
        indexes = [
            models.Index(fields=['teacher', 'is_active']),
            models.Index(fields=['class_fk', 'section', 'subject']),
            models.Index(fields=['class_fk', 'is_active']),
            models.Index(fields=['term', 'is_active']),
        ]

    def clean(self):
        """Validate that section belongs to the selected class and prevent duplicates"""
        from django.core.exceptions import ValidationError
        
        # Validate section belongs to class
        if self.section and self.class_fk:
            if self.section.class_fk_id != self.class_fk_id:
                raise ValidationError(
                    f"Section {self.section.name} does not belong to class {self.class_fk.grade}"
                )
        
        # Check for duplicate assignment (another teacher assigned to same class/section/subject as primary)
        if self.is_primary and self.is_active:
            existing_primary = TeacherAssignment.objects.filter(
                class_fk=self.class_fk,
                section=self.section,
                subject=self.subject,
                term=self.term,
                is_primary=True,
                is_active=True
            ).exclude(id=self.id if self.id else None)
            
            if existing_primary.exists():
                other_teacher = existing_primary.first().teacher.user.full_name
                section_info = f" Section {self.section.name}" if self.section else " All Sections"
                raise ValidationError(
                    f"{other_teacher} is already assigned as primary teacher for "
                    f"{self.subject.name} in {self.class_fk.grade}{section_info}. "
                    f"Only one primary teacher is allowed per class-section-subject combination."
                )

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        section_info = self.section.name if self.section else "All Sections"
        term_info = f" - {self.term.name}" if self.term else ""
        return f"{self.teacher.user.full_name} - {self.subject.name} ({self.class_fk.grade} - {section_info}{term_info})"
