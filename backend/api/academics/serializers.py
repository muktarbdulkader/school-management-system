from rest_framework import serializers
from students.models import Student
from teachers.serializers import TeacherSerializer
from users.models import Branch
from users.serializers import BranchSerializer
from .models import Class, ClassElectiveOffering, ClassExtraOffering, ClassSubject, CourseType, GlobalSubject, Section, Subject, Term
from students.models import StudentElectiveChoice, StudentExtraChoice, StudentSubject
from teachers.models import Teacher

class CourseTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseType
        fields = ['id', 'name', 'description']

class TermsSerializer(serializers.ModelSerializer):
    branch = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.all(),
        write_only=True,
        required=False,
        allow_null=True
    )
    branch_details = serializers.SerializerMethodField()

    class Meta:
        model = Term
        fields = ['id', 'branch', 'branch_details', 'academic_year', 'name', 'start_date', 'end_date', 'is_current', 'status']

    def get_branch_details(self, obj):
        if obj.branch:
            return {'id': str(obj.branch.id), 'name': obj.branch.name}
        return None

    def validate_end_date(self, value):
        """Prevent creating terms with past end dates"""
        from django.utils import timezone
        from rest_framework.exceptions import ValidationError

        today = timezone.now().date()
        if value < today:
            raise ValidationError(
                f"Cannot create a term with an end date in the past. "
                f"Today is {today}, but the end date is {value}."
            )
        return value

    def validate(self, data):
        """Additional validation for term dates"""
        from django.utils import timezone
        from rest_framework.exceptions import ValidationError

        start_date = data.get('start_date')
        end_date = data.get('end_date')

        # Validate date range
        if start_date and end_date and start_date >= end_date:
            raise ValidationError("Start date must be before end date.")

        # Validate that end date is not in the past
        today = timezone.now().date()
        if end_date and end_date < today:
            raise ValidationError(
                f"Cannot create a term with an end date in the past. "
                f"Today is {today}, but the end date is {end_date}."
            )

        return data

class ClassesSerializer(serializers.ModelSerializer):
    branch =serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.all(),
        write_only=True
    )
    branch_details = BranchSerializer(source = 'branch', read_only=True)
    student_count = serializers.SerializerMethodField()
    sections_count = serializers.SerializerMethodField()

    class Meta:
        model = Class
        fields = ['id', 'grade', 'branch', 'branch_details', 'student_count', 'sections_count']

    def get_student_count(self, obj):
        # Count all students enrolled in this class through sections
        from students.models import Student
        count = Student.objects.filter(
            section__class_fk=obj
        ).count()
        return count

    def get_sections_count(self, obj):
        # Use section_set since Section model doesn't have a related_name defined
        return obj.section_set.count()

class SectionsSerializer(serializers.ModelSerializer):
    class_fk = serializers.PrimaryKeyRelatedField(queryset=Class.objects.all(), write_only=True)
    class_teacher = serializers.PrimaryKeyRelatedField(
        queryset=Teacher.objects.all(),
        allow_null=True,
        required=False,
        write_only=True
    )
    class_details = ClassesSerializer(source='class_fk', read_only=True)
    class_teacher_details = TeacherSerializer(source='class_teacher', read_only=True)
    teacher_assignments = serializers.SerializerMethodField()

    class Meta:
        model = Section
        fields = ['id', 'class_fk', 'class_details', 'name', 'class_teacher', 'class_teacher_details', 
                  'room_number', 'capacity', 'teacher_assignments']

    def get_teacher_assignments(self, obj):
        """Get all teachers assigned to this section via TeacherAssignment"""
        from teachers.models import TeacherAssignment
        assignments = TeacherAssignment.objects.filter(
            section=obj,
            is_active=True
        ).select_related('teacher', 'teacher__user', 'subject')
        
        return [{
            'id': str(ta.id),
            'teacher_name': ta.teacher.user.full_name if ta.teacher and ta.teacher.user else 'Unknown',
            'teacher_email': ta.teacher.user.email if ta.teacher and ta.teacher.user else None,
            'subject_name': ta.subject.name if ta.subject else 'No Subject',
            'subject_code': ta.subject.code if ta.subject else None,
            'is_primary': ta.is_primary
        } for ta in assignments]

    def validate_class_fk(self, value):
        # Class branch is optional (nullable in model), so no validation needed
        return value

