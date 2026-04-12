from django.contrib import admin
from django import forms
from .models import Class, ClassSubject, CourseType, Section, Subject, ClassElectiveOffering, ClassExtraOffering, Term
from users.models import UserBranchAccess
class SubjectsAdminForm(forms.ModelForm):
    class Meta:
        model = Subject
        fields = '__all__'
        widgets = {
            'course_type': forms.Select(),
            'assignment_day': forms.Select(),
        }
class SectionsInline(admin.TabularInline):
    model = Section
    extra = 1
    show_change_link = True
@admin.register(CourseType)
class CourseTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)
    list_filter = ('name',)
class TermsAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'academic_year', 'start_date', 'end_date', 'is_current')
    list_filter = ('academic_year', 'is_current')
    search_fields = ('name', 'academic_year')
    readonly_fields = ('id',)
    date_hierarchy = 'start_date'

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset

    def save_model(self, request, obj, form, change):
        # Only one term is marked as is_current
        if obj.is_current:
            Term.objects.filter(is_current=True).exclude(id=obj.id).update(is_current=False)
        super().save_model(request, obj, form, change)
class ClassesAdmin(admin.ModelAdmin):
    list_display = ('id', 'grade')
    list_filter = ('grade', )
    search_fields = ('grade', )
    readonly_fields = ('id', )
    inlines = [SectionsInline]

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        if not request.user.is_superuser:
            accessible_branches = UserBranchAccess.objects.filter(user=request.user).values_list('branch_id', flat=True)
            queryset = queryset.filter(branch_id__in=accessible_branches)
        return queryset
class SectionsAdmin(admin.ModelAdmin):
    list_display = ('id', 'class_fk', 'name', 'room_number', 'capacity')
    list_filter = ('class_fk__grade', 'class_fk')
    search_fields = ('name', 'room_number', 'class_fk__grade')
    readonly_fields = ('id',)

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        if not request.user.is_superuser:
            accessible_branches = UserBranchAccess.objects.filter(user=request.user).values_list('branch_id', flat=True)
            queryset = queryset.filter(class_fk__branch_id__in=accessible_branches)
        return queryset
class SubjectsAdmin(admin.ModelAdmin):
    form = SubjectsAdminForm
    list_display = ('id', 'name', 'code', 'course_type', 'assignment_day')
    list_filter = ('course_type',)
    search_fields = ('name', 'code')
    readonly_fields = ('id',)

class ClassElectiveOfferingsAdmin(admin.ModelAdmin):
    list_display = ('id', 'class_fk', 'offered_in_term', 'max_capacity')
    list_filter = ('offered_in_term__name', 'class_fk')
    readonly_fields = ('id', 'created_at')

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        if not request.user.is_superuser:
            accessible_branches = UserBranchAccess.objects.filter(user=request.user).values_list('branch_id', flat=True)
            queryset = queryset.filter(class_fk__branch_id__in=accessible_branches)
        return queryset
# StudentElectiveChoicesAdmin 
class ClassExtraOfferingsAdmin(admin.ModelAdmin):
    list_display = ('id', 'class_fk', 'term', 'max_capacity')
    list_filter = ('term__name', 'class_fk')
    search_fields = ('subject__name', 'class_fk__grade', 'term__name')
    readonly_fields = ('id', 'created_at')

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        if not request.user.is_superuser:
            accessible_branches = UserBranchAccess.objects.filter(user=request.user).values_list('branch_id', flat=True)
            queryset = queryset.filter(class_fk__branch_id__in=accessible_branches)
        return queryset

class ClassSubjectAdmin(admin.ModelAdmin):
    list_display = ('id', 'class_fk', 'subject', 'created_at')
    list_filter = ('class_fk__grade', 'subject__course_type')
    search_fields = ('class_fk__grade', 'subject__name')
    readonly_fields = ('id', 'created_at')
    date_hierarchy = 'created_at'

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        if not request.user.is_superuser:
            accessible_branches = UserBranchAccess.objects.filter(user=request.user).values_list('branch_id', flat=True)
            queryset = queryset.filter(class_fk__branch_id__in=accessible_branches)
        return queryset

admin.site.register(Term, TermsAdmin)
admin.site.register(Class, ClassesAdmin)
admin.site.register(Section, SectionsAdmin)
admin.site.register(Subject, SubjectsAdmin)
admin.site.register(ClassSubject, ClassSubjectAdmin)
admin.site.register(ClassElectiveOffering, ClassElectiveOfferingsAdmin)
admin.site.register(ClassExtraOffering, ClassExtraOfferingsAdmin)







