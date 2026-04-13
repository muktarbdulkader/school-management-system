from rest_framework import serializers
from academics.models import Class, Section
from academics.serializers import ClassesSerializer, SectionsSerializer
from users.models import Branch, User
from users.serializers import BranchSerializer, UserSerializer
from .models import BehaviorIncidents, BehaviorRatings, HealthConditions, Parent, ParentRelationship, Student, ParentStudent, StudentHealthRecords

class ParentSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        write_only=True
    )
    user_details = UserSerializer(source='user', read_only=True)
    class Meta:
        model = Parent
        fields = '__all__'

class SectionField(serializers.SlugRelatedField):
    def __init__(self, **kwargs):
        super().__init__(slug_field='id', **kwargs)

    def to_internal_value(self, data):
        grade_id = self.parent.initial_data.get('grade')
        if grade_id:
            try:
                grade = Class.objects.get(id=grade_id)
                self.queryset = Section.objects.filter(class_fk=grade)
            except Class.DoesNotExist:
                self.queryset = Section.objects.none()
        value = super().to_internal_value(data)
        if value and grade_id:
            section_class_id = value.class_fk.id if hasattr(value.class_fk, 'id') else value.class_fk
            if str(section_class_id) != str(grade_id):
                raise serializers.ValidationError("The selected section does not belong to the chosen class.")
        return value

    def to_representation(self, value):
        return super().to_representation(value)

class StudentSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        required=False  # Make it not required so PATCH works
    )
    branch = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.all(),
        write_only=True,
        required=False,
        allow_null=True
    )
    branch_details = BranchSerializer(source='branch', read_only=True)
    user_details = UserSerializer(source='user', read_only=True)
    section = SectionField(
        queryset=Section.objects.all(),
        required=False,
        allow_null=True
    )
    section_details = SectionsSerializer(source='section', read_only=True)
    grade = serializers.PrimaryKeyRelatedField(
        queryset=Class.objects.all(),
        write_only=True,
        required=False,
        allow_null=True
    )
    grade_details = ClassesSerializer(source='grade', read_only=True)
    name = serializers.CharField(source='user.full_name', read_only=True)
    emergency_contact = serializers.PrimaryKeyRelatedField(
        queryset=Parent.objects.all(),
        write_only=True,
        required=False,
        allow_null=True
    )
    emergency_contact_detail = ParentSerializer(source="emergency_contact", read_only=True)
    parent_details = serializers.SerializerMethodField()
    health_details = serializers.SerializerMethodField()
    is_enrolled_in_subjects = serializers.SerializerMethodField()

    def get_parent_details(self, obj):
        """Get linked parent information"""
        parent_link = ParentStudent.objects.filter(student=obj).select_related('parent', 'parent__user', 'relationship').first()
        if parent_link:
            return {
                'user_details': {
                    'full_name': parent_link.parent.user.full_name,
                    'email': parent_link.parent.user.email,
                },
                'mobile_telephone': parent_link.parent.mobile_telephone,
                'relationship': parent_link.relationship.name if parent_link.relationship else 'Parent'
            }
        return None


    class Meta:
        model = Student
        fields = [
            'id', 'user', 'user_details', 'name', 'student_id', 'branch', 'branch_details',
            'section', 'section_details', 'grade', 'grade_details', 'birth_date',
            'gender', 'emergency_contact', 'emergency_contact_detail', 'parent_details',
            'family_status', 'family_residence', 'health_details', 'citizenship', 'is_enrolled_in_subjects'
        ]
        read_only_fields = ['student_id']

    def get_health_details(self, obj):
        records = obj.health_records.all().order_by('-date')
        return StudentHealthRecordsSerializer(records, many=True, context={'exclude_student': True}).data

    def get_is_enrolled_in_subjects(self, obj):
        from students.models import StudentSubject
        return StudentSubject.objects.filter(student=obj).exists()


    def validate(self, data):
        # For create operations, user is required
        if not self.instance and 'user' not in data:
            raise serializers.ValidationError({"user": "This field is required when creating a student."})

        # Only check for duplicate user if this is a true duplicate (not an empty auto-created profile)
        user = data.get('user')
        if user and not self.instance:  # Only check on create
            existing_student = Student.objects.filter(user=user).first()
            if existing_student:
                # Check if this is an empty profile (auto-created by signal with no meaningful data)
                is_empty_profile = (
                    not existing_student.grade and
                    not existing_student.section and
                    not existing_student.birth_date and
                    not existing_student.gender
                )
                if is_empty_profile:
                    # Update the existing empty profile instead of creating new
                    self.instance = existing_student
                # If profile has data, we'll allow it to proceed and let the view handle it
                # The view will update the existing profile with new data

        # Check for duplicate student_id (this should be unique across all students)
        student_id = data.get('student_id')
        if student_id:
            query = Student.objects.filter(student_id=student_id)
            if self.instance:
                query = query.exclude(id=self.instance.id)
            if query.exists():
                raise serializers.ValidationError({
                    "student_id": f"A student with ID {student_id} already exists."
                })

        # Get grade and section from data or instance
        grade = data.get('grade', getattr(self.instance, 'grade', None) if self.instance else None)
        section = data.get('section', getattr(self.instance, 'section', None) if self.instance else None)

        # Only validate section-class relationship if both are provided and section is being changed
        if grade and section:
            # Get the section's class_fk - handle both object and ID
            section_class_id = section.class_fk.id if hasattr(section.class_fk, 'id') else section.class_fk
            grade_id = grade.id if hasattr(grade, 'id') else grade

            # Compare the IDs
            if str(section_class_id) != str(grade_id):
                raise serializers.ValidationError({
                    "section": "The selected section does not belong to the chosen class."
                })

        # Check section capacity only if section is being changed
        if section:
            # Only check capacity if section is actually changing
            is_section_changing = True
            if self.instance and self.instance.section:
                is_section_changing = str(section.id if hasattr(section, 'id') else section) != str(self.instance.section.id)

            if is_section_changing and section.capacity:
                # Exclude the current instance if updating
                instance = getattr(self, 'instance', None)
                student_count = Student.objects.filter(section=section).exclude(id=instance.id if instance else None).count()
                if student_count >= section.capacity:
                    raise serializers.ValidationError({
                        "section": f"Section {section.name} has reached its maximum capacity of {section.capacity} students."
                    })
        return data

    def create(self, validated_data):
        return super().create(validated_data)

    def update(self, instance, validated_data):
        section = validated_data.get('section')
        if section and section != instance.section and section.capacity:
            student_count = Student.objects.filter(section=section).exclude(id=instance.id).count()
            if student_count >= section.capacity:
                raise serializers.ValidationError(
                    f"Section {section.name} has reached its maximum capacity of {section.capacity} students."
                )
        return super().update(instance, validated_data)

class ParentRelationshipSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParentRelationship
        fields = '__all__'

class ParentStudentSerializer(serializers.ModelSerializer):
    parent = serializers.PrimaryKeyRelatedField(
        queryset=Parent.objects.all(),
        write_only=True
    )
    parent_details = ParentSerializer(source='parent', read_only=True)
    student = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all(),
        write_only=True
    )
    student_details = StudentSerializer(source='student', read_only=True)
    relationship = serializers.PrimaryKeyRelatedField(queryset=ParentRelationship.objects.all(), write_only = True)
    relationship_details = ParentRelationshipSerializer(source = 'relationship', read_only=True)
    class Meta:
        model = ParentStudent
        fields = '__all__'

class HealthConditionsSerializer(serializers.ModelSerializer):
    class Meta:
        model = HealthConditions
        fields = '__all__'

class StudentHealthRecordsSerializer(serializers.ModelSerializer):
    student_id = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all(),
        write_only=True
    )
    student_details = serializers.SerializerMethodField()

    def get_student_details(self, obj):
        return {
            'id': obj.student_id.id,
            'user_id': obj.student_id.user.id,
            'full_name': obj.student_id.user.full_name,
            'name': obj.student_id.user.full_name,
            'student_id': obj.student_id.student_id
        }
    recorded_by = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        write_only=True,
        required=False,
        allow_null=True
    )
    recorded_by_details = UserSerializer(source='recorded_by', read_only=True)
    condition = serializers.PrimaryKeyRelatedField(
        queryset=HealthConditions.objects.all(),
        write_only=True,
        allow_null=True,
        required=False
    )
    condition_details = HealthConditionsSerializer(source='condition', read_only=True)

    class Meta:
        model = StudentHealthRecords
        fields = ['id', 'student_id', 'student_details', 'history', 'incident', 'date', 'recorded_by', 
                'recorded_by_details', 'condition', 'condition_details']
        read_only_fields = ['id', 'student_details', 'recorded_by_details', 'condition_details']

    def get_fields(self):
        fields = super().get_fields()
        # Remove student_details to prevent circular reference when called from StudentSerializer
        if self.context.get('exclude_student'):
            fields.pop('student_details', None)
        return fields

    def validate(self, data):
        if 'student_id' not in data or data['student_id'] is None:
            raise serializers.ValidationError({"student_id": "This field is required."})
        return data
