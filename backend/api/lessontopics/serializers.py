from rest_framework import serializers
from django.utils import timezone
from django.db import transaction
from academics.models import Class, Section, Subject, Term
from teachers.models import TeacherAssignment
from academics.serializers import TermsSerializer
from teachers.serializers import TeacherAssignmentSerializer
from schedule.models import Exam
from schedule.serializers import ClassSerializer, SectionSerializer, SubjectSerializer
from students.models import Student
from students.serializers import StudentSerializer
from teachers.models import Teacher
from teachers.serializers import TeacherSerializer
from users.models import User
from users.serializers import UserSerializer
from .models import (
    Assignments, ExamResults, LearningObjectives, LessonActivities, 
    LessonPlanEvaluations, LessonPlanObjectives, LessonPlans, 
    ObjectiveCategories, ObjectiveSubunits, ObjectiveUnits, StudentAssignments,
    ReportCard, ReportCardSubject, CurriculumMapping, ClassUnitProgress, ClassSubunitProgress
)

# ==================== Objective Categories ====================
class ObjectiveCategoriesSerializer(serializers.ModelSerializer):
    subject_id = serializers.PrimaryKeyRelatedField(
        queryset=Subject.objects.all(),
        write_only=True,
        required=True,
        source='subject'
    )
    subject_details = SubjectSerializer(source='subject', read_only=True)
    class_fk_id = serializers.PrimaryKeyRelatedField(
        queryset=Class.objects.all(),
        write_only=True,
        required=True,
        source='class_fk'
    )
    class_details = ClassSerializer(source='class_fk', read_only=True)
    created_by_details = UserSerializer(source='created_by', read_only=True)

    class Meta:
        model = ObjectiveCategories
        fields = ['id', 'subject_id', 'subject_details', 'class_fk_id', 'class_details', 'name', 'created_by', 'created_by_details']
        read_only_fields = ['id', 'subject_details', 'class_details', 'created_by_details']

    def validate_name(self, value):
        """Ensure category name is unique per subject and class"""
        subject_id = self.initial_data.get('subject_id')
        class_fk_id = self.initial_data.get('class_fk_id')
        if subject_id and class_fk_id:
            if ObjectiveCategories.objects.filter(
                subject_id=subject_id,
                class_fk_id=class_fk_id,
                name__iexact=value
            ).exclude(id=self.instance.id if self.instance else None).exists():
                raise serializers.ValidationError(
                    f"Category '{value}' already exists for this subject and class."
                )
        return value

# ==================== Objective Units ====================
class ObjectiveUnitsSerializer(serializers.ModelSerializer):
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=ObjectiveCategories.objects.all(),
        write_only=True,
        required=True
    )
    category_details = ObjectiveCategoriesSerializer(source='category', read_only=True)
    created_by_details = UserSerializer(source='created_by', read_only=True)

    class Meta:
        model = ObjectiveUnits
        fields = ['id', 'category_id', 'category_details', 'name', 'created_by', 'created_by_details']
        read_only_fields = ['id', 'category_details', 'created_by_details']

    def validate_name(self, value):
        """Ensure unit name is unique per category"""
        if 'category_id' in self.initial_data:
            category = self.initial_data['category_id']
            if ObjectiveUnits.objects.filter(
                category_id=category, 
                name__iexact=value
            ).exclude(id=self.instance.id if self.instance else None).exists():
                raise serializers.ValidationError(
                    f"Unit '{value}' already exists in this category."
                )
        return value

