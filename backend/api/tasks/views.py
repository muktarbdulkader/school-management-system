from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django.db.models import Q
from django.utils import timezone
from datetime import datetime

from .models import (
    Task, TaskDelegation,
    TaskComment, TaskReminder, TaskHistory
)

from .serializers import (
    TaskSerializer,
    TaskDelegationSerializer,
    TaskCommentSerializer,
    TaskReminderSerializer,
    TaskHistorySerializer,
    TaskStatisticsSerializer
)

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        today = timezone.now().date()
        from django.db.models import Case, When, Value, BooleanField

        # Annotate tasks as expired if past due and not done
        return self.queryset.filter(
            Q(assigned_to=user) | Q(created_by=user)
        ).annotate(
            is_expired=Case(
                When(due_date__lt=today, status__in=['to_do', 'in_progress'], then=Value(True)),
                default=Value(False),
                output_field=BooleanField(),
            )
        ).order_by('-is_expired', 'due_date', '-priority')

    def get_object(self):
        obj = super().get_object()
        if obj.assigned_to != self.request.user and obj.created_by != self.request.user and not self.request.user.is_superuser:
            raise PermissionDenied("You do not have permission to access this task.")
        return obj

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        # Update status to 'expired' in response data for UI clarity
        today = timezone.now().date()
        for task in serializer.data:
            if task.get('due_date'):
                # due_date might be a date string or a datetime string with 'T' or space
                date_str = task['due_date']
                if 'T' in date_str:
                    date_str = date_str.split('T')[0]
                elif ' ' in date_str:
                    date_str = date_str.split(' ')[0]

                try:
                    due_date = datetime.strptime(date_str, '%Y-%m-%d').date()
                    if due_date < today and task.get('status') in ['to_do', 'in_progress']:
                        task['status'] = 'expired'
                except ValueError:
                    pass

        return Response({'success': True, 'message': 'OK', 'status': 200, 'data': serializer.data})

    def create(self, request, *args, **kwargs):
        user = request.user
        
        # Role Check: Only Admins, Staff, and Teachers can create tasks
        from teachers.models import Teacher
        is_teacher = Teacher.objects.filter(user=user).exists()
        is_admin_staff = user.is_staff or user.is_superuser
        
        if not (is_admin_staff or is_teacher):
            return Response({
                'success': False, 
                'message': 'Only Admins and Teachers can create tasks.', 
                'status': 403
            }, status=403)

        data = request.data.copy()

        # Default assigned_to to the creator if not specified
        if not data.get('assigned_to'):
            data['assigned_to'] = str(user.id)

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)

        # Auto-assign branch from user's access
        from users.models import UserBranchAccess, Branch
        branch_access = UserBranchAccess.objects.filter(user=user).first()
        branch = branch_access.branch if branch_access else Branch.objects.filter(is_main=True).first() or Branch.objects.first()

        if not branch:
            return Response({'success': False, 'message': 'No branch found in system. Please create a branch first.', 'status': 400}, status=400)

        serializer.save(created_by=user, branch=branch)
        return Response({'success': True, 'message': 'Task created', 'status': 201, 'data': serializer.data}, status=201)

    @action(detail=False, methods=['get'], url_path='my_tasks')
    def my_tasks(self, request):
        tasks = self.queryset.filter(assigned_to=request.user).order_by('-due_date')
        serializer = self.get_serializer(tasks, many=True)
        return Response({'success': True, 'message': 'OK', 'status': 200, 'data': serializer.data})

    @action(detail=False, methods=['get'], url_path='created_by_me')
    def created_by_me(self, request):
        tasks = self.queryset.filter(created_by=request.user).order_by('-created_at')
        serializer = self.get_serializer(tasks, many=True)
        return Response({'success': True, 'message': 'OK', 'status': 200, 'data': serializer.data})

    @action(detail=False, methods=['get'], url_path='overdue')
    def overdue(self, request):
        today = timezone.now().date()
        tasks = self.queryset.filter(
            Q(assigned_to=request.user) | Q(created_by=request.user),
            due_date__lt=today,
            status__in=['to_do', 'in_progress']
        ).order_by('due_date')
        serializer = self.get_serializer(tasks, many=True)
        return Response({'success': True, 'message': 'OK', 'status': 200, 'data': serializer.data})

    @action(detail=False, methods=['get'], url_path='statistics')
    def statistics(self, request):
        user = request.user
        total_tasks = self.queryset.filter(Q(assigned_to=user) | Q(created_by=user)).count()
        completed_tasks = self.queryset.filter(Q(assigned_to=user) | Q(created_by=user), status='done').count()
        pending_tasks = self.queryset.filter(Q(assigned_to=user) | Q(created_by=user), status__in=['to_do', 'in_progress']).count()
        overdue_tasks = self.queryset.filter(
            Q(assigned_to=user) | Q(created_by=user),
            due_date__lt=timezone.now().date(),
            status__in=['to_do', 'in_progress']
        ).count()

        data = {
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'pending_tasks': pending_tasks,
            'overdue_tasks': overdue_tasks,
        }
        serializer = TaskStatisticsSerializer(data)
        return Response({'success': True, 'message': 'OK', 'status': 200, 'data': serializer.data})
