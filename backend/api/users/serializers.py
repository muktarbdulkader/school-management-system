from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Branch, Role, RolePermission, User, UserBranchAccess, UserProfile, UserRole

class UserSerializer(serializers.ModelSerializer):
    roles = serializers.SerializerMethodField()
    branch_id = serializers.SerializerMethodField()
    branches = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'is_active', 'is_staff', 'created_at', 'roles', 'branch_id', 'branches']
        read_only_fields = ['id', 'created_at']

    def get_roles(self, obj):
        return list(obj.userrole_set.values_list('role__name', flat=True))

    def get_branch_id(self, obj):
        access = UserBranchAccess.objects.filter(user=obj).first()
        return str(access.branch_id) if access else None

    def get_branches(self, obj):
        return list(UserBranchAccess.objects.filter(user=obj).values('branch_id', 'branch__name', 'access_level'))

class UserRegistrationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    full_name = serializers.CharField(max_length=100)
    password = serializers.CharField(write_only=True)
    role_name = serializers.CharField(required=False)
    phone = serializers.CharField(max_length=20, required=False)
    branch_id = serializers.UUIDField(required=False)

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = UserProfile
        fields = '__all__'

class RoleSerializer(serializers.ModelSerializer):
    permissions = serializers.SerializerMethodField()
    permission_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Role
        fields = ['id', 'name', 'description', 'permissions', 'permission_ids']

    def get_permissions(self, obj):
        # Use prefetched rolepermission_set (avoids N+1 queries)
        return [
            {
                'uuid': str(rp.permission.id),
                'id': str(rp.permission.id),
                'name': f"{rp.content_type.app_label} | {rp.content_type.model} | {rp.permission.name}",
                'codename': rp.permission.codename,
                'type': rp.content_type.model,
                'content_type': f"{rp.content_type.app_label} | {rp.content_type.model}"
            }
            for rp in obj.rolepermission_set.all()
        ]

    def update(self, instance, validated_data):
        permission_ids = validated_data.pop('permission_ids', None)
        role = super().update(instance, validated_data)

        if permission_ids is not None:
            from django.contrib.auth.models import Permission
            from django.contrib.contenttypes.models import ContentType

            # Get current permissions for this role
            current_permissions = set(
                RolePermission.objects.filter(role=role).values_list('permission_id', flat=True)
            )
            new_permissions = set(permission_ids)

            # Permissions to add
            to_add = new_permissions - current_permissions
            # Permissions to remove
            to_remove = current_permissions - new_permissions

            # Remove permissions
            if to_remove:
                RolePermission.objects.filter(role=role, permission_id__in=to_remove).delete()

            # Add new permissions
            for perm_id in to_add:
                try:
                    permission = Permission.objects.get(id=perm_id)
                    # Get content type from permission
                    content_type = permission.content_type
                    RolePermission.objects.get_or_create(
                        role=role,
                        content_type=content_type,
                        permission=permission
                    )
                except Permission.DoesNotExist:
                    continue

        return role

class UserRoleSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    role = RoleSerializer(read_only=True)

    class Meta:
        model = UserRole
        fields = '__all__'

class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = '__all__'

class BranchAccessSerializer(serializers.ModelSerializer):
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='user', write_only=True
    )
    branch_id = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.all(), source='branch', write_only=True
    )
    user = UserSerializer(read_only=True)
    branch = BranchSerializer(read_only=True)

    class Meta:
        model = UserBranchAccess
        fields = ['id', 'user', 'branch', 'user_id', 'branch_id', 'access_level']

class RolePermissionSerializer(serializers.ModelSerializer):
    role = RoleSerializer(read_only=True)

    class Meta:
        model = RolePermission
        fields = '__all__'

# Custom JWT Token Serializer
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['email'] = user.email
        token['full_name'] = user.full_name
        token['is_staff'] = user.is_staff
        token['roles'] = list(user.userrole_set.values_list('role__name', flat=True))

        return token

    def validate(self, attrs):
        # Support login by Email, Student ID, Teacher ID, or Full Name
        username = attrs.get('email')
        original_username = username
        user_found = False

        if username and '@' not in username:
            from students.models import Student
            from teachers.models import Teacher
            from django.contrib.auth import get_user_model
            User = get_user_model()

            # Try Student ID (exact match or case-insensitive)
            student = Student.objects.filter(student_id__iexact=username).first()
            if student:
                attrs['username'] = student.user.email
                user_found = True
            else:
                # Try Teacher ID
                teacher = Teacher.objects.filter(teacher_id__iexact=username).first()
                if teacher:
                    attrs['username'] = teacher.user.email
                    user_found = True
                else:
                    # Try Full Name (case-insensitive partial match)
                    user = User.objects.filter(full_name__iexact=username).first()
                    if user:
                        attrs['username'] = user.email
                        user_found = True
        else:
            # Check if email exists
            from django.contrib.auth import get_user_model
            User = get_user_model()
            if User.objects.filter(email=username).exists():
                user_found = True

        # Now call super().validate which uses the resolved email
        try:
            data = super().validate(attrs)
        except Exception as e:
            # Provide specific, user-friendly error messages
            error_str = str(e).lower()

            if not user_found:
                raise serializers.ValidationError({
                    'detail': f'No account found with email/ID: {original_username}',
                    'status': 401
                })
            elif 'password' in error_str or 'credentials' in error_str:
                raise serializers.ValidationError({
                    'detail': 'Incorrect password. Please try again.',
                    'status': 401
                })
            elif 'inactive' in error_str or 'not active' in error_str:
                raise serializers.ValidationError({
                    'detail': 'Your account is inactive. Please contact the administrator.',
                    'status': 401
                })
            else:
                raise serializers.ValidationError({
                    'detail': 'Invalid email/ID or password. Please check your credentials and try again.',
                    'status': 401
                })

        # Add user data to response
        branch_access = UserBranchAccess.objects.filter(user=self.user).first()
        data['user'] = {
            'id': str(self.user.id),
            'email': self.user.email,
            'full_name': self.user.full_name,
            'is_active': self.user.is_active,
            'is_staff': self.user.is_staff,
            'roles': list(self.user.userrole_set.values_list('role__name', flat=True)),
            'branch_id': str(branch_access.branch_id) if branch_access else None
        }

        return data