# ==================== Objective Subunits ====================
class ObjectiveSubunitsSerializer(serializers.ModelSerializer):
    unit_id = serializers.PrimaryKeyRelatedField(
        queryset=ObjectiveUnits.objects.all(),
        write_only=True,
        required=True
    )
    unit_details = ObjectiveUnitsSerializer(source='unit', read_only=True)
    created_by_details = UserSerializer(source='created_by', read_only=True)

    class Meta:
        model = ObjectiveSubunits
        fields = ['id', 'unit_id', 'unit_details', 'name', 'created_by', 'created_by_details']
        read_only_fields = ['id', 'unit_details', 'created_by_details']

    def validate_name(self, value):
        """Ensure subunit name is unique per unit"""
        if 'unit_id' in self.initial_data:
            unit = self.initial_data['unit_id']
            if ObjectiveSubunits.objects.filter(
                unit_id=unit, 
                name__iexact=value
            ).exclude(id=self.instance.id if self.instance else None).exists():
                raise serializers.ValidationError(
                    f"Subunit '{value}' already exists in this unit."
                )
        return value

# ==================== Learning Objectives ====================
class LearningObjectivesSerializer(serializers.ModelSerializer):
    unit_id = serializers.PrimaryKeyRelatedField(
        queryset=ObjectiveUnits.objects.all(),
        write_only=True,
        required=True
    )
    unit_details = ObjectiveUnitsSerializer(source='unit', read_only=True)
    subunit_id = serializers.PrimaryKeyRelatedField(
        queryset=ObjectiveSubunits.objects.all(),
        write_only=True,
        allow_null=True,
        required=False
    )
    subunit_details = ObjectiveSubunitsSerializer(source='subunit', read_only=True)
    subunit_relationships = serializers.SerializerMethodField()

    class Meta:
        model = LearningObjectives
        fields = ['id', 'framework_code', 'description', 'unit_id', 'unit_details', 
                'subunit_id', 'subunit_details', 'subunit_relationships']
        read_only_fields = ['id']

    def get_subunit_relationships(self, obj):
        """Optimized method to get subunit relationships"""
        if obj.subunit:
            try:
                subunit = ObjectiveSubunits.objects.select_related(
                    'unit__category'
                ).get(id=obj.subunit.id)
                return [{
                    'subunit_details': ObjectiveSubunitsSerializer(subunit).data,
                    'order': getattr(obj, 'subunit_order', 0)
                }]
            except ObjectiveSubunits.DoesNotExist:
                return []
        return []

# ==================== Lesson Plans ====================
class LessonPlansSerializer(serializers.ModelSerializer):
    subject_id = serializers.PrimaryKeyRelatedField(
        queryset=Subject.objects.all(),
        write_only=True,
        required=True
    )
    subject_details = SubjectSerializer(source='subject', read_only=True)
    unit_id = serializers.PrimaryKeyRelatedField(
        queryset=ObjectiveUnits.objects.all(),
        write_only=True,
        allow_null=True,
        required=False
    )
    unit_details = ObjectiveUnitsSerializer(source='unit', read_only=True)
    subunit_id = serializers.PrimaryKeyRelatedField(
        queryset=ObjectiveSubunits.objects.all(),
        write_only=True,
        allow_null=True,
        required=False
    )
    subunit_details = ObjectiveSubunitsSerializer(source='subunit', read_only=True)
    learner_group_id = serializers.PrimaryKeyRelatedField(
        queryset=Class.objects.all(),
        write_only=True,
        allow_null=True,
        required=False
    )
    learner_group_details = ClassSerializer(source='learner_group', read_only=True)
    learning_objectives = serializers.PrimaryKeyRelatedField(
        queryset=LearningObjectives.objects.all(),
        many=True,
        write_only=True,
        required=False
    )
    learning_objectives_details = LearningObjectivesSerializer(
        source='learning_objectives', 
        many=True, 
        read_only=True
    )
    created_by = serializers.PrimaryKeyRelatedField(
        queryset=TeacherAssignment.objects.all(),
        write_only=True,
        required=True
    )
    created_by_details = TeacherAssignmentSerializer(source='created_by', read_only=True)
    term_id = serializers.PrimaryKeyRelatedField(
        queryset=Term.objects.all(),
        write_only=True,
        required=True
    )
    term_details = TermsSerializer(source='term', read_only=True)

    class Meta:
        model = LessonPlans
        fields = '__all__'

    def validate(self, data):
        """Validate lesson plan data"""
        # Validate that if subunit is provided, unit is also provided
        if data.get('subunit_id') and not data.get('unit_id'):
            raise serializers.ValidationError({
                'unit_id': 'Unit is required when subunit is specified.'
            })

        # Validate that learning objectives belong to the same unit/subunit
        if 'learning_objectives' in data and data.get('unit_id'):
            for objective in data['learning_objectives']:
                if objective.unit_id != data['unit_id']:
                    raise serializers.ValidationError({
                        'learning_objectives': f'Objective {objective.framework_code} does not belong to the selected unit.'
                    })

        return data