class ClassCreateSerializer(serializers.Serializer):
    """Serializer for creating a Class with auto-generated sections"""
    grade_number = serializers.IntegerField(min_value=1, max_value=12, help_text="Grade number (e.g., 10)")
    sections_count = serializers.IntegerField(min_value=1, max_value=26, help_text="Number of sections to generate (1-26)")
    courses = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        allow_empty=True,
        help_text="Optional list of subject IDs to assign to this grade"
    )
    branch_id = serializers.UUIDField(required=False, allow_null=True, help_text="Branch ID to assign to this class")

    def validate_grade_number(self, value):
        """Check if grade already exists in the same branch"""
        branch_id = self.initial_data.get('branch_id')
        query = Class.objects.filter(grade=str(value))
        if branch_id:
            query = query.filter(branch_id=branch_id)
        if query.exists():
            raise serializers.ValidationError(f"Grade {value} already exists in this branch.")
        return value

    def validate_courses(self, value):
        """Validate that all course IDs exist"""
        if not value:
            return value
        from .models import Subject
        for subject_id in value:
            if not Subject.objects.filter(id=subject_id).exists():
                raise serializers.ValidationError(f"Subject with ID {subject_id} does not exist.")
        return value

    def create(self, validated_data):
        """Create grade with sections and optionally assign courses"""
        from django.db import transaction
        from .models import Class, Section, ClassSubject
        from users.models import Branch

        grade_number = validated_data['grade_number']
        sections_count = validated_data['sections_count']
        courses = validated_data.get('courses') or []
        branch_id = validated_data.get('branch_id')

        with transaction.atomic():
            # Step 1: Create the Grade/Class (with branch if provided)
            branch = Branch.objects.filter(id=branch_id).first() if branch_id else None
            grade = Class.objects.create(grade=str(grade_number), branch=branch)

            # Step 2: Generate sections (A, B, C, ...) with unique room numbers
            sections = []
            for i in range(sections_count):
                section_name = chr(65 + i)  # A=65, B=66, etc.
                # Generate unique room number based on grade and section
                room_number = f"R{grade_number}{section_name}"
                section = Section.objects.create(
                    class_fk=grade,
                    name=section_name,
                    room_number=room_number,
                    capacity=30
                )
                sections.append(section)

            # Step 3: Assign courses to the grade (if provided)
            assigned_courses = []
            for subject_id in courses:
                # Get the subject to find its global_subject
                subject = Subject.objects.filter(id=subject_id).first()
                global_subject = subject.global_subject if subject else None
                
                # If subject has no global_subject, create one from subject name
                if subject and not global_subject:
                    global_subject, _ = GlobalSubject.objects.get_or_create(
                        name=subject.name,
                        defaults={'description': f'Auto-created from subject {subject.name}'}
                    )
                    # Link the subject to the global_subject for future use
                    subject.global_subject = global_subject
                    subject.save(update_fields=['global_subject'])
                
                ClassSubject.objects.create(
                    class_fk=grade,
                    subject_id=subject_id,
                    global_subject=global_subject  # Also set for new subject management
                )
                assigned_courses.append(subject_id)

        return {
            'grade': grade,
            'sections': sections,
            'courses': assigned_courses,
            'class_id': str(grade.id)
        }