class TaskCommentViewSet(viewsets.ModelViewSet):
    queryset = TaskComment.objects.all()
    serializer_class = TaskCommentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return self.queryset.filter(
            Q(user=user) | Q(task__assigned_to=user) | Q(task__created_by=user)
        ).order_by('-created_at')
class TaskDelegationViewSet(viewsets.ModelViewSet):
    queryset = TaskDelegation.objects.all()
    serializer_class = TaskDelegationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return self.queryset.filter(
            Q(delegated_from=user) | Q(delegated_to=user)
        ).order_by('-delegation_date')
class TaskReminderViewSet(viewsets.ModelViewSet):
    queryset = TaskReminder.objects.all()
    serializer_class = TaskReminderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return self.queryset.filter(
            Q(task__assigned_to=user) | Q(task__created_by=user)
        ).order_by('-created_at')
class TaskHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = TaskHistory.objects.all()
    serializer_class = TaskHistorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return self.queryset.filter(
            Q(task__assigned_to=user) | Q(task__created_by=user)
        ).order_by('-timestamp')

from .models import FiscalYear, KPIPlan, EmployeeTask, EmployeeSubTask
from .serializers import (
    FiscalYearSerializer, KPIPlanSerializer, 
    EmployeeTaskSerializer, EmployeeSubTaskSerializer
)

class FiscalYearViewSet(viewsets.ModelViewSet):
    queryset = FiscalYear.objects.all()
    serializer_class = FiscalYearSerializer
    permission_classes = [IsAuthenticated]

class KPIPlanViewSet(viewsets.ModelViewSet):
    queryset = KPIPlan.objects.all()
    serializer_class = KPIPlanSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(assigned_to=self.request.user, is_active=True)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({'success': True, 'message': 'OK', 'status': 200, 'data': serializer.data})