# ==================== Lesson Activities ====================
class LessonActivitiesSerializer(serializers.ModelSerializer):
    lesson_plan_id = serializers.PrimaryKeyRelatedField(
        queryset=LessonPlans.objects.all(),
        write_only=True,
        required=True
    )
    lesson_plan_details = serializers.StringRelatedField(source='lesson_plan', read_only=True)

    class Meta:
        model = LessonActivities
        fields = '__all__'

    def validate_duration_minutes(self, value):
        """Ensure duration is positive"""
        if value and value <= 0:
            raise serializers.ValidationError("Duration must be greater than 0.")
        return value

# ==================== Lesson Plan Evaluations ====================
class LessonPlanEvaluationsSerializer(serializers.ModelSerializer):
    lesson_plan_id = serializers.PrimaryKeyRelatedField(
        queryset=LessonPlans.objects.all(),
        write_only=True,
        required=True
    )
    lesson_plan_details = serializers.StringRelatedField(source='lesson_plan', read_only=True)
    section = serializers.PrimaryKeyRelatedField(
        queryset=Section.objects.all(),
        write_only=True,
        allow_null=True,
        required=False
    )
    section_details = SectionSerializer(source='section', read_only=True)

    class Meta:
        model = LessonPlanEvaluations
        fields = '__all__'

    def validate_score(self, value):
        """Ensure score is within valid range"""
        if value is not None and (value < 0 or value > 100):
            raise serializers.ValidationError("Score must be between 0 and 100.")
        return value

# ==================== Lesson Plan Objectives ====================
class LessonPlanObjectivesSerializer(serializers.ModelSerializer):
    lesson_plan_id = serializers.PrimaryKeyRelatedField(
        queryset=LessonPlans.objects.all(),
        write_only=True,
        required=True
    )
    lesson_plan_details = serializers.StringRelatedField(source='lesson_plan', read_only=True)
    objective_id = serializers.PrimaryKeyRelatedField(
        queryset=LearningObjectives.objects.all(),
        write_only=True,
        required=True
    )
    objective_details = LearningObjectivesSerializer(source='objective', read_only=True)
    student_id = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all(),
        write_only=True,
        required=True
    )
    student_details = StudentSerializer(source='student', read_only=True)

    class Meta:
        model = LessonPlanObjectives
        fields = '__all__'

    def validate(self, data):
        """Ensure student belongs to the lesson plan's class"""
        lesson_plan = data.get('lesson_plan_id')
        student = data.get('student_id')

        if lesson_plan and student:
            if lesson_plan.learner_group_id and student.grade != lesson_plan.learner_group_id:
                raise serializers.ValidationError({
                    'student_id': f'Student {student} does not belong to the class of this lesson plan.'
                })
        return data

    def create(self, validated_data):
        """Create with proper transaction handling"""
        with transaction.atomic():
            lesson_plan = validated_data.pop('lesson_plan_id')
            objective = validated_data.pop('objective_id')
            student = validated_data.pop('student_id')

            return LessonPlanObjectives.objects.create(
                lesson_plan_id=lesson_plan,
                objective_id=objective,
                student_id=student,
                **validated_data
            )

    def update(self, instance, validated_data):
        """Update with validation"""
        instance.score = validated_data.get('score', instance.score)
        instance.comments = validated_data.get('comments', instance.comments)
        instance.save()
        return instance

