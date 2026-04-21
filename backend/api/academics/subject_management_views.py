"""
Subject Management ViewSets for Super Admin Panel
Handles Global Subject and ClassSubject management with customization.
"""
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import IntegrityError
from .models import GlobalSubject, ClassSubject, Class
from .serializers import GlobalSubjectSerializer, ClassSubjectDetailSerializer


class GlobalSubjectViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Global Subjects.
    Only Super Admins can create/update/delete. All authenticated users can view.
    """
    queryset = GlobalSubject.objects.filter(is_active=True)
    serializer_class = GlobalSubjectSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = GlobalSubject.objects.all()
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        return queryset.order_by('name')

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        })

    def create(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            return Response({
                'success': True,
                'message': 'Global subject created successfully',
                'status': 201,
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        except IntegrityError:
            return Response({
                'success': False,
                'message': 'A subject with this name already exists',
                'status': 400,
                'errors': {'name': ['Subject name must be unique']}
            }, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=kwargs.get('partial', False))
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response({
                'success': True,
                'message': 'Global subject updated successfully',
                'status': 200,
                'data': serializer.data
            })
        except IntegrityError:
            return Response({
                'success': False,
                'message': 'A subject with this name already exists',
                'status': 400,
                'errors': {'name': ['Subject name must be unique']}
            }, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response({
            'success': True,
            'message': 'Global subject deactivated successfully',
            'status': 200,
            'data': {'id': str(instance.id)}
        })

    @action(detail=False, methods=['get'], url_path='dropdown')
    def dropdown(self, request):
        queryset = self.get_queryset().filter(is_active=True)
        data = [{'id': str(s.id), 'name': s.name} for s in queryset]
        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': data
        })


class ClassSubjectManagementViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing ClassSubject assignments with customization.
    Maps GlobalSubjects to Classes with class-specific codes and content.
    """
    queryset = ClassSubject.objects.filter(is_active=True)
    serializer_class = ClassSubjectDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = ClassSubject.objects.all()
        class_id = self.request.query_params.get('class_id')
        if class_id:
            queryset = queryset.filter(class_fk_id=class_id)
        global_subject_id = self.request.query_params.get('global_subject_id')
        if global_subject_id:
            queryset = queryset.filter(global_subject_id=global_subject_id)
        branch_id = self.request.query_params.get('branch_id')
        if branch_id:
            queryset = queryset.filter(class_fk__branch_id=branch_id)
        return queryset.select_related('class_fk', 'global_subject', 'class_fk__branch')

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        })

    def create(self, request, *args, **kwargs):
        try:
            class_id = request.data.get('class_fk')
            global_subject_id = request.data.get('global_subject')
            if ClassSubject.objects.filter(
                class_fk_id=class_id,
                global_subject_id=global_subject_id,
                is_active=True
            ).exists():
                return Response({
                    'success': False,
                    'message': 'This subject is already assigned to this class',
                    'status': 400,
                    'errors': {'global_subject': ['Subject already exists in this class']}
                }, status=status.HTTP_400_BAD_REQUEST)

            # Get or create legacy Subject for teacher assignment compatibility
            from .models import GlobalSubject, Subject, Class
            try:
                global_subject = GlobalSubject.objects.get(id=global_subject_id)
                class_obj = Class.objects.get(id=class_id)
                # Create or get existing Subject linked to this GlobalSubject
                subject, created = Subject.objects.get_or_create(
                    global_subject=global_subject,
                    defaults={
                        'name': global_subject.name,
                        'code': request.data.get('subject_code', '') or global_subject.name[:3].upper(),
                        'class_grade': class_obj,
                        'branch': class_obj.branch,
                    }
                )
                # Add subject to request data for serializer
                request.data['subject'] = str(subject.id)
            except Exception as e:
                print(f"Warning: Could not create legacy subject: {e}")
                pass

            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            return Response({
                'success': True,
                'message': 'Subject assigned to class successfully',
                'status': 201,
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        except IntegrityError:
            return Response({
                'success': False,
                'message': 'This subject is already assigned to this class',
                'status': 400,
                'errors': {'global_subject': ['Subject already exists in this class']}
            }, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response({
            'success': True,
            'message': 'Subject removed from class successfully',
            'status': 200,
            'data': {'id': str(instance.id)}
        })

    @action(detail=False, methods=['get'], url_path='by-class')
    def by_class(self, request):
        class_id = request.query_params.get('class_id')
        if not class_id:
            return Response({
                'success': False,
                'message': 'class_id query parameter is required',
                'status': 400
            }, status=status.HTTP_400_BAD_REQUEST)
        queryset = self.get_queryset().filter(class_fk_id=class_id, is_active=True)
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'message': 'OK',
            'status': 200,
            'data': serializer.data
        })