class BehaviorIncidentsSerializer(serializers.ModelSerializer):
    student_id = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all(),
        write_only=True,
        required=True,
        source='student'
    )
    student_details = serializers.SerializerMethodField()

    def get_student_details(self, obj):
        return {
            'id': obj.student.id,
            'user_id': obj.student.user.id,
            'full_name': obj.student.user.full_name,
            'name': obj.student.user.full_name,
            'student_id': obj.student.student_id
        }
    reported_by = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        write_only=True,
        required=False
    )
    reported_by_details = UserSerializer(source='reported_by', read_only=True)

    def create(self, validated_data):
        # Auto-set reported_by to current user if not provided
        request = self.context.get('request')
        if 'reported_by' not in validated_data and request:
            validated_data['reported_by'] = request.user
        return super().create(validated_data)

    class Meta:
        model = BehaviorIncidents
        fields = '__all__'

class BehaviorRatingsSerializer(serializers.ModelSerializer):
    student_id = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all(),
        write_only=True,
        required=False
    )
    student = serializers.CharField(write_only=True, required=False)
    student_details = serializers.SerializerMethodField()

    def get_student_details(self, obj):
        return {
            'id': obj.student_id.id,
            'user_id': obj.student_id.user.id,
            'full_name': obj.student_id.user.full_name,
            'name': obj.student_id.user.full_name,
            'student_id': obj.student_id.student_id
        }
    rated_by = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        write_only=True,
        allow_null=True,  # Matches model null=True
        required=False
    )
    rated_by_details = UserSerializer(source='rated_by', read_only=True)
    rating = serializers.IntegerField(min_value=1, max_value=100)
    rated_on = serializers.DateField(required=False)  # Make it optional, will default to today
    incident = serializers.SerializerMethodField()

    def get_incident(self, obj):
        return BehaviorIncidentsSerializer(obj.student_id.behavior_incidents.filter(incident_date=obj.rated_on).first()).data if obj.student_id.behavior_incidents.filter(incident_date=obj.rated_on).exists() else None

    class Meta:
        model = BehaviorRatings
        fields = ['id', 'student_id', 'student_details', 'rated_by', 'rated_by_details', 'category', 'rating', 'notes', 'rated_on', 'incident']
        read_only_fields = ['id', 'student_details', 'rated_by_details', 'incident']

    def validate(self, data):
        # Set rated_on to today if not provided
        if 'rated_on' not in data or data['rated_on'] is None:
            from django.utils import timezone
            data['rated_on'] = timezone.now().date()

        # Handle student field - can be UUID or string representation
        if 'student' in data and data['student'] and 'student_id' not in data:
            student_value = data['student']
            # If it's a display string like "kasim (STU-2026-0003)", try to find by student_id
            if isinstance(student_value, str) and '(' in student_value and ')' in student_value:
                try:
                    student_id_str = student_value.split('(')[1].split(')')[0]
                    student = Student.objects.filter(student_id=student_id_str).first()
                    if student:
                        data['student_id'] = student
                    else:
                        raise serializers.ValidationError({"student": f"Student with ID {student_id_str} not found"})
                except (IndexError, Student.DoesNotExist):
                    raise serializers.ValidationError({"student": "Invalid student format"})
            # If it's a UUID string
            elif isinstance(student_value, str):
                try:
                    import uuid
                    student_uuid = uuid.UUID(student_value)
                    student = Student.objects.filter(id=student_uuid).first()
                    if student:
                        data['student_id'] = student
                    else:
                        raise serializers.ValidationError({"student": f"Student with ID {student_value} not found"})
                except ValueError:
                    raise serializers.ValidationError({"student": "Invalid student UUID format"})

        if 'student_id' not in data or data['student_id'] is None:
            raise serializers.ValidationError({"student_id": "This field is required."})
        if 'category' not in data or not data['category']:
            raise serializers.ValidationError({"category": "This field is required."})
        if 'rating' not in data or data['rating'] is None:
            raise serializers.ValidationError({"rating": "This field is required."})
        return data