# ==================== Assignments ====================
class SimpleAssignmentsSerializer(serializers.ModelSerializer):
    """Lightweight serializer for dashboard use - avoids heavy nested student data"""
    subject_name = serializers.CharField(source='teacher_assignment.subject.name', read_only=True)
    class_name = serializers.CharField(source='teacher_assignment.class_fk.grade', read_only=True)
    section_name = serializers.CharField(source='teacher_assignment.section.name', read_only=True, default=None)
    teacher_name = serializers.CharField(source='teacher_assignment.teacher.user.full_name', read_only=True, default=None)
    student_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Assignments
        fields = ['id', 'title', 'description', 'assigned_date', 'due_date', 
                  'file_url', 'is_group_assignment', 'group_name', 'max_score', 
                  'is_active', 'subject_name', 'class_name', 'section_name', 
                  'teacher_name', 'student_count', 'status']
    
    def get_student_count(self, obj):
        return obj.students.count()

class AssignmentsSerializer(serializers.ModelSerializer):
    teacher_assignment_id = serializers.PrimaryKeyRelatedField(
        queryset=TeacherAssignment.objects.all(),
        source='teacher_assignment',
        write_only=True,
        required=True
    )
    teacher_assignment_details = TeacherAssignmentSerializer(source='teacher_assignment', read_only=True)
    # Denormalized fields for convenience
    subject_details = SubjectSerializer(source='teacher_assignment.subject', read_only=True)
    class_details = ClassSerializer(source='teacher_assignment.class_fk', read_only=True)
    section_details = SectionSerializer(source='teacher_assignment.section', read_only=True)
    students = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all(),
        many=True,
        write_only=True,
        required=False
    )
    student_details = StudentSerializer(source='students', many=True, read_only=True)
    assigned_by = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        write_only=True,
        required=False,
        allow_null=True
    )
    term_id = serializers.PrimaryKeyRelatedField(
        queryset=Term.objects.all(),
        source='term',
        write_only=True,
        required=False,
        allow_null=True
    )
    term_details = TermsSerializer(source='term', read_only=True)
    description = serializers.CharField(
        required=False,
        allow_blank=True,
        default=''
    )
    assigned_date = serializers.DateField(
        required=False
    )
    file_url = serializers.URLField(
        required=False,
        allow_blank=True,
        allow_null=True
    )
    assigned_by_details = UserSerializer(source='assigned_by', read_only=True)
    status = serializers.CharField(read_only=True)

    class Meta:
        model = Assignments
        fields = ['id', 'title', 'description', 'teacher_assignment_id', 'teacher_assignment_details',
                'subject_details', 'class_details', 'section_details',
                'assigned_date', 'due_date', 'file_url', 'assigned_by', 
                'assigned_by_details', 'term_id', 'term_details', 
                'students', 'student_details', 
                'is_group_assignment', 'group_name', 'status', 'max_score', 'is_active']
        read_only_fields = ['id', 'teacher_assignment_details', 'subject_details', 'class_details', 
                            'section_details', 'assigned_by_details', 'term_details', 
                            'student_details', 'status', 'created_at', 'updated_at']

    def validate(self, data):
        """Comprehensive validation for assignments"""
        errors = {}

        # Auto-fill assigned_date to today if not sent
        if 'assigned_date' not in data or data.get('assigned_date') is None:
            data['assigned_date'] = timezone.now().date()

        # Validate assignment day constraint (Commented out to prevent 400 errors)
        # if 'subject_id' in data and 'assigned_date' in data:
        #     subject = data['subject_id']
        #     assigned_date = data['assigned_date']
        #     
        #     if subject.assignment_day:
        #         day_name = assigned_date.strftime('%A')
        #         if day_name.lower() != subject.assignment_day.lower():
        #             errors['assigned_date'] = f'Assignments for {subject.name} can only be assigned on {subject.assignment_day}s.'

        # Validate due date is after assigned date
        if 'due_date' in data and 'assigned_date' in data:
            if data['due_date'] < data['assigned_date']:
                errors['due_date'] = 'Due date cannot be before assigned date.'

        # Validate class and section consistency
        if 'section' in data and data['section'] is not None:
            section = data['section']

            # Use section's class by default if it exists
            if section.class_fk:
                data['class_fk'] = section.class_fk

            # If class_id is provided and mismatched, we prioritize the section's class 
            # but we could also raise an error. To avoid blocking the user, we ensure consistency.
            if 'class_fk' in data and data['class_fk'] is not None:
                if section.class_fk != data['class_fk']:
                    # Update data['class_fk'] to match section to prevent validation error
                    data['class_fk'] = section.class_fk

        # Validate students belong to the class
        if 'students' in data and data['students'] and 'class_fk' in data and data['class_fk']:
            class_students = set(Student.objects.filter(
                grade=data['class_fk']
            ).values_list('id', flat=True))

            invalid_students = [s.id for s in data['students'] if s.id not in class_students]
            if invalid_students:
                errors['students'] = f'Students with IDs {invalid_students} do not belong to the selected class.'

        # Validate students belong to the section if section is provided
        if ('section' in data and data['section'] is not None and 
            'students' in data and data['students']):
            section_students = set(Student.objects.filter(
                section=data['section']
            ).values_list('id', flat=True))

            invalid_section_students = [s.id for s in data['students'] if s.id not in section_students]
            if invalid_section_students:
                errors['students'] = f'Students with IDs {invalid_section_students} do not belong to the selected section.'

        if errors:
            raise serializers.ValidationError(errors)

        return data

    def to_representation(self, instance):
        """Custom representation with student-specific status"""
        representation = super().to_representation(instance)
        student_id = self.context.get('student_id')

        if student_id:
            student_assignment = StudentAssignments.objects.filter(
                assignment_id=instance.id, 
                student_id=student_id
            ).select_related('assignment_id').first()

            representation['status'] = 'submitted' if student_assignment else 'pending'

            if student_assignment:
                representation['submission_details'] = {
                    'submitted_date': student_assignment.submitted_date,
                    'grade': student_assignment.grade,
                    'feedback': student_assignment.feedback
                }

        return representation

    def create(self, validated_data):
        """Create assignment with proper transaction handling"""
        students_data = validated_data.pop('students', [])

        # Use current user if assigned_by not provided
        if 'assigned_by' not in validated_data or not validated_data['assigned_by']:
            request = self.context.get('request')
            if request and hasattr(request, 'user'):
                validated_data['assigned_by'] = request.user

        with transaction.atomic():
            assignment = Assignments.objects.create(**validated_data)
            if students_data:
                assignment.students.set(students_data)

        return assignment

    def update(self, instance, validated_data):
        """Update assignment with proper handling"""
        students_data = validated_data.pop('students', None)

        # Update fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        if students_data is not None:
            instance.students.set(students_data)

        return instance

