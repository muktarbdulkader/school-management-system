import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from users.models import User, Branch

class Parent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='parent_profiles')
    citizenship = models.CharField(max_length=100, blank=True)
    employer_name = models.CharField(max_length=100, blank=True)
    jobtitle = models.CharField(max_length=100, blank=True)
    mobile_telephone = models.CharField(max_length=20, blank=True)
    work_telephone = models.CharField(max_length=20, blank=True)
    languages_spoken = models.CharField(max_length=255, blank=True)
    address = models.TextField()

    def __str__(self):
        return f"{self.user.full_name}"

class Student(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student_id = models.CharField(max_length=20, unique=True, null=True, blank=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='students', null=True, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    family_status = models.CharField(max_length=50, blank=True, null=True)
    family_residence = models.CharField(max_length=255, blank=True, null=True)
    emergency_contact = models.ForeignKey(Parent, on_delete=models.CASCADE, null=True, blank=True)
    citizenship = models.CharField(max_length=100, blank=True, null=True)
    gender = models.CharField(max_length=10, blank=True, null=True)
    grade = models.ForeignKey('academics.Class', on_delete=models.CASCADE, null=True, blank=True)
    section = models.ForeignKey('academics.Section', on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return f"{self.user.full_name} ({self.student_id})"

    def save(self, *args, **kwargs):
        if not self.student_id:
            from django.db import transaction
            import datetime
            import random
            year = datetime.datetime.now().year

            # Use select_for_update to prevent race conditions
            with transaction.atomic():
                # Get the last student ID with a lock to prevent duplicates
                last_student = Student.objects.select_for_update().filter(
                    student_id__startswith=f'STU-{year}-'
                ).order_by('student_id').last()

                if last_student and last_student.student_id:
                    # Extract the sequence number from the last student ID
                    parts = last_student.student_id.split('-')
                    if len(parts) == 3:
                        last_seq = int(parts[2])
                        new_seq = last_seq + 1
                    else:
                        new_seq = 1
                else:
                    new_seq = 1

                # Generate new student ID with format STU-YYYY-XXXX
                self.student_id = f"STU-{year}-{new_seq:04d}"

        super().save(*args, **kwargs)

class ParentRelationship(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50)

    def __str__(self):
        return self.name

class ParentStudent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    parent = models.ForeignKey(Parent, on_delete=models.CASCADE, related_name='children_links')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='parent_links')
    relationship = models.ForeignKey(ParentRelationship, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.parent.user.full_name} - {self.relationship} of {self.student.user.full_name}"

class HealthConditions(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)  # e.g., "Asthma", "Allergies"
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class StudentHealthRecords(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='health_records')
    history = models.TextField(blank=True, null=True)  # General health history
    incident = models.TextField(blank=True, null=True)  # Specific incident details
    date = models.DateField()
    recorded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='recorded_health_records')
    condition = models.ForeignKey(HealthConditions, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.student.user.full_name} - {self.date}"

class BehaviorIncidents(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='behavior_incidents')
    description = models.TextField()
    incident_date = models.DateField()
    reported_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='reported_behavior_incidents')

    def __str__(self):
        return f"{self.student.user.full_name} - {self.incident_date}"

class BehaviorRatings(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='behavior_ratings')
    rated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='rated_behavior_ratings')
    category = models.CharField(max_length=100)  # e.g., "Conduct", "Participation"
    rating = models.IntegerField()  # e.g., 1-5
    notes = models.TextField(blank=True, null=True)
    rated_on = models.DateField()

    def __str__(self):
        return f"{self.student.user.full_name} - {self.category} ({self.rating})"


class TeacherRating(models.Model):
    """
    Model for parents to rate teachers
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    parent = models.ForeignKey(Parent, on_delete=models.CASCADE, related_name='teacher_ratings_given')
    teacher = models.ForeignKey('teachers.Teacher', on_delete=models.CASCADE, related_name='ratings_received')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='teacher_ratings')
    
    # Rating categories (1-5 stars)
    teaching_quality = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Quality of teaching (1-5)"
    )
    communication = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Communication skills (1-5)"
    )
    subject_knowledge = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Subject knowledge (1-5)"
    )
    punctuality = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Punctuality (1-5)",
        null=True,
        blank=True
    )
    behavior_management = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Behavior management (1-5)",
        null=True,
        blank=True
    )
    
    # Overall rating (calculated or directly provided)
    overall_rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Overall rating (1-5)",
        null=True,
        blank=True
    )
    
    # Optional comment/feedback
    comment = models.TextField(blank=True, null=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['parent', 'teacher', 'student']
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        # Calculate overall rating if not provided
        if not self.overall_rating:
            ratings = [
                self.teaching_quality,
                self.communication,
                self.subject_knowledge
            ]
            if self.punctuality:
                ratings.append(self.punctuality)
            if self.behavior_management:
                ratings.append(self.behavior_management)
            
            if ratings:
                self.overall_rating = sum(ratings) / len(ratings)
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.parent.user.full_name} rated {self.teacher.user.full_name}: {self.overall_rating}/5"


# Models moved from academics app to eliminate circular dependencies

class StudentSubject(models.Model):
    """Student enrollment in subjects - moved from academics to students app"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='enrolled_subjects')
    subject = models.ForeignKey('academics.Subject', on_delete=models.CASCADE)
    enrolled_on = models.DateField(auto_now_add=True)

    class Meta:
        db_table = 'student_subjects'
        unique_together = ['student', 'subject']

    def __str__(self):
        return f"{self.student.user.full_name} - {self.subject.name}"


class StudentElectiveChoice(models.Model):
    """Student elective selection - moved from academics to students app"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    elective_offering = models.ForeignKey('academics.ClassElectiveOffering', on_delete=models.CASCADE)
    term = models.ForeignKey('academics.Term', on_delete=models.CASCADE)
    chosen_on = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'student_elective_choices'
        unique_together = ['student', 'elective_offering']

    def __str__(self):
        return f"{self.student.user.full_name} - {self.elective_offering.subject.name} ({self.term.name})"


class StudentExtraChoice(models.Model):
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    extra_offering = models.ForeignKey('academics.ClassExtraOffering', on_delete=models.CASCADE)
    term = models.ForeignKey('academics.Term', on_delete=models.CASCADE)
    choice_order = models.IntegerField(null=True, blank=True)
    chosen_on = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'student_extra_choices'
        unique_together = ['student', 'extra_offering']

    def __str__(self):
        return f"{self.student.user.full_name} - {self.extra_offering.subject.name} ({self.term.name})"