class ClassDetailSerializer(serializers.ModelSerializer):
    """Serializer for Class details with sections, courses, and teacher assignments"""
    sections = SectionsSerializer(source='section_set', many=True, read_only=True)
    courses = serializers.SerializerMethodField()
    branch_details = BranchSerializer(source='branch', read_only=True)

    class Meta:
        model = Class
        fields = ['id', 'grade', 'sections', 'courses', 'branch', 'branch_details']

    def get_courses(self, obj):
        """Get all courses assigned to this class with teacher assignments"""
        from teachers.models import TeacherAssignment

        # Get subjects from both ClassSubject and direct Subject links
        courses_data = []

        # 1. From direct Subjects (created via CreateClass flow)
        direct_subjects = obj.direct_subjects.all().select_related('global_subject')
        for subject in direct_subjects:
            # Get teacher assignments for this subject
            teacher_assignments = TeacherAssignment.objects.filter(
                class_fk=obj,
                subject=subject
            ).select_related('teacher', 'teacher__user', 'section')

            assignments_data = []
            for ta in teacher_assignments:
                assignments_data.append({
                    'id': str(ta.id),
                    'teacher_id': str(ta.teacher.id),
                    'teacher_name': ta.teacher.user.full_name if ta.teacher.user else 'Unknown',
                    'section_id': str(ta.section.id) if ta.section else None,
                    'section_name': ta.section.name if ta.section else 'All Sections',
                    'is_primary': ta.is_primary,
                    'is_active': ta.is_active
                })

            courses_data.append({
                'id': str(subject.id),
                'name': subject.name,
                'code': subject.code,
                'description': subject.description,
                'assignment_day': subject.assignment_day,
                'global_subject': {
                    'id': str(subject.global_subject.id),
                    'name': subject.global_subject.name
                } if subject.global_subject else None,
                'teacher_assignments': assignments_data
            })

        # 2. From ClassSubject (legacy/classic flow)
        class_subjects = obj.class_subjects.all().select_related('subject', 'global_subject')
        for cs in class_subjects:
            # Skip if already added from direct_subjects
            if any(c['id'] == str(cs.subject.id) for c in courses_data):
                continue

            # Get teacher assignments
            teacher_assignments = TeacherAssignment.objects.filter(
                class_fk=obj,
                subject=cs.subject
            ).select_related('teacher', 'teacher__user', 'section')

            assignments_data = []
            for ta in teacher_assignments:
                assignments_data.append({
                    'id': str(ta.id),
                    'teacher_id': str(ta.teacher.id),
                    'teacher_name': ta.teacher.user.full_name if ta.teacher.user else 'Unknown',
                    'section_id': str(ta.section.id) if ta.section else None,
                    'section_name': ta.section.name if ta.section else 'All Sections',
                    'is_primary': ta.is_primary,
                    'is_active': ta.is_active
                })

            courses_data.append({
                'id': str(cs.subject.id),
                'name': cs.subject.name,
                'code': cs.subject.code,
                'description': cs.subject.description,
                'global_subject': {
                    'id': str(cs.global_subject.id),
                    'name': cs.global_subject.name
                } if cs.global_subject else None,
                'teacher_assignments': assignments_data
            })

        return courses_data

class GlobalSubjectSerializer(serializers.ModelSerializer):
    """Serializer for GlobalSubject - central repository of subject names"""

    class Meta:
        model = GlobalSubject
        fields = ['id', 'name', 'description', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_name(self, value):
        """Ensure subject name is unique and not empty"""
        if not value or not value.strip():
            raise serializers.ValidationError("Subject name is required")
        return value.strip()

class SubjectsSerializer(serializers.ModelSerializer):
    course_type = serializers.PrimaryKeyRelatedField(queryset=CourseType.objects.all(), write_only=True, required=False, allow_null=True)
    course_type_details = CourseTypeSerializer(source='course_type', read_only=True)
    class_grade = serializers.PrimaryKeyRelatedField(queryset=Class.objects.all(), write_only=True, required=False, allow_null=True)
    class_grade_details = ClassesSerializer(source='class_grade', read_only=True)
    section = serializers.PrimaryKeyRelatedField(queryset=Section.objects.all(), write_only=True, required=False, allow_null=True)
    section_details = SectionsSerializer(source='section', read_only=True)
    branch = serializers.PrimaryKeyRelatedField(queryset=Branch.objects.all(), write_only=True, required=False, allow_null=True)
    branch_details = BranchSerializer(source='branch', read_only=True)
    global_subject = serializers.PrimaryKeyRelatedField(queryset=GlobalSubject.objects.all(), write_only=True, required=False, allow_null=True)
    global_subject_details = GlobalSubjectSerializer(source='global_subject', read_only=True)

    class Meta:
        model = Subject
        fields = ['id', 'name', 'code', 'description', 'assignment_day',
                  'course_type', 'course_type_details',
                  'class_grade', 'class_grade_details',
                  'section', 'section_details',
                  'branch', 'branch_details',
                  'global_subject', 'global_subject_details',
                  'created_at']

    def get_global_subject_details(self, obj):
        """Return global subject details if linked"""
        if obj.global_subject:
            return {
                'id': str(obj.global_subject.id),
                'name': obj.global_subject.name,
                'description': obj.global_subject.description,
                'is_active': obj.global_subject.is_active
            }
        return None

class ClassSubjectSerializer(serializers.ModelSerializer):
    """Serializer for ClassSubject model (grade-subject relationship)"""
    class_fk = serializers.PrimaryKeyRelatedField(queryset=Class.objects.all(), write_only=True)
    subject = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all(), write_only=True)
    class_details = ClassesSerializer(source='class_fk', read_only=True)
    subject_details = SubjectsSerializer(source='subject', read_only=True)

    class Meta:
        model = ClassSubject
        fields = ['id', 'class_fk', 'class_details', 'subject', 'subject_details', 'created_at']