# ==================== Student Assignments ====================
class StudentAssignmentsSerializer(serializers.ModelSerializer):
    assignment_id = serializers.PrimaryKeyRelatedField(
        queryset=Assignments.objects.all(), 
        write_only=True,
        required=True
    )
    assignment_details = serializers.SerializerMethodField()
    student_id = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all(), 
        write_only=True,
        required=True
    )
    student_details = StudentSerializer(source='student', read_only=True)

    def get_assignment_details(self, obj):
        """Get assignment details with optimization"""
        return {
            'id': obj.assignment_id.id,
            'title': obj.assignment_id.title,
            'description': obj.assignment_id.description,
            'subject': SubjectSerializer(obj.assignment_id.teacher_assignment.subject).data if obj.assignment_id.teacher_assignment and obj.assignment_id.teacher_assignment.subject else None,
            'due_date': obj.assignment_id.due_date,
            'is_group_assignment': obj.assignment_id.is_group_assignment,
            'group_name': obj.assignment_id.group_name
        }

    class Meta:
        model = StudentAssignments
        fields = ['id', 'assignment_id', 'assignment_details', 'student_id', 
                'student_details', 'submission_url', 'grade', 'feedback', 'submitted_date']
        read_only_fields = ['id', 'submitted_date', 'assignment_details', 'student_details']

    def validate(self, data):
        """Validate student assignment submission"""
        assignment = data.get('assignment_id')
        student = data.get('student_id')

        if not assignment or not student:
            return data

        # Check if assignment is past due
        if assignment.due_date and assignment.due_date < timezone.now().date():
            raise serializers.ValidationError(
                "Cannot submit to an assignment that is past due date."
            )

        # Check for existing submission
        if StudentAssignments.objects.filter(
            assignment_id=assignment, 
            student_id=student
        ).exclude(id=self.instance.id if self.instance else None).exists():
            raise serializers.ValidationError(
                "You have already submitted this assignment."
            )

        # Validate group assignment membership
        if assignment.is_group_assignment and student:
            if student not in assignment.students.all():
                raise serializers.ValidationError(
                    "Student must be part of the group assignment."
                )

        return data

    def create(self, validated_data):
        """Create submission with timestamp"""
        validated_data['submitted_date'] = timezone.now()
        return super().create(validated_data)

    def update(self, instance, validated_data):
        """Update submission"""
        instance.submission_url = validated_data.get('submission_url', instance.submission_url)
        instance.grade = validated_data.get('grade', instance.grade)
        instance.feedback = validated_data.get('feedback', instance.feedback)

        # If grade is being set for the first time, you might want to update submitted_date
        if instance.grade and not instance.submitted_date:
            instance.submitted_date = timezone.now()

        instance.save()
        return instance

