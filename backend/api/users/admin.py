from django.contrib import admin
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth.models import Permission
from django.contrib.auth.forms import ReadOnlyPasswordHashField
from django import forms
from .forms import RolePermissionForm
from .models import RolePermission, User, Role, UserProfile, UserRole, Branch, UserBranchAccess, has_model_permission

class UserCreationForm(forms.ModelForm):
    """Form for creating new users with password."""
    password1 = forms.CharField(label='Password', widget=forms.PasswordInput)
    password2 = forms.CharField(label='Password confirmation', widget=forms.PasswordInput)

    class Meta:
        model = User
        fields = ('email', 'full_name', 'is_staff', 'is_active', 'is_superuser')

    def clean_password2(self):
        password1 = self.cleaned_data.get("password1")
        password2 = self.cleaned_data.get("password2")
        if password1 and password2 and password1 != password2:
            raise forms.ValidationError("Passwords don't match")
        return password2

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password1"])
        if commit:
            user.save()
        return user

class UserChangeForm(forms.ModelForm):
    """Form for updating users with read-only password field."""
    password = ReadOnlyPasswordHashField(
        label="Password",
        help_text=(
            "Raw passwords are not stored, so there is no way to see this "
            "user's password, but you can change the password using "
            "<a href=\"../password/\">this form</a>."
        ),
    )

    class Meta:
        model = User
        fields = ('email', 'full_name', 'password', 'is_active', 'is_staff', 'is_superuser')

class UserRoleInline(admin.TabularInline):
    model = UserRole
    extra = 1
    fields = ('role', 'access_level')
    fk_name = 'user'
    verbose_name = "User Role"
    verbose_name_plural = "User Roles"

    def formfield_for_dbfield(self, db_field, request, **kwargs):
        if db_field.name == 'access_level':
            kwargs['widget'] = forms.Select(choices=[
                ('read', 'Read Only'),
                ('write', 'Read & Write'),
                ('admin', 'Admin'),
                ('full', 'Full Access'),
            ])
        return super().formfield_for_dbfield(db_field, request, **kwargs)

class UserBranchAccessInline(admin.TabularInline):
    model = UserBranchAccess
    extra = 1
    fields = ('branch', 'access_level')
    fk_name = 'user'
    verbose_name = "Branch Access"
    verbose_name_plural = "Branch Accesses"

    def formfield_for_dbfield(self, db_field, request, **kwargs):
        if db_field.name == 'access_level':
            kwargs['widget'] = forms.Select(choices=[
                ('full', 'Full Access'),
                ('limited', 'Limited Access'),
            ])
        return super().formfield_for_dbfield(db_field, request, **kwargs)

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    form = UserChangeForm
    add_form = UserCreationForm

    list_display = ('email', 'full_name', 'is_active', 'is_staff', 'is_superuser', 'get_roles')
    list_filter = ('is_active', 'is_staff', 'is_superuser', 'userrole__role')
    search_fields = ('email', 'full_name', 'id')
    ordering = ('email',)

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('full_name',)}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser')}),
        ('Important dates', {'fields': ('last_login', 'created_at')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'full_name', 'password1', 'password2', 'is_staff', 'is_active', 'is_superuser'),
        }),
    )

    inlines = [UserRoleInline, UserBranchAccessInline]
    readonly_fields = ('last_login', 'created_at')

    def get_roles(self, obj):
        roles = obj.userrole_set.all()
        return ", ".join([ur.role.name for ur in roles]) if roles else "No roles"
    get_roles.short_description = 'Roles'

    def get_form(self, request, obj=None, **kwargs):
        """Use special form during user creation"""
        defaults = {}
        if obj is None:
            defaults['form'] = self.add_form
        defaults.update(kwargs)
        return super().get_form(request, obj, **defaults)

    def get_fieldsets(self, request, obj=None):
        """Use add_fieldsets when creating a new user"""
        if not obj:
            return self.add_fieldsets
        return super().get_fieldsets(request, obj)

    def save_model(self, request, obj, form, change):
        """Save the user with proper password hashing"""
        if not change:
            # New user - password is already hashed by the form
            obj.save()
        else:
            # Existing user - only save if password wasn't changed
            if 'password' not in form.changed_data:
                obj.save()
            else:
                super().save_model(request, obj, form, change)

    def has_add_permission(self, request):
        return request.user.is_superuser or has_model_permission(
            user=request.user,
            model_name='User',
            permission_code='add_user'
        )

    def has_change_permission(self, request, obj=None):
        return request.user.is_superuser or has_model_permission(
            user=request.user,
            model_name='User',
            permission_code='change_user'
        )

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser or has_model_permission(
            user=request.user,
            model_name='User',
            permission_code='delete_user'
        )
