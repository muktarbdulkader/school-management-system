from rest_framework import serializers
from django.db import transaction

from users.models import User
from users.serializers import UserSerializer
from academics.models import Class, Section, Subject, Term
from .models import Teacher, TeacherAssignment, TeacherMetrics, TeacherPerformanceRating, TeacherPerformanceReport, TeacherTask

class TeacherSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all()
    )
    user_details = UserSerializer(source='user', read_only=True)
    name = serializers.CharField(source='user.full_name', read_only=True)
    rating_stats = serializers.SerializerMethodField()
    subject_details = serializers.SerializerMethodField()
    specialization = serializers.SerializerMethodField()
    has_rated = serializers.SerializerMethodField()
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    class_grade_name = serializers.CharField(source='class_grade.grade', read_only=True)
    section_name = serializers.CharField(source='section.name', read_only=True)
    subjects_list = serializers.SerializerMethodField()

    class Meta:
        model = Teacher
        fields = [
            'id', 'user', 'user_details', 'name', 'teacher_id', 'branch', 'branch_name',
            'class_grade', 'class_grade_name', 'section', 'section_name', 'subjects', 'subjects_list',
            'subject_specialties', 'rating', 'attendance_percentage', 'rating_stats',
            'subject_details', 'specialization', 'has_rated', 'created_at'
        ]
        read_only_fields = ['teacher_id', 'created_at']

    def validate_user(self, value):
        """Prevent duplicate teacher profiles for the same user"""
        # Check if this user already has a teacher profile
        if self.instance is None:  # Only check on creation, not update
            if Teacher.objects.filter(user=value).exists():
                raise serializers.ValidationError(
                    f"A teacher profile already exists for user {value.full_name}. "
                    "Please use the existing teacher profile or select a different user."
                )
        return value

    def get_rating_stats(self, obj):
        from django.db.models import Avg, Count
        ratings = TeacherPerformanceRating.objects.filter(teacher=obj)
        overall_avg = ratings.aggregate(Avg('rating'))['rating__avg'] or 0
        total_count = ratings.count()

        # Breakdown by category
        categories = ratings.values('category').annotate(
            avg_rating=Avg('rating'),
            count_rating=Count('id')
        )

        return {
            'overall_avg': round(float(overall_avg), 1),
            'total_count': total_count,
            'categories': {c['category']: round(float(c['avg_rating']), 1) for c in categories}
        }

    def get_subject_details(self, obj):
        from teachers.models import TeacherAssignment
        # Return unique subjects taught by this teacher
        subjects = TeacherAssignment.objects.filter(teacher=obj).select_related('subject')
        unique_subjects = {}
        for s in subjects:
            if s.subject:
                unique_subjects[str(s.subject.id)] = {'id': str(s.subject.id), 'name': s.subject.name}
        return list(unique_subjects.values())

    def get_specialization(self, obj):
        """Return specialization - either from subject_specialties or from assigned subjects"""
        from teachers.models import TeacherAssignment

        # First check if subject_specialties is filled
        if obj.subject_specialties and obj.subject_specialties.strip():
            return obj.subject_specialties

        # Otherwise, get from assigned subjects
        subjects = TeacherAssignment.objects.filter(teacher=obj).select_related('subject')
        unique_subjects = set()
        for s in subjects:
            if s.subject:
                unique_subjects.add(s.subject.name)

        if unique_subjects:
            return ', '.join(sorted(unique_subjects))

        return 'Not Assigned'

    def get_has_rated(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # Check if this specific user has ever rated this teacher
            return TeacherPerformanceRating.objects.filter(teacher=obj, rated_by=request.user).exists()
        return False

    def get_subjects_list(self, obj):
        """Return list of subjects assigned to teacher"""
        return [{'id': str(s.id), 'name': s.name} for s in obj.subjects.all()]


class TeacherRegistrationSerializer(serializers.Serializer):
    """Serializer for creating a new teacher with user account"""
    # User fields
    full_name = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)

    # Teacher fields
    branch_id = serializers.UUIDField(required=False, allow_null=True)
    class_id = serializers.UUIDField(required=False, allow_null=True)
    section_id = serializers.UUIDField(required=False, allow_null=True)
    subject_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        allow_empty=True
    )

    def validate_email(self, value):
        """Check if email already exists"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate(self, data):
        """Validate relationships between fields"""
        branch_id = data.get('branch_id')
        class_id = data.get('class_fk')
        section_id = data.get('section_id')

        # Validate class belongs to branch
        if class_id and branch_id:
            try:
                class_obj = Class.objects.get(id=class_id)
                if class_obj.branch and str(class_obj.branch.id) != str(branch_id):
                    raise serializers.ValidationError(
                        {"class_id": "The selected class does not belong to the selected branch."}
                    )
            except Class.DoesNotExist:
                raise serializers.ValidationError({"class_fk": "Invalid class selected."})

        # Validate section belongs to class
        if section_id and class_id:
            try:
                section_obj = Section.objects.get(id=section_id)
                if str(section_obj.class_fk.id) != str(class_id):
                    raise serializers.ValidationError(
                        {"section_id": "The selected section does not belong to the selected class."}
                    )
            except Section.DoesNotExist:
                raise serializers.ValidationError({"section_id": "Invalid section selected."})

        return data

    @transaction.atomic
    def create(self, validated_data):
        """Create user and teacher profile atomically"""
        from users.models import UserRole, Role

        # Extract teacher-specific data
        branch_id = validated_data.pop('branch_id', None)
        class_id = validated_data.pop('class_fk', None)
        section_id = validated_data.pop('section_id', None)
        subject_ids = validated_data.pop('subject_ids', [])
        phone = validated_data.pop('phone', '')

        # Create role if it doesn't exist
        role, _ = Role.objects.get_or_create(
            name='teacher',
            defaults={'description': 'Teacher role with access to academic features'}
        )

        # Create user
        user = User.objects.create_user(
            email=validated_data['email'],
            full_name=validated_data['full_name'],
            password=validated_data['password'],
            role_name='teacher'
        )

        # Update phone in profile if provided
        if phone:
            user.profile.phone = phone
            user.profile.save()

        # Create teacher profile
        teacher_data = {
            'user': user,
        }

        if branch_id:
            from users.models import Branch
            try:
                teacher_data['branch'] = Branch.objects.get(id=branch_id)
            except Branch.DoesNotExist:
                pass

        if class_id:
            try:
                teacher_data['class_grade'] = Class.objects.get(id=class_id)
            except Class.DoesNotExist:
                pass

        if section_id:
            try:
                teacher_data['section'] = Section.objects.get(id=section_id)
            except Section.DoesNotExist:
                pass

        teacher = Teacher.objects.create(**teacher_data)

        # Assign subjects
        if subject_ids:
            subjects = Subject.objects.filter(id__in=subject_ids)
            teacher.subjects.set(subjects)

        return teacher


class teacherTaskSerializer(serializers.ModelSerializer):
    teacher = serializers.PrimaryKeyRelatedField(
        queryset=Teacher.objects.all(),
        write_only=True
    )
    teacher_name = serializers.CharField(source='teacher.user.full_name', read_only=True)

    class Meta:
        model = TeacherTask
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
class TeacherPerformanceRatingSerializer(serializers.ModelSerializer):
    teacher = serializers.PrimaryKeyRelatedField(
        queryset=Teacher.objects.all(),
        write_only=True
    )
    teacher_name = serializers.CharField(source='teacher.user.full_name', read_only=True)
    rated_by = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        write_only=True,
        required=False
    )
    rated_by_name = serializers.CharField(source='rated_by.full_name', read_only=True)
    comment = serializers.CharField(allow_blank=True, required=False)

    class Meta:
        model = TeacherPerformanceRating
        fields = '__all__'
        read_only_fields = ['id', 'rating_date', 'created_at']

    def validate_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value
class TeacherMetricsSerializer(serializers.ModelSerializer):
    teacher = serializers.PrimaryKeyRelatedField(
        queryset=Teacher.objects.all(),
        write_only=True
    )
    teacher_name = serializers.CharField(source='teacher.user.full_name', read_only=True)
    month_display = serializers.SerializerMethodField()

    class Meta:
        model = TeacherMetrics
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_month_display(self, obj):
        return obj.month.strftime('%B %Y')
class TeacherPerformanceReportSerializer(serializers.ModelSerializer):
    teacher = serializers.PrimaryKeyRelatedField(
        queryset=Teacher.objects.all(),
        write_only=True
    )
    teacher_name = serializers.CharField(source='teacher.user.full_name', read_only=True)
    generated_by = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        write_only=True,
        required=False
    )
    generated_by_name = serializers.CharField(source='generated_by.full_name', read_only=True)
    strengths = serializers.CharField(allow_blank=True, required=False)
    areas_for_improvement = serializers.CharField(allow_blank=True, required=False)

    class Meta:
        model = TeacherPerformanceReport
        fields = '__all__'
        read_only_fields = ['id', 'generated_at']


class TeacherAssignmentSerializer(serializers.ModelSerializer):
    teacher = serializers.PrimaryKeyRelatedField(
        queryset=Teacher.objects.all(),
        write_only=True
    )
    teacher_details = TeacherSerializer(source='teacher', read_only=True)
    class_fk = serializers.PrimaryKeyRelatedField(
        queryset=Class.objects.all(),
        write_only=True
    )
    class_details = serializers.SerializerMethodField()
    section = serializers.PrimaryKeyRelatedField(
        queryset=Section.objects.all(),
        write_only=True,
        required=False,
        allow_null=True
    )
    section_details = serializers.SerializerMethodField()
    subject = serializers.PrimaryKeyRelatedField(
        queryset=Subject.objects.all(),
        write_only=True
    )
    subject_details = serializers.SerializerMethodField()
    term = serializers.PrimaryKeyRelatedField(
        queryset=Term.objects.all(),
        write_only=True,
        required=False,
        allow_null=True
    )
    term_details = serializers.SerializerMethodField()

    class Meta:
        model = TeacherAssignment
        fields = ['id', 'teacher', 'teacher_details', 'class_fk', 'class_details',
                  'section', 'section_details', 'subject', 'subject_details',
                  'term', 'term_details', 'assigned_on', 'is_primary', 'is_active']
        read_only_fields = ['id', 'assigned_on']

    def create(self, validated_data):
        """Create teacher assignment with validation"""
        from rest_framework.exceptions import ValidationError

        # Check required fields
        if not validated_data.get('teacher'):
            raise ValidationError("Teacher is required")
        if not validated_data.get('class_fk'):
            raise ValidationError("Class is required")
        if not validated_data.get('subject'):
            raise ValidationError("Subject is required")

        # Check for existing assignment (unique constraint)
        from django.db.models import Q
        existing = TeacherAssignment.objects.filter(
            teacher=validated_data.get('teacher'),
            class_fk=validated_data.get('class_fk'),
            section=validated_data.get('section'),
            subject=validated_data.get('subject'),
            term=validated_data.get('term')
        ).first()

        if existing:
            raise ValidationError(
                f"Teacher assignment already exists for this teacher, class, section, subject, and term combination"
            )

        return super().create(validated_data)

    def get_class_details(self, obj):
        if obj.class_fk:
            return {'id': str(obj.class_fk.id), 'grade': obj.class_fk.grade}
        return None

    def get_section_details(self, obj):
        if obj.section:
            return {'id': str(obj.section.id), 'name': obj.section.name}
        return None

    def get_subject_details(self, obj):
        if obj.subject:
            return {'id': str(obj.subject.id), 'name': obj.subject.name, 'code': obj.subject.code}
        return None

    def get_term_details(self, obj):
        if obj.term:
            return {'id': str(obj.term.id), 'name': obj.term.name, 'academic_year': obj.term.academic_year}
        return None