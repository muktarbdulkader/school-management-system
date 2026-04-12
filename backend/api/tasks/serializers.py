from rest_framework import serializers
from users.serializers import UserSerializer
from .models import Task, TaskDelegation, TaskComment, TaskReminder,TaskHistory
class TaskSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.full_name', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    class Meta:
        model = Task
        fields = '__all__'
        read_only_fields = ['id', 'branch', 'created_by', 'created_at', 'updated_at', 'completed_at', 'reminder_sent']
class TaskDelegationSerializer(serializers.ModelSerializer):
    delegated_from_name = serializers.CharField(source='delegated_from.full_name', read_only=True)
    delegated_to_name = serializers.CharField(source='delegated_to.full_name', read_only=True)
    task_title = serializers.CharField(source='task.title', read_only=True)
    class Meta:
        model = TaskDelegation
        fields = '__all__'
        read_only_fields = ['id', 'delegation_date']
class TaskCommentSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    task_title = serializers.CharField(source='task.title', read_only=True)
    class Meta:
        model = TaskComment
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
class TaskReminderSerializer(serializers.ModelSerializer):
    task_title = serializers.CharField(source='task.title', read_only=True)
    class Meta:
        model = TaskReminder
        fields = '__all__'
        read_only_fields = ['id', 'sent', 'sent_at', 'created_at']
class TaskStatisticsSerializer(serializers.Serializer):
    total_tasks = serializers.IntegerField()
    completed_tasks = serializers.IntegerField()
    pending_tasks = serializers.IntegerField()
    overdue_tasks = serializers.IntegerField()
class TaskHistorySerializer(serializers.ModelSerializer):
    task_title = serializers.CharField(source='task.title', read_only=True)
    class Meta:
        model = TaskHistory
        fields = '__all__'
        read_only_fields = ['id', 'timestamp']

from .models import FiscalYear, KPIPlan, EmployeeTask, EmployeeSubTask

class FiscalYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = FiscalYear
        fields = '__all__'

class KPIPlanSerializer(serializers.ModelSerializer):
    plan_id = serializers.UUIDField(source='id', read_only=True)
    class Meta:
        model = KPIPlan
        fields = '__all__'

class EmployeeSubTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeSubTask
        fields = '__all__'

class EmployeeTaskSerializer(serializers.ModelSerializer):
    subtasks = EmployeeSubTaskSerializer(many=True, read_only=True)
    class Meta:
        model = EmployeeTask
        fields = '__all__'