@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'phone', 'gender')
    search_fields = ('id', 'user', 'gender')
@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'description')
    actions = ['assign_default_permissions']

    def assign_default_permissions(self, request, queryset):
        models_to_include = [
            'user', 'branch', 'role', 'rolepermission', 'userprofile', 'userrole', 'userbranchaccess',
            'chat', 'groupchat', 'groupchatmember', 'groupchatmessage', 'meeting', 'announcement', 'parentfeedback',
            'parent', 'student', 'parentstudent', 'parentrelationship', 'teacher', 'class', 'section', 'subject', 'exam', 'attendance',   'classscheduleslot', 'studentscheduleoverride', 'subjectexamday', 'term', 'teacherassignment', 'classelectiveoffering', 'classextraoffering', 'studentsubject', 'studentelectivechoice', 'studentextrachoice', 'assignments', 'studentassignments', 'examresults', 'learningobjectives', 'lessonplans', 'lessonactivities', 'lessonplanevaluations', 'lessonplanobjectives', 'objectivecategories', 'objectiveunits', 'objectivesubunits', 'healthconditions', 'studenthealthrecords', 'behaviorincidents', 'behaviorratings', 'blogcategory', 'blogpost', 'blogcomment'
        ]
        apps_to_include = ['users', 'communication', 'students', 'teachers', 'academics', 'schedule', 'lessontopics', 'blogs']

        content_types = ContentType.objects.filter(
            app_label__in=apps_to_include,
            model__in=models_to_include
        )
        role_content_type = ContentType.objects.get(app_label='users', model='role')
        content_types = list(content_types) + [role_content_type]

        crud_actions = ['view', 'add', 'change', 'delete']
        custom_permissions = ['can_add_user', 'can_edit_user', 'can_delete_user']
        desired_codenames = [f"{action}_{model}" for model in models_to_include for action in crud_actions] + custom_permissions

        # Filter permissions per content type
        permissions = []
        for ct in content_types:
            if ct == role_content_type:
                perms = Permission.objects.filter(content_type=ct, codename__in=custom_permissions)
            else:
                perms = Permission.objects.filter(
                    content_type=ct,
                    codename__in=[f"{action}_{ct.model}" for action in crud_actions]
                )
            permissions.extend(perms)

        created_count = 0
        for role in queryset:
            for permission in permissions:
                obj, created = RolePermission.objects.get_or_create(
                    role=role,
                    content_type=permission.content_type,
                    permission=permission
                )
                if created:
                    created_count += 1

        self.message_user(request, f"Default CRUD permissions assigned to {queryset.count()} role(s). Created {created_count} new entries.")

    assign_default_permissions.short_description = "Assign default CRUD permissions"

@admin.register(RolePermission)
class RolePermissionAdmin(admin.ModelAdmin):
    list_display = ('role', 'content_type', 'permission')
    search_fields = ('role__name', 'content_type__model', 'permission__codename')

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "content_type":
            kwargs["queryset"] = ContentType.objects.all()  # Show all content types
        elif db_field.name == "permission":
            kwargs["queryset"] = Permission.objects.all()  # Show all permissions
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'role', 'assigned_by', 'assigned_at', 'access_level')
    list_filter = ('role', 'access_level')

@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'address')
    search_fields = ('name', 'address')
    list_filter = ('name',)

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if not request.user.is_superuser:
            return qs.filter(userbranchaccess__user=request.user)
        return qs

@admin.register(UserBranchAccess)
class UserBranchAccessAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'branch', 'access_level')
    list_filter = ('branch', 'access_level')