# ==================== Exam Results ====================
class ExamResultsSerializer(serializers.ModelSerializer):
    student_id = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all(), 
        write_only=True,
        required=True
    )
    student_details = StudentSerializer(source='student', read_only=True)
    teacher_assignment_id = serializers.PrimaryKeyRelatedField(
        queryset=TeacherAssignment.objects.all(),
        source='teacher_assignment',
        write_only=True,
        required=True
    )
    teacher_assignment_details = TeacherAssignmentSerializer(source='teacher_assignment', read_only=True)
    # Denormalized for convenience
    subject_details = SubjectSerializer(source='teacher_assignment.subject', read_only=True)
    exam_id = serializers.PrimaryKeyRelatedField(
        queryset=Exam.objects.all(), 
        source='exam',
        write_only=True,
        required=True
    )
    exam_details = serializers.StringRelatedField(source='exam', read_only=True)
    recorded_by_details = UserSerializer(source='recorded_by', read_only=True)

    class Meta:
        model = ExamResults
        fields = ['id', 'student_id', 'student_details', 'teacher_assignment_id', 'teacher_assignment_details',
                  'subject_details', 'exam_id', 'exam_details', 'max_score', 'score', 'percentage', 
                  'letter_grade', 'remarks', 'recorded_by', 'recorded_by_details', 'recorded_at']

    def validate_marks_obtained(self, value):
        """Validate marks are within range"""
        if value is None:
            return value

        if value < 0:
            raise serializers.ValidationError("Marks obtained cannot be negative.")

        # If total_marks is available in instance or data
        total_marks = getattr(self.instance, 'total_marks', None)
        if not total_marks and 'total_marks' in self.initial_data:
            total_marks = self.initial_data['total_marks']

        if total_marks and value > total_marks:
            raise serializers.ValidationError(
                f"Marks obtained ({value}) cannot exceed total marks ({total_marks})."
            )

        return value

    def validate_percentage(self, value):
        """Validate percentage is within range"""
        if value is not None and (value < 0 or value > 100):
            raise serializers.ValidationError("Percentage must be between 0 and 100.")
        return value

    def validate(self, data):
        """Validate exam result data"""
        # Auto-calculate percentage if marks are provided but percentage is not
        if 'marks_obtained' in data and 'total_marks' in data:
            marks = data['marks_obtained']
            total = data['total_marks']

            if marks is not None and total and total > 0:
                data['percentage'] = (marks / total) * 100

        # Check for duplicate results
        if 'exam' in data and 'student' in data and 'teacher_assignment' in data:
            if ExamResults.objects.filter(
                exam=data['exam'],
                student=data['student'],
                teacher_assignment=data['teacher_assignment']
            ).exclude(id=self.instance.id if self.instance else None).exists():
                raise serializers.ValidationError(
                    "Result already exists for this student, exam, and teacher assignment."
                )

        return data