class ClassElectiveOfferingsSerializer(serializers.ModelSerializer):
    class_fk = serializers.PrimaryKeyRelatedField(queryset=Class.objects.all(), write_only=True)
    class_details = ClassesSerializer(source='class_fk', read_only=True)
    subject = serializers.PrimaryKeyRelatedField(
        queryset=Subject.objects.all(),
        write_only=True,
        required=False
    )
    subject_details = SubjectsSerializer(source='subject', read_only=True)
    offered_in_term = serializers.PrimaryKeyRelatedField(queryset=Term.objects.all(), write_only=True)
    term_details = TermsSerializer(source='offered_in_term', read_only=True)

    class Meta:
        model = ClassElectiveOffering
        fields = ['id', 'class_fk', 'class_details', 'subject', 'subject_details', 'offered_in_term', 'term_details', 'max_capacity', 'notes']

    def validate_subject(self, value):
        if value.course_type.name != 'Elective':
            raise serializers.ValidationError("Subject must be of type 'elective'.")
        return value

class ClassExtraOfferingsSerializer(serializers.ModelSerializer):
    class_fk = serializers.PrimaryKeyRelatedField(queryset=Class.objects.all(), write_only=True)
    class_details = ClassesSerializer(source='class_fk', read_only=True)
    subject = serializers.PrimaryKeyRelatedField(
        queryset=Subject.objects.all(),
        write_only=True,
        required=False
    )
    subject_details = SubjectsSerializer(source='subject', read_only=True)
    term = serializers.PrimaryKeyRelatedField(queryset=Term.objects.all(), write_only=True)
    term_details = TermsSerializer(source='term', read_only=True)

    class Meta:
        model = ClassExtraOffering
        fields = ['id', 'class_fk', 'class_details', 'subject', 'subject_details', 'term', 'term_details', 'max_capacity', 'notes']

    def validate_subject(self, value):
        if value.course_type.name != 'Extra':
            raise serializers.ValidationError("Subject must be of type 'extra'.")
        return value

class StudentElectiveChoicesSerializer(serializers.ModelSerializer):
    elective_offering = serializers.PrimaryKeyRelatedField(
        queryset=ClassElectiveOffering.objects.all(),
        write_only=True
    )
    elective_offering_details = ClassElectiveOfferingsSerializer(source='elective_offering', read_only=True)
    term = serializers.PrimaryKeyRelatedField(queryset=Term.objects.all(), write_only=True)
    term_details = TermsSerializer(source='term', read_only=True)
    student = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all(),
        write_only=True
    )
    student_details = serializers.CharField(source='student', read_only=True)

    class Meta:
        model = StudentElectiveChoice
        fields = ['id', 'student', 'student_details', 'elective_offering', 'elective_offering_details', 'term', 'term_details', 'chosen_on']

    def validate(self, data):
        student = data.get('student')
        term = data.get('term')
        elective_offering = data.get('elective_offering')
        if not elective_offering or elective_offering.class_fk != student.grade:
            raise serializers.ValidationError(
                f"No elective offering found for student's class {student.grade.grade} and subject {elective_offering.subject.name if elective_offering else 'unknown'}"
            )
        if elective_offering.offered_in_term != term:
            raise serializers.ValidationError(
                f"Elective offering term {elective_offering.offered_in_term} does not match provided term {term}"
            )
        return data

class StudentExtraChoicesSerializer(serializers.ModelSerializer):
    extra_offering = serializers.PrimaryKeyRelatedField(
        queryset=ClassExtraOffering.objects.all(),
        write_only=True
    )
    extra_offering_details = ClassExtraOfferingsSerializer(source='extra_offering', read_only=True)
    term = serializers.PrimaryKeyRelatedField(queryset=Term.objects.all(), write_only=True)
    term_details = TermsSerializer(source='term', read_only=True)
    student = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all(),
        write_only=True
    )
    student_details = serializers.CharField(source='student', read_only=True)

    class Meta:
        model = StudentExtraChoice
        fields = ['id', 'student', 'student_details', 'extra_offering', 'extra_offering_details', 'term', 'term_details', 'choice_order', 'chosen_on']

    def validate(self, data):
        student = data.get('student')
        term = data.get('term')
        extra_offering = data.get('extra_offering')
        if not extra_offering or extra_offering.class_fk != student.grade:
            raise serializers.ValidationError(
                f"No extra offering found for student's class {student.grade.grade} and subject {extra_offering.subject.name if extra_offering else 'unknown'}"
            )
        if extra_offering.term != term:
            raise serializers.ValidationError(
                f"Extra offering term {extra_offering.term} does not match provided term {term}"
            )
        return data


