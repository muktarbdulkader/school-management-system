from django import forms
from django.contrib import admin
from .models import (
    ClassScheduleSlot, SlotType, StudentScheduleOverride, Attendance, 
    Exam, SubjectExamDay, AcademicCalendar, TeacherSubstitution, TimetableConstraint
)
from users.models import UserBranchAccess
from academics.models import DAY_OF_WEEK_CHOICES

class AttendanceAdminForm(forms.ModelForm):
    class Meta:
        model = Attendance
        fields = '__all__'
        widgets = {
            'status': forms.RadioSelect
        }

@admin.register(SlotType)
class SlotTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)
    list_filter = ('name',)

class ClassScheduleSlotsAdminForm(forms.ModelForm):
    class Meta:
        model = ClassScheduleSlot
        fields = '__all__'
        widgets = {
            'slot_type': forms.Select(),
            'day_of_week': forms.Select(),
        }

class StudentScheduleOverridesAdminForm(forms.ModelForm):
    class Meta:
        model = StudentScheduleOverride
        fields = '__all__'
        widgets = {
            'slot_type': forms.Select(),
        }

class ClassScheduleSlotsAdmin(admin.ModelAdmin):
    form = ClassScheduleSlotsAdminForm
    list_display = ('id', 'class_fk', 'section', 'slot_type', 'day_of_week', 'start_time', 'end_time', 'subject')
    list_filter = ('slot_type', 'day_of_week')
    search_fields = ('class_fk__grade', 'section__name', 'subject__name')
    readonly_fields = ('id',)

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        if not request.user.is_superuser:
            accessible_branches = UserBranchAccess.objects.filter(user=request.user).values_list('branch_id', flat=True)
            queryset = queryset.filter(class_fk__branch_id__in=accessible_branches)
        return queryset

class StudentScheduleOverridesAdmin(admin.ModelAdmin):
    form = StudentScheduleOverridesAdminForm
    list_display = ('id', 'student_id', 'slot_type', 'subject_id', 'term_id')
    list_filter = ('slot_type', 'term_id__name', 'student_id__branch_id')
    search_fields = ('student_id__user_id__full_name', 'subject_id__name', 'term_id__name')
    readonly_fields = ('id',)

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        if not request.user.is_superuser:
            accessible_branches = UserBranchAccess.objects.filter(user=request.user).values_list('branch_id', flat=True)
            queryset = queryset.filter(student_id__branch_id__in=accessible_branches)
        return queryset

class AttendanceAdmin(admin.ModelAdmin):
    form = AttendanceAdminForm
    list_display = ('id', 'student', 'teacher_assignment', 'date', 'status')
    list_filter = ('status', 'date', 'student__branch')
    search_fields = ('student__user__full_name', 'teacher_assignment__subject__name')
    readonly_fields = ('id',)
    date_hierarchy = 'date'

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        if not request.user.is_superuser:
            accessible_branches = UserBranchAccess.objects.filter(user=request.user).values_list('branch_id', flat=True)
            queryset = queryset.filter(student__branch__in=accessible_branches)
        return queryset

class ExamsAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'term', 'exam_type', 'subject', 'class_fk', 'branch', 'start_date', 'end_date')
    list_filter = ('exam_type', 'term__name', 'branch')
    search_fields = ('name', 'subject__name', 'class_fk__grade', 'term__name')
    readonly_fields = ('id', 'created_at')
    date_hierarchy = 'start_date'

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        if not request.user.is_superuser:
            accessible_branches = UserBranchAccess.objects.filter(user=request.user).values_list('branch_id', flat=True)
            queryset = queryset.filter(branch_id__in=accessible_branches)
        return queryset

class SubjectExamDaysAdmin(admin.ModelAdmin):
    list_display = ('id', 'subject', 'day_of_week')
    list_filter = ('day_of_week',)
    search_fields = ('subject__name',)
    readonly_fields = ('id',)

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        if not request.user.is_superuser:
            accessible_branches = UserBranchAccess.objects.filter(user=request.user).values_list('branch_id', flat=True)
            queryset = queryset.filter(subject__teacherassignment__class_fk__branch_id__in=accessible_branches).distinct()
        return queryset

class AcademicCalendarAdmin(admin.ModelAdmin):
    list_display = ('id', 'branch', 'date', 'event_type', 'title', 'is_working_day', 'affects_schedule')
    list_filter = ('event_type', 'is_working_day', 'branch')
    search_fields = ('title', 'description')
    date_hierarchy = 'date'

class TeacherSubstitutionAdmin(admin.ModelAdmin):
    list_display = ('id', 'original_teacher', 'substitute_teacher', 'schedule_slot', 'date', 'status')
    list_filter = ('status', 'date')
    search_fields = ('original_teacher__user__full_name', 'substitute_teacher__user__full_name', 'reason')
    date_hierarchy = 'date'

class TimetableConstraintAdmin(admin.ModelAdmin):
    list_display = ('id', 'branch', 'max_periods_per_day', 'teacher_max_periods_per_day', 'enforce_teacher_conflicts', 'enforce_section_conflicts')
    list_filter = ('enforce_teacher_conflicts', 'enforce_section_conflicts', 'enforce_room_conflicts')

admin.site.register(ClassScheduleSlot, ClassScheduleSlotsAdmin)
admin.site.register(StudentScheduleOverride, StudentScheduleOverridesAdmin)
admin.site.register(Attendance, AttendanceAdmin)
admin.site.register(Exam, ExamsAdmin)
admin.site.register(SubjectExamDay, SubjectExamDaysAdmin)
admin.site.register(AcademicCalendar, AcademicCalendarAdmin)
admin.site.register(TeacherSubstitution, TeacherSubstitutionAdmin)
admin.site.register(TimetableConstraint, TimetableConstraintAdmin)