from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.core.management import call_command
from io import StringIO

from .models import Branch, Role, RolePermission, UserBranchAccess, UserProfile, UserRole, has_model_permission
from .serializers import (
    BranchAccessSerializer, BranchSerializer, RolePermissionSerializer, 
    RoleSerializer, UserProfileSerializer, UserRegistrationSerializer, 
    UserRoleSerializer, UserSerializer
)

User = get_user_model()


@api_view(['POST'])
@permission_classes([AllowAny])
def initialize_system(request):
    """
    One-time setup endpoint to initialize roles, users, and assignments.
    This endpoint should be disabled after initial setup for security.
    """
    # Check if system is already initialized
    if Role.objects.exists():
        return Response({
            'status': 'already_initialized',
            'message': 'System has already been initialized. Roles already exist.',
            'roles_count': Role.objects.count(),
            'users_count': User.objects.count()
        }, status=status.HTTP_200_OK)

    try:
        results = {}

        # Capture command output
        def run_command(command_name):
            output = StringIO()
            try:
                call_command(command_name, stdout=output)
                return {'success': True, 'output': output.getvalue()}
            except Exception as e:
                return {'success': False, 'error': str(e)}

        # Run initialization commands
        results['create_roles'] = run_command('create_roles')
        results['create_users'] = run_command('create_users')
        results['assign_students'] = run_command('assign_students_to_classes')
        results['assign_teachers'] = run_command('assign_teachers_to_branches')

        # Get final counts
        summary = {
            'roles_created': Role.objects.count(),
            'users_created': User.objects.count(),
            'status': 'success',
            'message': 'System initialized successfully!',
            'details': results
        }

        return Response(summary, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({
            'status': 'error',
            'message': f'Error during initialization: {str(e)}',
            'details': results if 'results' in locals() else {}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def system_status(request):
    """
    Check system initialization status
    """
    return Response({
        'initialized': Role.objects.exists(),
        'roles_count': Role.objects.count(),
        'users_count': User.objects.count(),
        'sample_roles': list(Role.objects.values_list('name', flat=True)[:5])
    })


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        branch_id = self.request.query_params.get('branch_id')
        role_name = self.request.query_params.get('role')

        if branch_id and not has_model_permission(user, 'user', 'view_user', branch_id):
            raise PermissionDenied("You do not have permission to view users in this branch.")

        queryset = self.queryset.filter(is_active=True)
        if role_name:
            queryset = queryset.filter(userrole__role__name__iexact=role_name)
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        })

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        })

    def create(self, request, *args, **kwargs):
        user = request.user
        is_admin = user.is_superuser or user.is_staff or any(
            r.lower() in ['admin', 'super_admin', 'ceo', 'head_admin'] 
            for r in user.userrole_set.values_list('role__name', flat=True)
        )
        if not is_admin and not has_model_permission(user, 'User', 'add_user'):
            raise PermissionDenied("You do not have permission to create users.")

        data = request.data
        full_name = data.get('full_name', '').strip()
        if not full_name:
            full_name = data.get('name', '').strip()

        email = data.get('email', '').strip()
        password = data.get('password', 'changeme123')
        role_name = data.get('role', '')

        if not full_name or not email:
            return Response({'success': False, 'message': 'full_name and email are required'}, status=400)

        if User.objects.filter(email=email).exists():
            return Response({'success': False, 'message': 'A user with this email already exists'}, status=400)

        from django.db import transaction
        try:
            with transaction.atomic():
                user = User.objects.create_user(email=email, full_name=full_name, password=password)
                if role_name:
                    try:
                        role = Role.objects.get(name__iexact=role_name)
                        UserRole.objects.create(user=user, role=role, access_level='read')
                    except Role.DoesNotExist:
                        pass
                serializer = self.get_serializer(user)
                return Response({'success': True, 'message': 'User created successfully', 'status': 201, 'data': serializer.data}, status=201)
        except Exception as e:
            return Response({'success': False, 'message': str(e)}, status=400)

    def perform_create(self, serializer):
        branch_id = self.request.data.get('branch_id')
        user = self.request.user
        is_admin = user.is_superuser or user.is_staff or any(
            r.lower() in ['admin', 'super_admin', 'ceo', 'head_admin'] 
            for r in user.userrole_set.values_list('role__name', flat=True)
        )
        if not is_admin:
            if branch_id and not has_model_permission(user, 'User', 'add_user', branch_id):
                raise PermissionDenied("You do not have permission to create users in this branch.")
            elif not branch_id and not has_model_permission(user, 'User', 'add_user'):
                raise PermissionDenied("You do not have permission to create users.")
        serializer.save()

    def update(self, request, *args, **kwargs):
        user = request.user
        is_admin = user.is_superuser or user.is_staff or any(
            r.lower() in ['admin', 'super_admin', 'ceo', 'head_admin'] 
            for r in user.userrole_set.values_list('role__name', flat=True)
        )
        if not is_admin and not has_model_permission(user, 'User', 'change_user'):
            raise PermissionDenied("You do not have permission to update users.")

        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        })

    def destroy(self, request, *args, **kwargs):
        user = request.user
        is_admin = user.is_superuser or user.is_staff or any(
            r.lower() in ['admin', 'super_admin', 'ceo', 'head_admin'] 
            for r in user.userrole_set.values_list('role__name', flat=True)
        )
        if not is_admin and not has_model_permission(user, 'User', 'delete_user'):
            raise PermissionDenied("You do not have permission to delete users.")

        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({
            'success': True,
            'message': 'OK',
            'status': 204,
            'data': []
        }, status=204)

    @action(detail=True, methods=['post'], url_path='update_status')
    def update_status(self, request, pk=None):
        """Toggle user active/inactive status"""
        user = self.get_object()
        new_status = request.data.get('status')

        # Only superuser can change status
        if not request.user.is_superuser:
            return Response({
                'success': False,
                'message': 'Only superusers can change user status',
                'status': 403
            }, status=403)

        if new_status == 'active':
            user.is_active = True
        elif new_status == 'inactive':
            user.is_active = False
        else:
            # Toggle if not specified
            user.is_active = not user.is_active

        user.save()

        return Response({
            'success': True,
            'message': f'Status updated to {"active" if user.is_active else "inactive"}',
            'status': 200,
            'data': {'id': user.id, 'is_active': user.is_active}
        })

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """List all users waiting for approval (is_active=False)"""
        if not request.user.is_superuser:
            return Response({
                'success': False,
                'message': 'Only superusers can view pending approvals',
                'status': 403
            }, status=403)
        
        pending_users = User.objects.filter(is_active=False)
        serializer = self.get_serializer(pending_users, many=True)
        return Response({
            'success': True,
            'message': 'Pending users retrieved',
            'status': 200,
            'data': serializer.data
        })

    @action(detail=True, methods=['post'], url_path='change-password')
    def change_password(self, request, pk=None):
        """Allow superuser to change any user's password"""
        user = self.get_object()
        new_password = request.data.get('new_password')

        if not new_password:
            return Response({
                'success': False,
                'message': 'new_password is required',
                'status': 400
            }, status=400)

        # Only superuser can change other users' passwords
        if not request.user.is_superuser and request.user.id != user.id:
            return Response({
                'success': False,
                'message': 'Only superusers can change other users passwords',
                'status': 403
            }, status=403)

        user.set_password(new_password)
        user.save()

        return Response({
            'success': True,
            'message': f'Password changed successfully for {user.email}',
            'status': 200,
            'data': {'email': user.email}
        })


class UserRegistrationViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        user = request.user
        if not user.is_authenticated:
            raise PermissionDenied("You must be logged in to register new users.")

        is_admin = user.is_superuser or user.is_staff or any(
            r.lower() in ['admin', 'super_admin', 'ceo', 'head_admin'] 
            for r in user.userrole_set.values_list('role__name', flat=True)
        )
        if not is_admin and not has_model_permission(user, 'User', 'add_user'):
            raise PermissionDenied("You do not have permission to register users.")

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = User.objects.create_user(
            email=serializer.validated_data['email'],
            full_name=serializer.validated_data['full_name'],
            password=serializer.validated_data['password'],
            role_name=serializer.validated_data.get('role_name')
        )

        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserProfile.objects.filter(user=self.request.user)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        })

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        })

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            'success': True,
            'message': 'OK',
            'status': 201,
            'data': serializer.data
        }, status=201)

    def perform_update(self, serializer):
        serializer.save(user=self.request.user)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        })

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({
            'success': True,
            'message': 'OK',
            'status': 204,
            'data': []
        }, status=204)


class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        branch_id = self.request.query_params.get('branch_id')

        if branch_id:
            if not has_model_permission(user, 'Role', 'view_role', None):
                raise PermissionDenied("You do not have permission to view roles in this branch.")
            return self.queryset.filter(userbranchaccess__branch_id=branch_id)
        return self.queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        })

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        })

    def perform_create(self, serializer):
        branch_id = self.request.data.get('branch_id')
        if branch_id and not has_model_permission(self.request.user, 'Role', 'add_role', None):
            raise PermissionDenied("You do not have permission to create roles in this branch.")
        serializer.save()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            'success': True,
            'message': 'OK',
            'status': 201,
            'data': serializer.data
        }, status=201)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        })

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({
            'success': True,
            'message': 'OK',
            'status': 204,
            'data': []
        }, status=204)


