from django.contrib import admin
from .models import Task, TaskTag, TaskHistory, TaskReminder, TaskDelegation, TaskComment


@admin.register(TaskTag)
class TaskTagAdmin(admin.ModelAdmin):
    list_display = ['name']
    search_fields = ['name']


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = [
        'title',
        'assigned_to',
        'created_by',
        'status',
        'priority',
        'due_date',
        'is_overdue',
        'branch',
    ]
    list_filter = ['status', 'priority', 'category', 'branch', 'created_at']
    search_fields = ['title', 'description', 'assigned_to__full_name', 'created_by__full_name']
    readonly_fields = ['created_at', 'updated_at', 'completed_at']
    filter_horizontal = ['tags', 'depends_on']

    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'branch')
        }),
        ('Assignment', {
            'fields': ('created_by', 'assigned_to')
        }),
        ('Status & Priority', {
            'fields': ('status', 'priority', 'category', 'visibility')
        }),
        ('Scheduling', {
            'fields': ('due_date', 'due_time', 'is_recurring', 'recurrence_type')
        }),
        ('Workload', {
            'fields': ('estimated_hours', 'actual_hours')
        }),
        ('Approval', {
            'fields': ('requires_approval', 'approved_by', 'approved_at')
        }),
        ('Additional', {
            'fields': ('tags', 'depends_on', 'attachments')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'completed_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(TaskHistory)
class TaskHistoryAdmin(admin.ModelAdmin):
    list_display = ['task', 'changed_by', 'change_type', 'timestamp']
    list_filter = ['change_type', 'timestamp']
    search_fields = ['task__title', 'changed_by__full_name']
    readonly_fields = ['timestamp']


@admin.register(TaskReminder)
class TaskReminderAdmin(admin.ModelAdmin):
    list_display = ['task', 'reminder_date', 'reminder_time', 'notification_type', 'sent']
    list_filter = ['notification_type', 'sent', 'reminder_date']
    search_fields = ['task__title']
    readonly_fields = ['sent_at', 'created_at']


@admin.register(TaskDelegation)
class TaskDelegationAdmin(admin.ModelAdmin):
    list_display = ['task', 'delegated_from', 'delegated_to', 'delegation_date']
    list_filter = ['delegation_date']
    search_fields = ['task__title', 'delegated_from__full_name', 'delegated_to__full_name']
    readonly_fields = ['delegation_date']


@admin.register(TaskComment)
class TaskCommentAdmin(admin.ModelAdmin):
    list_display = ['task', 'user', 'created_at']
    list_filter = ['created_at']
    search_fields = ['task__title', 'user__full_name', 'comment']
    readonly_fields = ['created_at', 'updated_at']
