from django.db import models
import uuid

class ObjectiveCategories(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    subject = models.ForeignKey('academics.Subject', on_delete=models.CASCADE)
    class_fk = models.ForeignKey('academics.Class', on_delete=models.CASCADE)
    name = models.CharField(max_length=255)  # e.g., "Reading", "Writing"
    created_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return self.name

class ObjectiveUnits(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    category = models.ForeignKey(ObjectiveCategories, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)  # e.g., "Spelling", "Fractions"
    created_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return self.name

class ObjectiveSubunits(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    unit = models.ForeignKey(ObjectiveUnits, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    created_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return self.name

class LearningObjectives(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    unit = models.ForeignKey(ObjectiveUnits, on_delete=models.CASCADE)
    subunit = models.ForeignKey(ObjectiveSubunits, on_delete=models.CASCADE, null=True, blank=True)
    description = models.TextField()
    framework_code = models.CharField(max_length=10)  # e.g., 9Nf.03
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.framework_code}: {self.description[:50]}"

# Lesson Plans
class LessonPlans(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    subject = models.ForeignKey('academics.Subject', on_delete=models.CASCADE)
    class_fk = models.ForeignKey('academics.Class', on_delete=models.CASCADE, related_name='lesson_plans_by_class')
    unit = models.ForeignKey(ObjectiveUnits, on_delete=models.CASCADE, related_name='lesson_plans', null=True, blank=True)
    subunit = models.ForeignKey(ObjectiveSubunits, on_delete=models.CASCADE, null=True, blank=True)
    learner_group = models.ForeignKey('academics.Class', on_delete=models.CASCADE, related_name='lesson_plans_by_group', null=True, blank=True)
    duration = models.IntegerField(null=True, blank=True)
    block = models.CharField(max_length=50, null=True, blank=True, help_text="e.g., Morning Block, Afternoon Block")
    week = models.IntegerField(null=True, blank=True, help_text="Week number in the term")
    lesson_aims = models.TextField()
    learning_objectives = models.ForeignKey(LearningObjectives, on_delete=models.CASCADE, null=True, blank=True)
    created_by = models.ForeignKey('teachers.TeacherAssignment', on_delete=models.CASCADE)
    term = models.ForeignKey('academics.Term', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.unit.name} (Unit {self.subunit.name if self.subunit else 'N/A'})"

class LessonActivities(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lesson_plan = models.ForeignKey(LessonPlans, on_delete=models.CASCADE)
    order_number = models.IntegerField()
    time_slot = models.CharField(max_length=50)
    topic_content = models.TextField()
    learner_activity = models.TextField()
    formative_assessment = models.TextField()
    materials = models.TextField()

    def __str__(self):
        return f"Activity {self.order_number} - {self.lesson_plan}"

class LessonPlanEvaluations(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lesson_plan = models.ForeignKey(LessonPlans, on_delete=models.CASCADE)
    section = models.ForeignKey('academics.Section', on_delete=models.CASCADE, null=True, blank=True)
    lesson_plan_evaluation = models.TextField()

    def __str__(self):
        return f"Eval for {self.lesson_plan} - {self.section}"

class LessonPlanObjectives(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lesson_plan = models.ForeignKey(LessonPlans, on_delete=models.CASCADE)
    objective = models.ForeignKey(LearningObjectives, on_delete=models.CASCADE)
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='performances', null=True, blank=True)
    score = models.FloatField(null=True, blank=True)
    comments = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, editable=False, null=True)
    updated_at = models.DateTimeField(auto_now=True, editable=False, null=True)
    score_type = models.CharField(max_length=20, choices=[('star', 'star rating'), ('grade', 'Grade text'),('percent', 'Percentage')], default='numeric')

    def __str__(self):
        return f"{self.lesson_plan} - {self.objective} - {self.student}"
    class Meta:
        unique_together = ('lesson_plan', 'objective', 'student')

# Assignments
class Assignments(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField()
    assigned_by = models.ForeignKey('users.User', on_delete=models.CASCADE, null=True, blank=True)
    teacher_assignment = models.ForeignKey('teachers.TeacherAssignment', on_delete=models.CASCADE, null=True, blank=True)
    # Denormalized for convenience:
    subject = models.ForeignKey('academics.Subject', on_delete=models.CASCADE, null=True, blank=True)
    class_fk = models.ForeignKey('academics.Class', on_delete=models.CASCADE, null=True, blank=True)
    section = models.ForeignKey('academics.Section', on_delete=models.SET_NULL, null=True, blank=True, related_name='assignments')
    term = models.ForeignKey('academics.Term', on_delete=models.CASCADE, null=True, blank=True)
    assigned_date = models.DateField()
    due_date = models.DateField()
    max_score = models.FloatField(default=100)
    file_url = models.URLField(blank=True, null=True)
    students = models.ManyToManyField('students.Student', blank=True, related_name='assignments')
    is_group_assignment = models.BooleanField(default=False)
    group_name = models.CharField(max_length=100, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)

    class Meta:
        db_table = 'assignments'
        indexes = [
            models.Index(fields=['teacher_assignment', 'assigned_date']),
            models.Index(fields=['class_fk', 'section', 'due_date']),
        ]

    def __str__(self):
        return f"{self.title} ({self.teacher_assignment.subject.name})"

class StudentAssignments(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    assignment = models.ForeignKey(Assignments, on_delete=models.CASCADE)
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE)
    submission_url = models.URLField(blank=True, null=True)
    grade = models.FloatField(blank=True, null=True)
    feedback = models.TextField(blank=True, null=True)
    submitted_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student.user.full_name} - {self.assignment}"

class ExamResults(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE)
    teacher_assignment = models.ForeignKey('teachers.TeacherAssignment', on_delete=models.CASCADE, null=True, blank=True)
    # Denormalized for convenience:
    subject = models.ForeignKey('academics.Subject', on_delete=models.CASCADE, null=True, blank=True)
    exam = models.ForeignKey('schedule.Exam', on_delete=models.CASCADE)
    max_score = models.FloatField(default=100)
    score = models.FloatField()
    percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    grade = models.CharField(max_length=2, blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)
    recorded_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='recorded_exam_results')
    recorded_at = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        db_table = 'exam_results'
        indexes = [
            models.Index(fields=['student', 'teacher_assignment']),
            models.Index(fields=['exam', 'teacher_assignment']),
        ]

    def save(self, *args, **kwargs):
        # Calculate percentage
        if self.max_score and self.score is not None:
            self.percentage = (self.score / self.max_score) * 100
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student.user.full_name} - {self.teacher_assignment.subject.name} ({self.percentage}%)"

class ClassUnitProgress(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    class_fk = models.ForeignKey('academics.Class', on_delete=models.CASCADE)
    section = models.ForeignKey('academics.Section', on_delete=models.CASCADE, null=True, blank=True)
    subject = models.ForeignKey('academics.Subject', on_delete=models.CASCADE)
    unit = models.ForeignKey(ObjectiveUnits, on_delete=models.CASCADE)
    is_completed = models.BooleanField(default=False)
    is_current = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('class_fk', 'section', 'subject', 'unit')
        db_table = 'class_unit_progress'
        indexes = [
            models.Index(fields=['class_fk', 'subject', 'is_current']),
            models.Index(fields=['class_fk', 'section', 'subject']),
        ]

    def __str__(self):
        return f"{self.unit.name} ({self.class_fk.grade})"

class ClassSubunitProgress(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    class_fk = models.ForeignKey('academics.Class', on_delete=models.CASCADE)
    section = models.ForeignKey('academics.Section', on_delete=models.CASCADE, null=True, blank=True)
    subject = models.ForeignKey('academics.Subject', on_delete=models.CASCADE)
    subunit = models.ForeignKey(ObjectiveSubunits, on_delete=models.CASCADE)
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('class_fk', 'section', 'subject', 'subunit')
        db_table = 'class_subunit_progress'

    def __str__(self):
        return f"{self.subunit.name} ({self.class_fk.grade})"


class CurriculumMapping(models.Model):
    """Defines which units/subunits are taught in which class for each subject"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    class_fk = models.ForeignKey('academics.Class', on_delete=models.CASCADE)
    subject = models.ForeignKey('academics.Subject', on_delete=models.CASCADE)
    unit = models.ForeignKey(ObjectiveUnits, on_delete=models.CASCADE)
    order_index = models.PositiveIntegerField(help_text="Order in which unit is taught")
    term = models.ForeignKey('academics.Term', on_delete=models.CASCADE)
    is_mandatory = models.BooleanField(default=True)
    planned_start_date = models.DateField(null=True, blank=True)
    planned_end_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'curriculum_mappings'
        unique_together = ['class_fk', 'subject', 'unit']
        ordering = ['order_index']

    def __str__(self):
        return f"{self.class_fk.grade} - {self.subject.name} - {self.unit.name} (Order: {self.order_index})"


class ReportCard(models.Model):
    """Student report card for a term"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='report_cards')
    term = models.ForeignKey('academics.Term', on_delete=models.CASCADE)
    class_fk = models.ForeignKey('academics.Class', on_delete=models.CASCADE)
    section = models.ForeignKey('academics.Section', on_delete=models.CASCADE)
    generated_at = models.DateTimeField(auto_now_add=True)
    overall_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    rank_in_class = models.PositiveIntegerField(null=True, blank=True)
    total_students = models.PositiveIntegerField(null=True, blank=True)
    attendance_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    teacher_remarks = models.TextField(blank=True)
    principal_remarks = models.TextField(blank=True)
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'report_cards'
        unique_together = ['student', 'term']
        ordering = ['-generated_at']

    def __str__(self):
        return f"{self.student.user.full_name} - {self.term.name}"


class ReportCardSubject(models.Model):
    """Individual subject grades in a report card - Grades 1-12"""
    # Descriptive grades for primary/secondary school (Grades 1-12)
    DESCRIPTIVE_GRADES = (
        ('EX', 'Excellent - Outstanding performance'),
        ('VG', 'Very Good - Above average performance'),
        ('G', 'Good - Satisfactory performance'),
        ('S', 'Satisfactory - Meets expectations'),
        ('NI', 'Needs Improvement - Below expectations'),
        ('U', 'Unsatisfactory - Fails to meet requirements'),
    )
    
    # Letter grades (alternative for higher grades 9-12)
    LETTER_GRADES = (
        ('A', 'A - Excellent (90-100%)'),
        ('B', 'B - Good (80-89%)'),
        ('C', 'C - Satisfactory (70-79%)'),
        ('D', 'D - Passing (60-69%)'),
        ('E', 'E - Needs Improvement (50-59%)'),
        ('F', 'F - Fail (Below 50%)'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    report_card = models.ForeignKey(ReportCard, on_delete=models.CASCADE, related_name='subjects')
    teacher_assignment = models.ForeignKey('teachers.TeacherAssignment', on_delete=models.CASCADE)
    subject = models.ForeignKey('academics.Subject', on_delete=models.CASCADE)
    
    # Assessment scores
    exam_score = models.FloatField(null=True, blank=True)
    exam_max_score = models.FloatField(default=5)
    assignment_avg = models.FloatField(null=True, blank=True)
    assignment_max = models.FloatField(default=10)
    attendance_score = models.FloatField(null=True, blank=True)
    attendance_max = models.FloatField(default=10)

    # K-12 Continuous Assessment (CA) - weighted average of quizzes, homework, participation
    ca_score = models.FloatField(null=True, blank=True, help_text="Weighted average of all CA items")
    ca_max = models.FloatField(default=100)

    # Teacher-defined custom weights (flexible grading)
    exam_weight = models.FloatField(default=60, help_text="Custom weight for exam (default 60%)")
    ca_weight = models.FloatField(default=20, help_text="Custom weight for continuous assessment (default 20%)")
    assignment_weight = models.FloatField(default=10, help_text="Custom weight for assignments (default 10%)")
    attendance_weight = models.FloatField(default=10, help_text="Custom weight for attendance (default 10%)")

    # Calculated fields
    total_score = models.FloatField(null=True, blank=True)
    total_max = models.FloatField(default=100)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    # Flexible grading - can use descriptive OR letter grades
    descriptive_grade = models.CharField(max_length=2, choices=DESCRIPTIVE_GRADES, null=True, blank=True, 
                                          help_text="For grades 1-8")
    letter_grade = models.CharField(max_length=1, choices=LETTER_GRADES, null=True, blank=True,
                                   help_text="For grades 9-12")
    
    # Teacher feedback
    teacher_comment = models.TextField(blank=True)
    
    class Meta:
        db_table = 'report_card_subjects'
        unique_together = ['report_card', 'teacher_assignment']

    def __str__(self):
        return f"{self.report_card.student.user.full_name} - {self.subject.name}"

    def calculate_total(self):
        """Calculate total score with teacher-defined flexible weights.

        Uses custom weights defined by teacher (exam_weight, ca_weight, etc.)
        Only components with actual data are included in calculation.
        Weights are redistributed proportionally for missing components.

        Example: If teacher only enters exam (weight 80%) and attendance (weight 5%):
        - Available weights: 80 + 5 = 85
        - Exam actual weight: 80/85 = 94.1%
        - Attendance actual weight: 5/85 = 5.9%
        """
        from decimal import Decimal

        total = Decimal('0')
        total_available_weight = Decimal('0')

        # Use teacher-defined weights (or defaults if not set)
        EXAM_WEIGHT = Decimal(str(self.exam_weight or 60))
        CA_WEIGHT = Decimal(str(self.ca_weight or 20))
        ASSIGNMENT_WEIGHT = Decimal(str(self.assignment_weight or 10))
        ATTENDANCE_WEIGHT = Decimal(str(self.attendance_weight or 10))

        # Check which components have data and add their weighted scores
        has_exam = self.exam_score is not None and self.exam_max_score > 0
        has_ca = self.ca_score is not None and self.ca_max > 0
        has_assignment = self.assignment_avg is not None and self.assignment_max > 0
        has_attendance = self.attendance_score is not None and self.attendance_max > 0

        # Only include components that have data
        if has_exam:
            exam_pct = Decimal(str(self.exam_score)) / Decimal(str(self.exam_max_score)) * 100
            total += exam_pct * EXAM_WEIGHT
            total_available_weight += EXAM_WEIGHT

        if has_ca:
            ca_pct = Decimal(str(self.ca_score)) / Decimal(str(self.ca_max)) * 100
            total += ca_pct * CA_WEIGHT
            total_available_weight += CA_WEIGHT

        if has_assignment:
            assignment_pct = Decimal(str(self.assignment_avg)) / Decimal(str(self.assignment_max)) * 100
            total += assignment_pct * ASSIGNMENT_WEIGHT
            total_available_weight += ASSIGNMENT_WEIGHT

        if has_attendance:
            attendance_pct = Decimal(str(self.attendance_score)) / Decimal(str(self.attendance_max)) * 100
            total += attendance_pct * ATTENDANCE_WEIGHT
            total_available_weight += ATTENDANCE_WEIGHT

        # Normalize: divide by total available weight to get percentage
        if total_available_weight > 0:
            normalized_percentage = total / total_available_weight
            self.total_score = float(normalized_percentage)
            self.percentage = normalized_percentage
            self.total_max = 100
            self._auto_calculate_grades()
        else:
            self.total_score = None
            self.percentage = None

        return self.total_score

    def get_score_breakdown(self):
        """Get a detailed breakdown of how the total score was calculated.
        Returns dict with components, their teacher-defined weights, and contributions."""
        breakdown = {
            'components': [],
            'total_score': self.total_score,
            'percentage': float(self.percentage) if self.percentage else None,
            'teacher_weights': {
                'exam': self.exam_weight or 60,
                'ca': self.ca_weight or 20,
                'assignment': self.assignment_weight or 10,
                'attendance': self.attendance_weight or 10,
            }
        }

        # Use teacher-defined weights (or defaults)
        EXAM_W = self.exam_weight or 60
        CA_W = self.ca_weight or 20
        ASSIGN_W = self.assignment_weight or 10
        ATTEND_W = self.attendance_weight or 10

        total_available = 0

        # Check which components exist
        has_exam = self.exam_score is not None and self.exam_max_score > 0
        has_ca = self.ca_score is not None and self.ca_max > 0
        has_assignment = self.assignment_avg is not None and self.assignment_max > 0
        has_attendance = self.attendance_score is not None and self.attendance_max > 0

        if has_exam: total_available += EXAM_W
        if has_ca: total_available += CA_W
        if has_assignment: total_available += ASSIGN_W
        if has_attendance: total_available += ATTEND_W

        if total_available == 0:
            return breakdown

        # Calculate actual weights after redistribution based on teacher's weights
        if has_exam:
            exam_pct = (self.exam_score / self.exam_max_score) * 100
            actual_weight = (EXAM_W / total_available) * 100
            contribution = exam_pct * (EXAM_W / total_available)
            breakdown['components'].append({
                'name': 'Exam (Mid+Final)',
                'score': self.exam_score,
                'max': self.exam_max_score,
                'percentage': round(exam_pct, 2),
                'teacher_weight': f'{EXAM_W}%',
                'actual_weight': f'{round(actual_weight, 1)}%',
                'contribution': round(contribution, 2)
            })

        if has_ca:
            ca_pct = (self.ca_score / self.ca_max) * 100
            actual_weight = (CA_W / total_available) * 100
            contribution = ca_pct * (CA_W / total_available)
            breakdown['components'].append({
                'name': 'Continuous Assessment',
                'score': self.ca_score,
                'max': self.ca_max,
                'percentage': round(ca_pct, 2),
                'teacher_weight': f'{CA_W}%',
                'actual_weight': f'{round(actual_weight, 1)}%',
                'contribution': round(contribution, 2)
            })

        if has_assignment:
            assign_pct = (self.assignment_avg / self.assignment_max) * 100
            actual_weight = (ASSIGN_W / total_available) * 100
            contribution = assign_pct * (ASSIGN_W / total_available)
            breakdown['components'].append({
                'name': 'Assignments',
                'score': self.assignment_avg,
                'max': self.assignment_max,
                'percentage': round(assign_pct, 2),
                'teacher_weight': f'{ASSIGN_W}%',
                'actual_weight': f'{round(actual_weight, 1)}%',
                'contribution': round(contribution, 2)
            })

        if has_attendance:
            att_pct = (self.attendance_score / self.attendance_max) * 100
            actual_weight = (ATTEND_W / total_available) * 100
            contribution = att_pct * (ATTEND_W / total_available)
            breakdown['components'].append({
                'name': 'Attendance',
                'score': self.attendance_score,
                'max': self.attendance_max,
                'percentage': round(att_pct, 2),
                'teacher_weight': f'{ATTEND_W}%',
                'actual_weight': f'{round(actual_weight, 1)}%',
                'contribution': round(contribution, 2)
            })

        return breakdown

    def _auto_calculate_grades(self):
        """Auto-calculate letter/descriptive grades based on percentage and class grade"""
        if not self.percentage:
            return

        # Determine class grade level for grading system
        class_grade = self.report_card.class_fk.grade if self.report_card and self.report_card.class_fk else 9
        # Extract numeric grade from string like "Grade 9" or "9"
        import re
        grade_match = re.search(r'(\d+)', str(class_grade))
        grade_level = int(grade_match.group(1)) if grade_match else 9

        p = float(self.percentage)

        if grade_level <= 8:
            # Descriptive grades for grades 1-8
            if p >= 90:
                self.descriptive_grade = 'EX'
            elif p >= 80:
                self.descriptive_grade = 'VG'
            elif p >= 70:
                self.descriptive_grade = 'G'
            elif p >= 60:
                self.descriptive_grade = 'S'
            elif p >= 50:
                self.descriptive_grade = 'NI'
            else:
                self.descriptive_grade = 'U'
            self.letter_grade = None
        else:
            # Letter grades for grades 9-12
            if p >= 90:
                self.letter_grade = 'A'
            elif p >= 80:
                self.letter_grade = 'B'
            elif p >= 70:
                self.letter_grade = 'C'
            elif p >= 60:
                self.letter_grade = 'D'
            elif p >= 50:
                self.letter_grade = 'E'
            else:
                self.letter_grade = 'F'
            self.descriptive_grade = None

    def save(self, *args, **kwargs):
        # Calculate totals before saving
        self.calculate_total()
        super().save(*args, **kwargs)

    def calculate_descriptive_grade(self):
        """Auto-calculate descriptive grade based on percentage (for grades 1-8)"""
        if not self.percentage:
            return None
        p = float(self.percentage)
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

    def calculate_letter_grade(self):
        """Auto-calculate letter grade based on percentage (for grades 9-12)"""
        if not self.percentage:
            return None
        p = float(self.percentage)
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
# For K-12: Daily quizzes, homework, class participation, classwork

class ContinuousAssessment(models.Model):
    """Continuous Assessment marks for K-12 (quizzes, homework, participation)"""
    CA_TYPE_CHOICES = (
        ('quiz', 'Daily Quiz'),
        ('homework', 'Homework'),
        ('participation', 'Class Participation'),
        ('classwork', 'Classwork'),
        ('project', 'Mini Project'),
        ('assignment', 'Assignment'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE)
    teacher_assignment = models.ForeignKey('teachers.TeacherAssignment', on_delete=models.CASCADE)
    term = models.ForeignKey('academics.Term', on_delete=models.CASCADE)

    ca_type = models.CharField(max_length=20, choices=CA_TYPE_CHOICES)
    title = models.CharField(max_length=100)  # e.g., "Week 3 Quiz", "Chapter 5 Homework"
    description = models.TextField(blank=True)

    score = models.FloatField()
    max_score = models.FloatField(default=100)
    weight = models.FloatField(default=1.0)  # Weight in CA calculation

    date_given = models.DateField()
    date_submitted = models.DateField(null=True, blank=True)

    recorded_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True)
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'continuous_assessments'

    def __str__(self):
        return f"{self.student.user.full_name} - {self.get_ca_type_display()}: {self.title} ({self.score}/{self.max_score})"


class SkillsAssessment(models.Model):
    """Skills and competency assessment for K-12 (communication, teamwork, etc.)"""
    SKILL_CHOICES = (
        ('communication', 'Communication Skills'),
        ('teamwork', 'Teamwork & Collaboration'),
        ('critical_thinking', 'Critical Thinking'),
        ('creativity', 'Creativity & Innovation'),
        ('leadership', 'Leadership'),
        ('discipline', 'Discipline & Punctuality'),
        ('participation', 'Active Participation'),
        ('homework_completion', 'Homework Completion'),
        ('respect', 'Respect for Others'),
        ('self_confidence', 'Self-Confidence'),
    )

    RATING_CHOICES = (
        ('EX', 'Excellent'),
        ('VG', 'Very Good'),
        ('G', 'Good'),
        ('S', 'Satisfactory'),
        ('NI', 'Needs Improvement'),
        ('U', 'Unsatisfactory'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE)
    teacher_assignment = models.ForeignKey('teachers.TeacherAssignment', on_delete=models.CASCADE)
    term = models.ForeignKey('academics.Term', on_delete=models.CASCADE)

    skill = models.CharField(max_length=30, choices=SKILL_CHOICES)
    rating = models.CharField(max_length=2, choices=RATING_CHOICES)
    comment = models.TextField(blank=True)

    assessed_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True)
    assessed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'skills_assessments'
        unique_together = ['student', 'teacher_assignment', 'term', 'skill']

    def __str__(self):
        return f"{self.student.user.full_name} - {self.get_skill_display()}: {self.rating}"


class TeacherComment(models.Model):
    """Teacher comments for student report cards"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE)
    teacher_assignment = models.ForeignKey('teachers.TeacherAssignment', on_delete=models.CASCADE)
    term = models.ForeignKey('academics.Term', on_delete=models.CASCADE)

    comment = models.TextField()
    recommendation = models.TextField(blank=True)  # e.g., "Needs remedial classes"

    recorded_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True)
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'teacher_comments'
        unique_together = ['student', 'teacher_assignment', 'term']

    def __str__(self):
        return f"Comment for {self.student.user.full_name} - {self.comment[:50]}"


class StudentRank(models.Model):
    """Student class ranking based on overall performance"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE)
    class_fk = models.ForeignKey('academics.Class', on_delete=models.CASCADE)
    section = models.ForeignKey('academics.Section', on_delete=models.CASCADE, null=True, blank=True)
    term = models.ForeignKey('academics.Term', on_delete=models.CASCADE)

    total_score = models.FloatField()
    total_max = models.FloatField()
    percentage = models.FloatField()
    position = models.PositiveIntegerField()  # 1st, 2nd, 3rd...
    total_students = models.PositiveIntegerField()

    out_of = models.CharField(max_length=20)  # e.g., "1st out of 45"
    remark = models.CharField(max_length=100, blank=True)  # e.g., "Excellent performance"

    calculated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'student_ranks'
        unique_together = ['student', 'class_fk', 'section', 'term']
        ordering = ['class_fk', 'section', 'term', 'position']

    def __str__(self):
        return f"{self.student.user.full_name} - {self.out_of} ({self.percentage:.1f}%)"