class UserRoleViewSet(viewsets.ModelViewSet):
    queryset = UserRole.objects.all()
    serializer_class = UserRoleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        branch_id = self.request.query_params.get('branch_id')

        if branch_id:
            if not has_model_permission(user, 'UserRole', 'view_user_role', branch_id):
                raise PermissionDenied("You do not have permission to view user roles in this branch.")
            return self.queryset.filter(userbranchaccess__branch_id=branch_id)
        return self.queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        })

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        })

    def perform_create(self, serializer):
        branch_id = self.request.data.get('branch_id')
        if branch_id and not has_model_permission(self.request.user, 'UserRole', 'add_user_role', branch_id):
            raise PermissionDenied("You do not have permission to create user roles in this branch.")
        serializer.save()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            'success': True,
            'message': 'OK',
            'status': 201,
            'data': serializer.data
        }, status=201)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        })

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({
            'success': True,
            'message': 'OK',
            'status': 204,
            'data': []
        }, status=204)


class BranchViewSet(viewsets.ModelViewSet):
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        branch_id = self.request.query_params.get('branch_id')
        queryset = self.queryset

        # 1. Superusers see all
        if user.is_superuser:
            if branch_id:
                return queryset.filter(id=branch_id)
            return queryset.all()

        # 2. Others (Admins, Staff, Teachers, Students) see ONLY assigned branches
        accessible_branches = UserBranchAccess.objects.filter(user=user).values_list('branch_id', flat=True)

        if branch_id:
            try:
                import uuid
                if uuid.UUID(branch_id) in accessible_branches:
                    return queryset.filter(id=branch_id)
                return queryset.none()
            except (ValueError, TypeError):
                return queryset.none()
        else:
            if not accessible_branches:
                # If they have no branch access, they see nothing
                return queryset.none()
            return queryset.filter(id__in=accessible_branches)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        })

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        })

    def perform_create(self, serializer):
        if not has_model_permission(self.request.user, 'Branch', 'add_branch', None):
            raise PermissionDenied("You do not have permission to create branches.")
        branch = serializer.save()
        UserBranchAccess.objects.create(user=self.request.user, branch=branch)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            'success': True,
            'message': 'OK',
            'status': 201,
            'data': serializer.data
        }, status=201)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        })

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({
            'success': True,
            'message': 'OK',
            'status': 204,
            'data': []
        }, status=204)


class BranchAccessViewSet(viewsets.ModelViewSet):
    queryset = UserBranchAccess.objects.all()
    serializer_class = BranchAccessSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        target_user_id = self.request.query_params.get('user_id')
        branch_id = self.request.query_params.get('branch_id')

        if user.is_superuser:
            queryset = self.queryset
            if target_user_id:
                queryset = queryset.filter(user_id=target_user_id)
            if branch_id:
                queryset = queryset.filter(branch_id=branch_id)
            return queryset

        return self.queryset.filter(user=user)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        })

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        })

    def perform_create(self, serializer):
        user = self.request.user
        if not user.is_superuser:
            raise PermissionDenied("Only superusers can manage branch access.")
        serializer.save()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            'success': True,
            'message': 'Branch access granted successfully',
            'status': 201,
            'data': serializer.data
        }, status=201)

    def update(self, request, *args, **kwargs):
        user = request.user
        if not user.is_superuser:
            raise PermissionDenied("Only superusers can manage branch access.")
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            'success': True,
            'message': 'Branch access updated successfully',
            'status': 200,
            'data': serializer.data
        })

    def destroy(self, request, *args, **kwargs):
        user = request.user
        if not user.is_superuser:
            raise PermissionDenied("Only superusers can manage branch access.")
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({
            'success': True,
            'message': 'Branch access removed successfully',
            'status': 204,
            'data': []
        }, status=204)


