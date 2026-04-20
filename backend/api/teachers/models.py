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


class PerformanceMeasurementCriteria(models.Model):
    """Dynamic performance measurement criteria that admins can create and manage per term.
    
    This allows super admins and admins to define custom evaluation criteria for each term,
    making the performance measurement system flexible and dynamic.
    """
    MEASUREMENT_TYPE_CHOICES = [
        ('rating_1_5', 'Rating Scale (1-5)'),
        ('rating_1_10', 'Rating Scale (1-10)'),
        ('percentage', 'Percentage (0-100)'),
        ('boolean', 'Yes/No'),
        ('text', 'Text/Comment'),
        ('numeric', 'Numeric Value'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, help_text="Criteria name (e.g., Teaching Quality, Punctuality)")
    description = models.TextField(blank=True, help_text="Detailed description of what this criteria measures")
    code = models.CharField(max_length=50, unique=True, help_text="Unique code for this criteria (e.g., teaching_quality)")
    measurement_type = models.CharField(max_length=20, choices=MEASUREMENT_TYPE_CHOICES, default='rating_1_5')
    weight = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=1.0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Weight for this criteria in overall calculation (default 1.0)"
    )
    is_active = models.BooleanField(default=True, help_text="Whether this criteria is currently active")
    is_default = models.BooleanField(default=False, help_text="System default criteria that cannot be deleted")
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='criteria_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'performance_measurement_criteria'
        ordering = ['name']
        verbose_name_plural = 'performance measurement criteria'
        indexes = [
            models.Index(fields=['is_active', 'is_default']),
            models.Index(fields=['code']),
        ]

    def __str__(self):
        return f"{self.name} ({self.code})"


class TeacherPerformanceEvaluation(models.Model):
    """Term-based performance evaluation for teachers.
    
    Created by super admins and admins once per term for each teacher.
    Contains ratings for all active criteria defined for that term.
    """
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('reviewed', 'Reviewed'),
        ('approved', 'Approved'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='performance_evaluations')
    term = models.ForeignKey('academics.Term', on_delete=models.CASCADE, related_name='teacher_evaluations')
    academic_year = models.CharField(max_length=20, help_text="e.g., 2025-2026")
    
    # Evaluation metadata
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    evaluated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='evaluations_created')
    evaluated_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Overall scores (calculated from individual ratings)
    overall_score = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        null=True, 
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Calculated overall performance score"
    )
    weighted_average = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        null=True, 
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        help_text="Weighted average of all rating criteria"
    )
    
    # Summary fields
    strengths = models.TextField(blank=True, help_text="Key strengths identified")
    areas_for_improvement = models.TextField(blank=True, help_text="Areas needing improvement")
    recommendations = models.TextField(blank=True, help_text="Recommendations for professional development")
    action_items = models.TextField(blank=True, help_text="Specific action items for the teacher")
    
    # Review workflow
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='evaluations_reviewed')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='evaluations_approved')
    approved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'teacher_performance_evaluations'
        ordering = ['-evaluated_at']
        # Ensure only one evaluation per teacher per term
        unique_together = ['teacher', 'term']
        indexes = [
            models.Index(fields=['teacher', 'term']),
            models.Index(fields=['status']),
            models.Index(fields=['academic_year']),
        ]

    def __str__(self):
        return f"{self.teacher.user.full_name} - {self.term.name} ({self.academic_year})"

    def calculate_overall_score(self):
        """Calculate overall score based on all criteria ratings."""
        ratings = self.criteria_ratings.all()
        if not ratings:
            return None
        
        total_weighted_score = 0
        total_weight = 0
        
        for rating in ratings:
            if rating.criteria.weight and rating.normalized_score is not None:
                total_weighted_score += float(rating.normalized_score) * float(rating.criteria.weight)
                total_weight += float(rating.criteria.weight)
        
        if total_weight > 0:
            self.weighted_average = round(total_weighted_score / total_weight, 2)
            # Convert to percentage (assuming 5-star scale as base)
            self.overall_score = round((self.weighted_average / 5) * 100, 2)
        
        return self.overall_score


class TeacherPerformanceEvaluationRating(models.Model):
    """Individual rating for a specific criteria within a performance evaluation."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    evaluation = models.ForeignKey(TeacherPerformanceEvaluation, on_delete=models.CASCADE, related_name='criteria_ratings')
    criteria = models.ForeignKey(PerformanceMeasurementCriteria, on_delete=models.CASCADE, related_name='evaluation_ratings')
    
    # Raw value based on measurement type
    rating_value = models.DecimalField(
        max_digits=8, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="The actual rating value (1-5, 1-10, percentage, etc.)"
    )
    text_value = models.TextField(blank=True, help_text="For text/comment type criteria")
    boolean_value = models.BooleanField(null=True, blank=True, help_text="For yes/no type criteria")
    
    # Normalized score (0-5 scale) for calculation
    normalized_score = models.DecimalField(
        max_digits=4, 
        decimal_places=2, 
        null=True, 
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        help_text="Score normalized to 0-5 scale for aggregation"
    )
    
    # Additional details
    comment = models.TextField(blank=True, help_text="Specific comment for this criteria")
    rated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='criteria_ratings_given')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'teacher_performance_evaluation_ratings'
        # Ensure only one rating per criteria per evaluation
        unique_together = ['evaluation', 'criteria']
        ordering = ['criteria__name']
        indexes = [
            models.Index(fields=['evaluation', 'criteria']),
        ]

    def __str__(self):
        return f"{self.evaluation.teacher.user.full_name} - {self.criteria.name}: {self.rating_value}"

    def save(self, *args, **kwargs):
        # Auto-calculate normalized score based on measurement type
        if self.rating_value is not None and self.criteria:
            self.normalized_score = self._calculate_normalized_score()
        super().save(*args, **kwargs)
        # Update parent's overall score
        self.evaluation.calculate_overall_score()
        self.evaluation.save(update_fields=['overall_score', 'weighted_average'])

    def _calculate_normalized_score(self):
        """Convert rating value to normalized 0-5 scale."""
        if self.rating_value is None:
            return None
        
        measurement_type = self.criteria.measurement_type
        value = float(self.rating_value)
        
        if measurement_type == 'rating_1_5':
            return min(5, max(0, value))
        elif measurement_type == 'rating_1_10':
            return min(5, max(0, value / 2))
        elif measurement_type == 'percentage':
            return min(5, max(0, (value / 100) * 5))
        elif measurement_type == 'boolean':
            return 5 if self.boolean_value else 0
        elif measurement_type == 'numeric':
            # Assume numeric is already on appropriate scale or needs manual handling
            return min(5, max(0, value))
        
        return None
