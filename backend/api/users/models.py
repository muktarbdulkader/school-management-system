import uuid
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager, Permission
from rest_framework.permissions import BasePermission
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction


class Branch(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    address = models.TextField()
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    is_main = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.code})"

class CustomUserManager(BaseUserManager):
    def create_user(self, email, full_name, password=None, role_name=None, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address")
        email = self.normalize_email(email)
        user = self.model(email=email, full_name=full_name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)

        if role_name:
            role = Role.objects.filter(name__iexact=role_name).first()
            if role:
                UserRole.objects.create(user=user, role=role, access_level='full', assigned_by=None)
            else:
                raise ValueError(f"Role '{role_name}' does not exist")
        return user

    def create_superuser(self, email, full_name, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, full_name, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = CustomUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name"]

    def __str__(self):
        return self.full_name

    @property
    def roles(self):
        return list(self.userrole_set.values_list('role__name', flat=True))
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone = models.CharField(max_length=20, blank=True)
    gender = models.CharField(max_length=10, blank=True)
    profile_picture = models.ImageField(upload_to='profiles/', blank=True, null=True)
    bio = models.TextField(blank=True)

    def __str__(self):
        return f"{self.user.full_name} Profile"

@receiver(post_save, sender=User)
def create_user_related_models(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.get_or_create(user=instance)

def _create_role_based_models(instance):
    """
    Create role-based profile models (Teacher, Student, Parent) when a user is assigned a role.
    Checks for existing profiles to prevent duplicates.
    """
    from teachers.models import Teacher
    from students.models import Student, Parent
    from users.models import UserRole

    user_roles = UserRole.objects.filter(user=instance)
    for user_role in user_roles:
        role_name = user_role.role.name.lower()

        if role_name == 'teacher':
            # Check if teacher profile already exists
            if not Teacher.objects.filter(user=instance).exists():
                try:
                    Teacher.objects.create(
                        user=instance, 
                        subject_specialties='',
                        rating=0.0,
                        attendance_percentage=0.0
                    )
                except Exception as e:
                    print(f"[UserModel] Error creating Teacher profile for {instance.email}: {e}")

        elif role_name == 'student':
            # Check if student profile already exists
            if not Student.objects.filter(user=instance).exists():
                try:
                    Student.objects.create(
                        user=instance,
                        branch=None,
                        birth_date=None,
                        family_status='',
                        family_residence='',
                        emergency_contact=None,
                        citizenship='',
                        gender=''
                    )
                except Exception as e:
                    print(f"[UserModel] Error creating Student profile for {instance.email}: {e}")

        elif role_name == 'parent':
            # Check if parent profile already exists
            if not Parent.objects.filter(user=instance).exists():
                try:
                    Parent.objects.create(
                        user=instance,
                        citizenship='',
                        employer_name='',
                        jobtitle='',
                        mobile_telephone='',
                        work_telephone='',
                        languages_spoken='',
                        address=''
                    )
                except Exception as e:
                    print(f"[UserModel] Error creating Parent profile for {instance.email}: {e}")


class Role(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50)
    description = models.TextField(blank=True)

    class Meta:
        permissions = [
            ("can_add_user", "Can Add users"),
            ("can_edit_user", "Can edit users"),
            ("can_delete_user", "Can delete users"),
        ]

    def __str__(self):
        return self.name

class RolePermission(models.Model):
    role = models.ForeignKey('Role', on_delete=models.CASCADE)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE)

    class Meta:
        db_table = 'users_rolepermission'
        unique_together = [['role', 'content_type', 'permission']]
        verbose_name = 'Role Permission'
        verbose_name_plural = 'Role Permissions'

    def __str__(self):
        return f"{self.role.name} - {self.content_type.app_label}.{self.permission.codename}"

def has_model_permission(user, model_name, permission_code, branch_id=None):
    if not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    user_roles = UserRole.objects.filter(user=user).select_related('role')
    role_ids = user_roles.values_list('role_id', flat=True)

    # Determine content type based on permission
    if permission_code in ['can_add_user', 'can_edit_user', 'can_delete_user']:
        try:
            content_type = ContentType.objects.get(app_label='users', model='role')
        except ContentType.DoesNotExist:
            return False
    else:
        try:
            content_type = ContentType.objects.get(model=model_name.lower())
        except ContentType.DoesNotExist:
            return False

    permission_exists = RolePermission.objects.filter(
        role_id__in=role_ids,
        content_type=content_type,
        permission__codename=permission_code,
    ).exists()
        # if branch_id and permission_exists:
    #     return UserBranchAccess.objects.filter(
    #         user=user,
    #         branch_id=branch_id,
    #         access_level__in=['full', 'limited'],
    #     ).exists()
    return permission_exists
class HasModelPermission(BasePermission):
    def has_permission(self, request, view):
        model_name = view.queryset.model.__name__
        action_map = {
            'GET': 'view',
            'POST': 'add',
            'PUT': 'change',
            'PATCH': 'change',
            'DELETE': 'delete',
        }

        required_permission = action_map.get(request.method)
        return has_model_permission(request.user, model_name, required_permission)

class UserRole(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    role = models.ForeignKey(Role, on_delete=models.CASCADE)
    assigned_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="assigned_roles")
    assigned_at = models.DateTimeField(auto_now_add=True)
    access_level = models.CharField(max_length=20)  # "read", "write", "admin"

    def __str__(self):
        return f"{self.user.full_name} - {self.role.name}"

class UserBranchAccess(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)
    access_level = models.CharField(max_length=20)  # "full", "limited"

    def __str__(self):
        return f"{self.user.full_name} - {self.branch.name} ({self.access_level})"
class OTPDevice(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='otp_device')
    otp_code = models.CharField(max_length=6, blank=True, null=True)
    otp_expiry = models.DateTimeField(blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def is_valid(self):
        from django.utils import timezone
        return self.otp_code and self.otp_expiry and timezone.now() < self.otp_expiry

    def __str__(self):
        return f"OTP for {self.user.email}"


class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reset_tokens')
    token = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    def is_valid(self):
        from django.utils import timezone
        return not self.is_used and timezone.now() < self.expires_at

    def __str__(self):
        return f"Reset token for {self.user.email}"