class RolePermissionViewSet(viewsets.ModelViewSet):
    queryset = RolePermission.objects.all().prefetch_related(
        'permission', 'content_type',
        'role__rolepermission_set',
        'role__rolepermission_set__permission',
        'role__rolepermission_set__content_type'
    )
    serializer_class = RolePermissionSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='available')
    def available_permissions(self, request):
        """
        Get all available Django permissions for role assignment.
        Returns permissions grouped by content type.
        """
        permissions = Permission.objects.select_related('content_type').all()
        data = [{
            'id': perm.id,
            'name': perm.name,
            'codename': perm.codename,
            'content_type': perm.content_type.name if perm.content_type else 'General'
        } for perm in permissions]

        return Response({
            'success': True,
            'message': 'Permissions retrieved successfully',
            'data': data
        })

    def get_queryset(self):
        user = self.request.user
        branch_id = self.request.query_params.get('branch_id')
        if branch_id and not has_model_permission(user, 'rolepermission', 'view_rolepermission', branch_id):
            raise PermissionDenied("You do not have permission to view role permissions in this branch.")
        return self.queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        roles = Role.objects.filter(rolepermission__in=queryset).distinct()
        serializer = self.get_serializer(queryset.filter(role__in=roles), many=True)

        role_data = {}
        for item in serializer.data:
            role = item.get('role', {})
            role_uuid = role.get('uuid')
            if not role_uuid:
                continue

            if role_uuid not in role_data:
                role_data[role_uuid] = {
                    'uuid': role.get('uuid'),
                    'name': role.get('name'),
                    'permissions': []
                }

            # Add permission info
            permission_info = {
                'id': item.get('id'),
                'content_type': item.get('content_type'),
                'permission': item.get('permission')
            }
            role_data[role_uuid]['permissions'].append(permission_info)

        # Add permissions count
        for role in role_data.values():
            role['permissions_count'] = len(role['permissions'])

        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': list(role_data.values())
        })

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        })

    def perform_create(self, serializer):
        if not has_model_permission(self.request.user, 'rolepermission', 'add_rolepermission', None):
            raise PermissionDenied("You do not have permission to create role permissions.")
        serializer.save()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            'success': True,
            'message': 'OK',
            'status': 201,
            'data': serializer.data
        }, status=201)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        })

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({
            'success': True,
            'message': 'OK',
            'status': 204,
            'data': []
        }, status=204)
    @action(detail=False, methods=['post'], url_path='request-otp', permission_classes=[AllowAny])
    def request_otp(self, request):
        """
        Generates and 'sends' an OTP to the user's email.
        In a real system, this would trigger an email/SMS.
        """
        email = request.data.get('email')
        if not email:
            return Response({'success': False, 'message': 'Email is required'}, status=400)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # For security, don't reveal if user exists, but we'll return error here for simplicity in this demo
            return Response({'success': False, 'message': 'User not found'}, status=404)

        import random
        from django.utils import timezone
        from datetime import timedelta
        from .models import OTPDevice

        otp_code = f"{random.randint(100000, 999999)}"
        expiry = timezone.now() + timedelta(minutes=10)

        otp_device, _ = OTPDevice.objects.get_or_create(user=user)
        otp_device.otp_code = otp_code
        otp_device.otp_expiry = expiry
        otp_device.is_verified = False
        otp_device.save()

        # SIMULATED SENDING: In production, use send_mail()
        print(f"DEBUG: OTP for {email} is {otp_code}")

        return Response({
            'success': True,
            'message': f'OTP sent to {email}. (Check console for code in this demo)',
            'status': 200
        })

    @action(detail=False, methods=['post'], url_path='verify-otp', permission_classes=[AllowAny])
    def verify_otp(self, request):
        """
        Verifies the OTP code provided by the user.
        """
        email = request.data.get('email')
        code = request.data.get('code')

        if not email or not code:
            return Response({'success': False, 'message': 'Email and code are required'}, status=400)

        from .models import OTPDevice
        try:
            user = User.objects.get(email=email)
            otp_device = user.otp_device
        except (User.DoesNotExist, OTPDevice.DoesNotExist):
            return Response({'success': False, 'message': 'Invalid request'}, status=400)

        if not otp_device.is_valid() or otp_device.otp_code != code:
            return Response({'success': False, 'message': 'Invalid or expired OTP'}, status=400)

        otp_device.is_verified = True
        otp_device.otp_code = None # Clear after use
        otp_device.save()

        return Response({
            'success': True,
            'message': 'OTP verified successfully',
            'status': 200
        })
