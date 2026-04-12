from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from users.models import User
from .models import Parent, Student, ParentStudent, ParentRelationship
from .serializers import ParentRelationshipSerializer

class ParentSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    full_name = serializers.CharField(source='user.full_name', read_only=True)
    
    class Meta:
        model = Parent
        fields = ['id', 'email', 'full_name', 'mobile_telephone', 'work_telephone', 
                  'citizenship', 'employer_name', 'jobtitle', 'languages_spoken', 'address']

class ParentRegistrationSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    relationship = serializers.CharField(max_length=50)
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

class StudentWithParentSerializer(serializers.ModelSerializer):
    parent = ParentRegistrationSerializer(write_only=True, required=False)
    parent_info = ParentSerializer(source='parent_links__parent', read_only=True, many=True)
    
    class Meta:
        model = Student
        fields = ['id', 'student_id', 'user', 'birth_date', 'gender', 'grade', 'section', 
                  'branch', 'citizenship', 'family_status', 'family_residence', 
                  'parent', 'parent_info']
        read_only_fields = ['student_id', 'id']
    
    def create(self, validated_data):
        parent_data = validated_data.pop('parent', None)
        
        # Create student user first
        student_user_data = validated_data.pop('user', {})
        
        # Create the student
        student = Student.objects.create(**validated_data)
        
        # Create or link parent if provided
        if parent_data:
            # Check if parent already exists
            try:
                parent_user = User.objects.get(email=parent_data['email'])
                parent = Parent.objects.get(user=parent_user)
            except User.DoesNotExist:
                from users.models import Role, UserRole

                # Ensure parent role exists
                parent_role, _ = Role.objects.get_or_create(
                    name='parent',
                    defaults={'description': 'Parent role with access to child information'}
                )

                # Create new parent user
                parent_user = User.objects.create_user(
                    email=parent_data['email'],
                    full_name=parent_data['full_name'],
                    password=parent_data['password']
                )

                # Assign parent role
                UserRole.objects.get_or_create(
                    user=parent_user,
                    role=parent_role,
                    defaults={'access_level': 'read'}
                )

                # Create parent profile
                parent = Parent.objects.create(
                    user=parent_user,
                    mobile_telephone=parent_data.get('phone', '')
                )
            
            # Get or create relationship
            relationship, _ = ParentRelationship.objects.get_or_create(
                name=parent_data['relationship']
            )
            
            # Link parent to student
            ParentStudent.objects.create(
                parent=parent,
                student=student,
                relationship=relationship
            )
            
            # Set as emergency contact
            student.emergency_contact = parent
            student.save()
        
        return student

class ParentStudentLinkSerializer(serializers.ModelSerializer):
    parent_details = ParentSerializer(source='parent', read_only=True)
    student_details = serializers.SerializerMethodField()
    relationship_name = serializers.CharField(source='relationship.name', read_only=True)
    
    class Meta:
        model = ParentStudent
        fields = ['id', 'parent', 'student', 'relationship', 'relationship_name', 
                  'parent_details', 'student_details']
    
    def get_student_details(self, obj):
        return {
            'id': obj.student.id,
            'student_id': obj.student.student_id,
            'full_name': obj.student.user.full_name,
            'grade': obj.student.grade.name if obj.student.grade else None,
            'section': obj.student.section.name if obj.student.section else None,
        }

class ParentDashboardSerializer(serializers.Serializer):
    student = serializers.SerializerMethodField()
    attendance = serializers.SerializerMethodField()
    schedule = serializers.SerializerMethodField()
    assignments = serializers.SerializerMethodField()
    announcements = serializers.SerializerMethodField()
    progress = serializers.SerializerMethodField()
    
    def get_student(self, obj):
        student = obj.get('student')
        if student:
            return {
                'id': student.id,
                'student_id': student.student_id,
                'full_name': student.user.full_name,
                'grade': student.grade.name if student.grade else None,
                'section': student.section.name if student.section else None,
                'gender': student.gender,
                'birth_date': student.birth_date,
            }
        return None
    
    def get_attendance(self, obj):
        # Placeholder - will be implemented with actual attendance data
        return []
    
    def get_schedule(self, obj):
        # Placeholder - will be implemented with actual schedule data
        return []
    
    def get_assignments(self, obj):
        # Placeholder - will be implemented with actual assignment data
        return []
    
    def get_announcements(self, obj):
        # Placeholder - will be implemented with actual announcement data
        return []
    
    def get_progress(self, obj):
        # Placeholder - will be implemented with actual progress data
        return {}