# ==================== Report Cards ====================
class ReportCardSubjectSerializer(serializers.ModelSerializer):
    teacher_assignment_details = TeacherAssignmentSerializer(source='teacher_assignment', read_only=True)
    subject_details = SubjectSerializer(source='subject', read_only=True)
    descriptive_grade_display = serializers.CharField(source='get_descriptive_grade_display', read_only=True)
    letter_grade_display = serializers.CharField(source='get_letter_grade_display', read_only=True)

    class Meta:
        model = ReportCardSubject
        fields = ['id', 'teacher_assignment', 'teacher_assignment_details', 'subject', 'subject_details',
                  'exam_score', 'exam_max_score', 'assignment_avg', 'assignment_max',
                  'attendance_score', 'attendance_max', 'total_score', 'total_max',
                  'percentage', 'descriptive_grade', 'descriptive_grade_display',
                  'letter_grade', 'letter_grade_display', 'teacher_comment']


class ReportCardSerializer(serializers.ModelSerializer):
    student_details = StudentSerializer(source='student', read_only=True)
    term_details = TermsSerializer(source='term', read_only=True)
    class_details = ClassSerializer(source='class_fk', read_only=True)
    section_details = SectionSerializer(source='section', read_only=True)
    subjects = ReportCardSubjectSerializer(many=True, read_only=True)

    class Meta:
        model = ReportCard
        fields = ['id', 'student', 'student_details', 'term', 'term_details',
                  'class_fk', 'class_details', 'section', 'section_details',
                  'generated_at', 'overall_percentage', 'rank_in_class', 'total_students',
                  'attendance_percentage', 'teacher_remarks', 'principal_remarks',
                  'is_published', 'published_at', 'subjects']


# ==================== Curriculum Mapping ====================
class CurriculumMappingSerializer(serializers.ModelSerializer):
    class_details = ClassSerializer(source='class_fk', read_only=True)
    subject_details = SubjectSerializer(source='subject', read_only=True)
    unit_details = serializers.StringRelatedField(source='unit', read_only=True)
    term_details = TermsSerializer(source='term', read_only=True)

    class Meta:
        model = CurriculumMapping
        fields = ['id', 'class_fk', 'class_details', 'subject', 'subject_details',
                  'unit', 'unit_details', 'order_index', 'term', 'term_details',
                  'is_mandatory', 'planned_start_date', 'planned_end_date']


# ==================== Class Progress ====================
class ClassUnitProgressSerializer(serializers.ModelSerializer):
    class_details = ClassSerializer(source='class_fk', read_only=True)
    section_details = SectionSerializer(source='section', read_only=True)
    subject_details = SubjectSerializer(source='subject', read_only=True)
    unit_details = serializers.StringRelatedField(source='unit', read_only=True)

    class Meta:
        model = ClassUnitProgress
        fields = ['id', 'class_fk', 'class_details', 'section', 'section_details',
                  'subject', 'subject_details', 'unit', 'unit_details',
                  'is_completed', 'is_current', 'completed_at', 'updated_at']


class ClassSubunitProgressSerializer(serializers.ModelSerializer):
    class_details = ClassSerializer(source='class_fk', read_only=True)
    section_details = SectionSerializer(source='section', read_only=True)
    subject_details = SubjectSerializer(source='subject', read_only=True)
    subunit_details = serializers.StringRelatedField(source='subunit', read_only=True)

    class Meta:
        model = ClassSubunitProgress
        fields = ['id', 'class_fk', 'class_details', 'section', 'section_details',
                  'subject', 'subject_details', 'subunit', 'subunit_details',
                  'is_completed', 'updated_at']