class StudentSubjectSerializer(serializers.ModelSerializer):
    """Serializer for StudentSubject - student enrollment in subjects"""
    student = serializers.PrimaryKeyRelatedField(queryset=Student.objects.all(), write_only=True)
    student_details = serializers.CharField(source='student', read_only=True)
    subject = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all(), write_only=True)
    subject_details = SubjectsSerializer(source='subject', read_only=True)
    teacher_assignment_details = serializers.SerializerMethodField()

    class Meta:
        model = StudentSubject
        fields = ['id', 'student', 'student_details', 'subject', 'subject_details', 'enrolled_on', 'teacher_assignment_details']

    def get_teacher_assignment_details(self, obj):
        """Get teacher assignment for this student-subject combination"""
        from teachers.models import TeacherAssignment
        try:
            student = obj.student
            subject = obj.subject
            # Find teacher assignment for this class/section/subject
            assignment = TeacherAssignment.objects.filter(
                class_fk=student.grade,
                section=student.section,
                subject=subject,
                is_active=True
            ).select_related('teacher', 'teacher__user').first()

            if assignment:
                return {
                    'id': str(assignment.id),
                    'teacher_id': str(assignment.teacher.id),
                    'teacher_details': {
                        'id': str(assignment.teacher.id),
                        'user': {
                            'id': str(assignment.teacher.user.id),
                            'full_name': assignment.teacher.user.full_name
                        }
                    }
                }
        except Exception as e:
            # Log error but don't fail
            print(f"[StudentSubjectSerializer] Error getting teacher assignment: {e}")
        return None


# ─────────────────────────────────────────────────────────────────────────────
# Global Subject Management Serializers (New)
# ─────────────────────────────────────────────────────────────────────────────


class ClassSubjectDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for ClassSubject with full details.
    Includes class info, global subject info, and customization fields.
    """
    class_fk = serializers.PrimaryKeyRelatedField(queryset=Class.objects.all(), write_only=True)
    global_subject = serializers.PrimaryKeyRelatedField(queryset=GlobalSubject.objects.all(), write_only=True)
    
    # Read-only nested details
    class_details = serializers.SerializerMethodField()
    global_subject_details = serializers.SerializerMethodField()
    
    class Meta:
        model = ClassSubject
        fields = [
            'id', 'class_fk', 'class_details', 'global_subject', 'global_subject_details',
            'subject_code', 'book_code', 'syllabus', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_class_details(self, obj):
        """Return class details including branch"""
        if obj.class_fk:
            return {
                'id': str(obj.class_fk.id),
                'grade': obj.class_fk.grade,
                'branch': {
                    'id': str(obj.class_fk.branch.id),
                    'name': obj.class_fk.branch.name
                } if obj.class_fk.branch else None
            }
        return None

    def get_global_subject_details(self, obj):
        """Return global subject details"""
        if obj.global_subject:
            return {
                'id': str(obj.global_subject.id),
                'name': obj.global_subject.name,
                'description': obj.global_subject.description
            }
        return None

    def validate_subject_code(self, value):
        """Validate subject code format - no leading zeros or negative numbers"""
        if value:
            import re
            # Check for negative numbers
            if re.search(r'-\d+', value):
                raise serializers.ValidationError("Subject code cannot contain negative numbers")
            # Check for leading zeros in standalone numbers
            if re.search(r'\b0+\d+\b', value):
                raise serializers.ValidationError("Subject code cannot have leading zeros (e.g., '01'). Use '1' instead.")
        return value

    def validate(self, data):
        """Check for duplicate subject in class"""
        class_fk = data.get('class_fk')
        global_subject = data.get('global_subject')
        
        if class_fk and global_subject:
            # Check if this combination already exists (excluding current instance on update)
            existing = ClassSubject.objects.filter(
                class_fk=class_fk,
                global_subject=global_subject,
                is_active=True
            )
            if self.instance:
                existing = existing.exclude(id=self.instance.id)
            
            if existing.exists():
                raise serializers.ValidationError({
                    'global_subject': 'This subject is already assigned to this class'
                })
        
        return data