class EmployeeTaskViewSet(viewsets.ModelViewSet):
    queryset = EmployeeTask.objects.all()
    serializer_class = EmployeeTaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        fiscal_year_id = self.request.query_params.get('fiscal_year_id')
        kpi_tracker_id = self.request.query_params.get('kpi_tracker_id')

        qs = self.queryset.filter(kpi_plan__assigned_to=user)
        if fiscal_year_id:
            qs = qs.filter(kpi_plan__fiscal_year_id=fiscal_year_id)
        if kpi_tracker_id:
            qs = qs.filter(kpi_plan_id=kpi_tracker_id)
        return qs

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True, 
            'message': 'OK', 
            'status': 200, 
            'data': {
                'data': serializer.data,
                'total': queryset.count()
            }
        })

    def create(self, request, *args, **kwargs):
        # Frontend fields mapping
        data = request.data.copy()
        if 'kpi_tracker_id' in data:
            data['kpi_plan'] = data.pop('kpi_tracker_id')
        if 'task' in data:
            data['title'] = data.pop('task')

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({
            'success': True, 
            'data': {
                'message': 'Task created',
                'data': serializer.data
            }
        }, status=201)

    def update(self, request, *args, **kwargs):
        # Frontend fields mapping
        data = request.data.copy()
        if 'kpi_tracker_id' in data:
            data['kpi_plan'] = data.pop('kpi_tracker_id')
        if 'task' in data:
            data['title'] = data.pop('task')

        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            'success': True,
            'data': {
                'message': 'Task updated',
                'data': serializer.data
            }
        }, status=200)

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    @action(detail=True, methods=['post'], url_path='change_status')
    def change_status(self, request, pk=None):
        task = self.get_object()
        status = request.data.get('status')
        attachment = request.FILES.get('attachment')

        if status:
            task.status = status
        if attachment:
            task.attachment = attachment
        task.save()
        return Response({
            'success': True,
            'data': {
                'message': 'Status updated',
                'data': self.get_serializer(task).data
            }
        })

    @action(detail=False, methods=['post'], url_path='clone_weekly')
    def clone_weekly(self, request):
        return Response({
            'success': True,
            'data': {
                'message': 'Tasks cloned successfully',
                'data': []
            }
        })

    @action(detail=True, methods=['post'], url_path='')
    def update_status(self, request, pk=None):
        return self.change_status(request, pk)

    @action(detail=True, methods=['post'], url_path='grammar-check')
    def grammar_check(self, request, pk=None):
        """AI grammar check for task description"""
        from ai_integration.services import get_ai_service
        from ai_integration.models import AIRequest
        from django.utils import timezone
        instance = self.get_object()
        text = f"{instance.title}\n\n{instance.description or ''}"
        ai_request = AIRequest.objects.create(
            user=request.user, request_type='grammar', input_text=text[:1000], status='processing', error_message=''
        )
        try:
            service = get_ai_service()
            result = service.check_grammar(text)
            ai_request.status = 'completed'
            ai_request.output_text = result.corrected_text
            ai_request.provider = service.__class__.__name__
            ai_request.completed_at = timezone.now()
            ai_request.save()
            return Response({'success': True, 'data': {
                'original_text': result.original_text,
                'corrected_text': result.corrected_text,
                'suggestions': result.suggestions,
                'errors_found': result.errors_found
            }})
        except Exception as e:
            ai_request.status = 'failed'
            ai_request.error_message = str(e)
            ai_request.save()
            return Response({'success': False, 'message': str(e), 'status': 500}, status=500)

    @action(detail=False, methods=['post'], url_path='ai-analyze')
    def ai_analyze_tasks(self, request):
        """AI analyze task patterns and productivity"""
        from ai_integration.utils import batch_ai_analyze
        from ai_integration.models import AIRequest
        from django.utils import timezone
        queryset = self.get_queryset()[:30]
        ai_request = AIRequest.objects.create(
            user=request.user, request_type='summarize', input_text='Task analysis', status='processing', error_message=''
        )
        try:
            result = batch_ai_analyze(queryset, 'trends', 'description')
            ai_request.status = 'completed'
            ai_request.output_text = result.summary if result else ''
            ai_request.provider = 'TaskAIAnalyzer'
            ai_request.completed_at = timezone.now()
            ai_request.save()
            return Response({'success': True, 'data': {
                'summary': result.summary if result else 'No analysis',
                'key_insights': result.key_insights if result else [],
                'total_tasks': queryset.count(),
                'completed': queryset.filter(status='done').count(),
                'pending': queryset.filter(status='to_do').count()
            }})
        except Exception as e:
            ai_request.status = 'failed'
            ai_request.error_message = str(e)
            ai_request.save()
            return Response({'success': False, 'message': str(e), 'status': 500}, status=500)

class EmployeeSubTaskViewSet(viewsets.ModelViewSet):
    queryset = EmployeeSubTask.objects.all()
    serializer_class = EmployeeSubTaskSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        task_id = request.query_params.get('task_id') or request.data.get('task_id')
        data = request.data.copy()
        if task_id:
            data['task'] = task_id
        if 'task' in data and not 'title' in data:
            data['title'] = data.pop('task')

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({
            'success': True,
            'data': {
                'message': 'Subtask created',
                'data': serializer.data
            }
        }, status=201)

    @action(detail=True, methods=['post'], url_path='change_status')
    def change_status(self, request, pk=None):
        subtask = self.get_object()
        status = request.data.get('status')
        if status:
            subtask.status = status
            subtask.save()
        return Response({
            'success': True,
            'data': {
                'message': 'Status updated',
                'data': self.get_serializer(subtask).data
            }
        })

    @action(detail=True, methods=['post'], url_path='')
    def update_status(self, request, pk=None):
        return self.change_status(request, pk)

