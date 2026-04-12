from django.contrib import admin
from .models import Teacher, TeacherMetrics, TeacherPerformanceRating, TeacherTask, TeacherPerformanceReport, TeacherAssignment
@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'subject_specialties', 'rating', 'attendance_percentage')
    search_fields = ('id', 'user__full_name', 'subject_specialties')

@admin.register(TeacherTask)
class TeacherTaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'teacher', 'task_type', 'date', 'status', 'created_at']
    list_filter = ['status', 'task_type', 'date']
    search_fields = ['title', 'teacher__user__full_name']
    date_hierarchy = 'date'


@admin.register(TeacherPerformanceRating)
class TeacherPerformanceRatingAdmin(admin.ModelAdmin):
    list_display = ['teacher', 'category', 'rating', 'rated_by', 'rating_date']
    list_filter = ['category', 'rating', 'rating_date']
    search_fields = ['teacher__user__full_name', 'comment']


@admin.register(TeacherMetrics)
class TeacherMetricsAdmin(admin.ModelAdmin):
    list_display = ['teacher', 'month', 'attendance_percentage', 'task_completion_rate', 'average_rating']
    list_filter = ['month']
    search_fields = ['teacher__user__full_name']


@admin.register(TeacherPerformanceReport)
class TeacherPerformanceReportAdmin(admin.ModelAdmin):
    list_display = ['teacher', 'report_period', 'overall_score', 'ranking', 'generated_at']
    list_filter = ['report_period', 'generated_at']
    search_fields = ['teacher__user__full_name']


@admin.register(TeacherAssignment)
class TeacherAssignmentAdmin(admin.ModelAdmin):
    list_display = ['id', 'teacher', 'class_fk', 'section', 'subject', 'assigned_on', 'is_primary']
    list_filter = ['class_fk__grade', 'subject', 'is_primary']
    search_fields = ['teacher__user__full_name', 'subject__name', 'class_fk__grade']
    readonly_fields = ['id', 'assigned_on']
