from django.contrib import admin
from django import forms
from django.core.exceptions import ValidationError
from academics.models import Class, Section
from users.models import UserBranchAccess
from .models import (BehaviorIncidents, BehaviorRatings, HealthConditions, Parent, 
                     ParentRelationship, Student, ParentStudent, StudentHealthRecords,
                     StudentSubject, StudentElectiveChoice, StudentExtraChoice)

class StudentForm(forms.ModelForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        grade = None
        if self.data and 'grade' in self.data:  # Check for submitted grade on POST
            try:
                grade = Class.objects.get(id=self.data['grade'])
            except (KeyError, Class.DoesNotExist, ValueError):
                grade = None
        # elif self.instance.pk:  # Existing instance (edit mode)
        #     grade = self.instance.grade
        if grade:
            self.fields['section'].queryset = Section.objects.filter(class_fk=grade)
        # else:
            # self.fields['section'].queryset = Section.objects.none()  # No grade, no sections

    def clean(self):
        cleaned_data = super().clean()
        section = cleaned_data.get('section')
        if section:
            # Exclude the current instance if updating
            student_count = Student.objects.filter(section=section).exclude(id=self.instance.id if self.instance else None).count()
            if student_count >= section.capacity:
                raise ValidationError(
                    f"Section {section.name} has reached its maximum capacity of {section.capacity} students."
                )
        return cleaned_data

    class Meta:
        model = Student
        fields = '__all__'

@admin.register(Parent)
class ParentAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'citizenship', 'jobtitle', 'mobile_telephone')
    search_fields = ('id', 'user', 'citizenship')

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'branch', 'citizenship', 'gender')
    search_fields = ('id', 'user', 'branch')

@admin.register(ParentRelationship)
class ParentRelationshipAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name', )

@admin.register(ParentStudent)
class ParentStudentAdmin(admin.ModelAdmin):
    list_display = ('id', 'parent', 'student', 'relationship')
    search_fields = ('id', 'parent', 'relationship')

@admin.register(HealthConditions)
class HealthConditionsAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'description')
    search_fields = ('name', 'description')
    readonly_fields = ('id',)

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        if not request.user.is_superuser:
            accessible_branches = UserBranchAccess.objects.filter(user=request.user).values_list('branch_id', flat=True)
            queryset = queryset.filter(id__in=StudentHealthRecords.objects.filter(student__branch_id__in=accessible_branches).values_list('condition_id', flat=True))
        return queryset

@admin.register(StudentHealthRecords)
class StudentHealthRecordsAdmin(admin.ModelAdmin):
    list_display = ('id', 'student', 'date', 'recorded_by')
    list_filter = ('date', 'student__branch_id')
    search_fields = ('student__user__full_name', 'history', 'incident')
    readonly_fields = ('id',)
    date_hierarchy = 'date'

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        if not request.user.is_superuser:
            accessible_branches = UserBranchAccess.objects.filter(user=request.user).values_list('branch_id', flat=True)
            queryset = queryset.filter(student__branch_id__in=accessible_branches)
        return queryset

@admin.register(BehaviorIncidents)
class BehaviorIncidentsAdmin(admin.ModelAdmin):
    list_display = ('id', 'student', 'incident_date', 'reported_by')
    list_filter = ('incident_date', 'student__branch_id')
    search_fields = ('student__user__full_name', 'description')
    readonly_fields = ('id',)
    date_hierarchy = 'incident_date'

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        if not request.user.is_superuser:
            accessible_branches = UserBranchAccess.objects.filter(user=request.user).values_list('branch_id', flat=True)
            queryset = queryset.filter(student__branch_id__in=accessible_branches)
        return queryset

@admin.register(BehaviorRatings)
class BehaviorRatingsAdmin(admin.ModelAdmin):
    list_display = ('id', 'student', 'category', 'rating', 'rated_on', 'rated_by')
    list_filter = ('category', 'rated_on', 'student__branch_id')
    search_fields = ('student__user__full_name', 'category', 'notes')
    readonly_fields = ('id',)
    date_hierarchy = 'rated_on'

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        if not request.user.is_superuser:
            accessible_branches = UserBranchAccess.objects.filter(user=request.user).values_list('branch_id', flat=True)
            queryset = queryset.filter(student__branch_id__in=accessible_branches)
        return queryset


# New admin registrations for models moved from academics app

@admin.register(StudentSubject)
class StudentSubjectAdmin(admin.ModelAdmin):
    list_display = ('id', 'student', 'subject', 'enrolled_on')
    list_filter = ('subject__course_type', 'student__branch_id')
    search_fields = ('student__user__full_name', 'subject__name')
    readonly_fields = ('id',)
    date_hierarchy = 'enrolled_on'

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        if not request.user.is_superuser:
            accessible_branches = UserBranchAccess.objects.filter(user=request.user).values_list('branch_id', flat=True)
            queryset = queryset.filter(student__branch_id__in=accessible_branches)
        return queryset


@admin.register(StudentElectiveChoice)
class StudentElectiveChoiceAdmin(admin.ModelAdmin):
    list_display = ('id', 'student', 'elective_offering', 'term', 'chosen_on')
    list_filter = ('term__name', 'student__branch_id')
    search_fields = ('student__user__full_name', 'elective_offering__subject__name', 'term__name')
    readonly_fields = ('id', 'chosen_on')
    date_hierarchy = 'chosen_on'

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        if not request.user.is_superuser:
            accessible_branches = UserBranchAccess.objects.filter(user=request.user).values_list('branch_id', flat=True)
            queryset = queryset.filter(student__branch_id__in=accessible_branches)
        return queryset


@admin.register(StudentExtraChoice)
class StudentExtraChoiceAdmin(admin.ModelAdmin):
    list_display = ('id', 'student', 'extra_offering', 'term', 'choice_order', 'chosen_on')
    list_filter = ('term__name', 'student__branch_id')
    search_fields = ('student__user__full_name', 'extra_offering__subject__name', 'term__name')
    readonly_fields = ('id', 'chosen_on')
    date_hierarchy = 'chosen_on'

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        if not request.user.is_superuser:
            accessible_branches = UserBranchAccess.objects.filter(user=request.user).values_list('branch_id', flat=True)
            queryset = queryset.filter(student__branch_id__in=accessible_branches)
        return queryset