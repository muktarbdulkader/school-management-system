from django.db import models
import uuid

DAY_OF_WEEK_CHOICES = (
    ('Monday', 'Monday'),
    ('Tuesday', 'Tuesday'),
    ('Wednesday', 'Wednesday'),
    ('Thursday', 'Thursday'),
    ('Friday', 'Friday'),
    ('Saturday', 'Saturday'),
    ('Sunday', 'Sunday'),
)

class Term(models.Model):
    TERM_CHOICES = (
        ('Term 1', 'Term 1'),
        ('Term 2', 'Term 2'),
        ('Summer', 'Summer'),
        ('Winter', 'Winter'),
    )
    
    STATUS_CHOICES = (
        ('upcoming', 'Upcoming'),
        ('current', 'Current'),
        ('closed', 'Closed'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    branch = models.ForeignKey('users.Branch', on_delete=models.CASCADE, related_name='terms', null=True, blank=True)
    academic_year = models.CharField(max_length=20, help_text="e.g., 2025-2026")
    name = models.CharField(max_length=50, choices=TERM_CHOICES)
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='upcoming')

    class Meta:
        db_table = 'terms'
        verbose_name_plural = 'terms'
        unique_together = ['branch', 'academic_year', 'name']

    def clean(self):
        from django.core.exceptions import ValidationError
        # Ensure only 2 main terms per year per branch (Term 1 and Term 2)
        if self.name in ['Term 1', 'Term 2']:
            existing_terms = Term.objects.filter(
                branch=self.branch,
                academic_year=self.academic_year,
                name__in=['Term 1', 'Term 2']
            ).exclude(id=self.id if self.id else None)
            
            if existing_terms.count() >= 2 and not existing_terms.filter(name=self.name).exists():
                raise ValidationError(
                    f"Cannot add more than 2 main terms (Term 1, Term 2) per academic year for this branch. "
                    f"Existing terms: {list(existing_terms.values_list('name', flat=True))}"
                )
        
        # Validate date range
        if self.start_date and self.end_date and self.start_date >= self.end_date:
            raise ValidationError("Start date must be before end date")

    def update_status(self):
        """Auto-update status based on current date"""
        from django.utils import timezone
        today = timezone.now().date()

        if today < self.start_date:
            self.status = 'upcoming'
            self.is_current = False
        elif self.start_date <= today <= self.end_date:
            self.status = 'current'
            self.is_current = True
        else:  # today > end_date
            self.status = 'closed'
            self.is_current = False

    def save(self, *args, **kwargs):
        self.clean()
        # Auto-update status before saving
        self.update_status()
        super().save(*args, **kwargs)

    def __str__(self):
        branch_name = self.branch.name if self.branch else "All Branches"
        return f"{self.name} - {self.academic_year} ({branch_name})"

class Class(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    grade = models.CharField(max_length=20, help_text="Class grade (e.g., Grade 9, Grade 10)")
    branch = models.ForeignKey('users.Branch', on_delete=models.CASCADE, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'classes'
        constraints = [
            models.UniqueConstraint(
                fields=['branch', 'grade'],
                name='unique_class_per_branch',
                condition=models.Q(branch__isnull=False)
            )
        ]
        ordering = ['grade']

    def __str__(self):
        return f"{self.grade}"

    def clean(self):
        from django.core.exceptions import ValidationError
        import re
        
        # Validate grade is not empty
        if not self.grade or not self.grade.strip():
            raise ValidationError("Class grade is required")
        
        # Normalize grade
        self.grade = self.grade.strip()
        
        # Check for negative numbers in grade
        numbers = re.findall(r'-?\d+', self.grade)
        for num_str in numbers:
            try:
                num = int(num_str)
                if num < 0:
                    raise ValidationError("Class grade cannot contain negative numbers")
            except ValueError:
                pass
        
        # Check for leading zeros in standalone numbers (e.g., "01", "001")
        standalone_numbers = re.findall(r'\b0+\d+\b', self.grade)
        if standalone_numbers:
            corrected = [str(int(n)) for n in standalone_numbers]
            raise ValidationError(f"Class grade cannot have leading zeros: {', '.join(standalone_numbers)}. Use {', '.join(corrected)} instead.")
        
        # Check for duplicate class in same branch (case-insensitive)
        if self.branch:
            existing = Class.objects.filter(
                branch=self.branch,
                grade__iexact=self.grade
            ).exclude(id=self.id if self.id else None).first()
            
            if existing:
                raise ValidationError(f"Class '{self.grade}' already exists in this branch. Please select the existing class or use a different name.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

class Section(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    class_fk = models.ForeignKey(Class, on_delete=models.CASCADE)
    name = models.CharField(max_length=10)  # e.g., "A", "B"
    room_number = models.CharField(max_length=20, blank=True, null=True)
    capacity = models.IntegerField(default=30)
    class_teacher = models.ForeignKey('teachers.Teacher', on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_sections')

    class Meta:
        db_table = 'sections'
        unique_together = ['class_fk', 'name']

    def __str__(self):
        return f"{self.class_fk.grade}{self.name}"

class ClassSubject(models.Model):
    """
    Model to represent subjects assigned to a class with class-specific customization.
    Links GlobalSubject to a Class with custom code, book code, and syllabus.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    class_fk = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='class_subjects')
    global_subject = models.ForeignKey('GlobalSubject', on_delete=models.CASCADE, related_name='class_assignments', null=True, blank=True)
    
    # Class-specific customization fields
    subject_code = models.CharField(max_length=20, blank=True, help_text="Custom subject code for this class (e.g., MTH-09, ENG-10)")
    book_code = models.CharField(max_length=50, blank=True, help_text="Book code or ISBN for this subject")
    syllabus = models.TextField(blank=True, help_text="Content, topics, or syllabus for this class")
    
    # Legacy field kept for backward compatibility
    subject = models.ForeignKey('Subject', on_delete=models.CASCADE, related_name='assigned_classes', null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'class_subjects'
        unique_together = ['class_fk', 'global_subject']
        ordering = ['class_fk__grade', 'global_subject__name']

    def __str__(self):
        code = f" ({self.subject_code})" if self.subject_code else ""
        subject_name = self.global_subject.name if self.global_subject else 'Unknown'
        return f"{self.class_fk.grade} - {subject_name}{code}"

    def clean(self):
        from django.core.exceptions import ValidationError
        
        # Validate subject_code format - prevent leading zeros and negative numbers
        if self.subject_code:
            # Remove spaces and normalize
            self.subject_code = self.subject_code.strip().upper()
            
            # Check for negative numbers
            import re
            # Extract numbers from the code
            numbers = re.findall(r'-?\d+', self.subject_code)
            for num_str in numbers:
                try:
                    num = int(num_str)
                    if num < 0:
                        raise ValidationError("Subject code cannot contain negative numbers")
                except ValueError:
                    pass
            
            # Check for leading zeros in standalone numbers (e.g., "01", "001")
            standalone_numbers = re.findall(r'\b0+\d+\b', self.subject_code)
            if standalone_numbers:
                raise ValidationError(f"Subject code cannot have leading zeros: {', '.join(standalone_numbers)}. Use {', '.join([str(int(n)) for n in standalone_numbers])} instead.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

class CourseType(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        db_table = 'course_types'

    def __str__(self):
        return self.name

class GlobalSubject(models.Model):
    """
    Global Subject - Central repository of subject names.
    These are reusable across all classes.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True, help_text="Subject name (e.g., Math, English, Physics)")
    description = models.TextField(blank=True, help_text="Optional description of the subject")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'global_subjects'
        ordering = ['name']

    def __str__(self):
        return self.name

    def clean(self):
        from django.core.exceptions import ValidationError
        # Prevent empty names
        if not self.name or not self.name.strip():
            raise ValidationError("Subject name is required")
        # Normalize name (strip whitespace)
        self.name = self.name.strip()

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)


class Subject(models.Model):
    """
    Legacy Subject model - kept for backward compatibility.
    New code should use GlobalSubject and ClassSubject models.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20)
    description = models.TextField(blank=True)
    course_type = models.ForeignKey(CourseType, on_delete=models.RESTRICT, null=True, blank=True)
    assignment_day = models.CharField(max_length=10, choices=DAY_OF_WEEK_CHOICES, blank=True)
    
    # New fields for course registration with class/section/branch
    branch = models.ForeignKey('users.Branch', on_delete=models.CASCADE, null=True, blank=True, related_name='subjects')
    class_grade = models.ForeignKey(Class, on_delete=models.CASCADE, null=True, blank=True, related_name='direct_subjects')
    section = models.ForeignKey(Section, on_delete=models.CASCADE, null=True, blank=True, related_name='section_subjects')
    # Track which global subject this was created from
    global_subject = models.ForeignKey(GlobalSubject, on_delete=models.SET_NULL, null=True, blank=True, related_name='subjects')
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    class Meta:
        db_table = 'subjects'
        constraints = [
            models.UniqueConstraint(
                fields=['code', 'branch', 'class_grade', 'section'],
                name='unique_subject_per_class_section',
                condition=models.Q(class_grade__isnull=False, section__isnull=False)
            )
        ]

    def __str__(self):
        return self.name

class ClassElectiveOffering(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    class_fk = models.ForeignKey(Class, on_delete=models.CASCADE)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    offered_in_term = models.ForeignKey(Term, on_delete=models.CASCADE)
    max_capacity = models.IntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'class_elective_offerings'

    def __str__(self):
        return f"{self.class_fk.grade} - {self.subject.name} ({self.offered_in_term.name})"
class ClassExtraOffering(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    class_fk = models.ForeignKey(Class, on_delete=models.CASCADE)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    term = models.ForeignKey(Term, on_delete=models.CASCADE)
    max_capacity = models.IntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'class_extra_offerings'

    def __str__(self):
        return f"{self.class_fk.grade} - {self.subject.name} ({self.term.name})"


