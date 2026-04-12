from django.contrib import admin
from django import forms
from django.contrib.admin.widgets import FilteredSelectMultiple
from academics.models import Section
from teachers.models import TeacherAssignment
from students.models import Student
from users.models import User, UserBranchAccess, UserRole
from .models import ObjectiveCategories, ObjectiveUnits, ObjectiveSubunits, LearningObjectives, LessonPlans, LessonActivities, LessonPlanEvaluations, LessonPlanObjectives, Assignments, StudentAssignments, ExamResults

class ObjectiveCategoriesAdminForm(forms.ModelForm):
    class Meta:
        model = ObjectiveCategories
        fields = '__all__'

class LessonPlansAdminForm(forms.ModelForm):
    class Meta:
        model = LessonPlans
        fields = '__all__'
        widgets = {
            'term': forms.Select(),
        }

# Inlines (if applicable, e.g., for LessonActivities)
class LessonActivitiesInline(admin.TabularInline):
    model = LessonActivities
    extra = 1
    show_change_link = True

class LessonPlanEvaluationsInline(admin.TabularInline):
    model = LessonPlanEvaluations
    extra = 1
    show_change_link = True

# Admin Classes
@admin.register(ObjectiveCategories)
class ObjectiveCategoriesAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'subject')
    search_fields = ('name', 'subject__name')
    list_filter = ('subject',)
    readonly_fields = ('id',)

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        if not request.user.is_superuser:
            accessible_branches = UserBranchAccess.objects.filter(user=request.user).values_list('branch_id', flat=True)
            queryset = queryset.filter(subject__branch_id__in=accessible_branches)
        return queryset

@admin.register(ObjectiveUnits)
class ObjectiveUnitsAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'category')
    list_filter = ('category',)
    search_fields = ('name', 'category__name')
    readonly_fields = ('id',)

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        if not request.user.is_superuser:
            accessible_branches = UserBranchAccess.objects.filter(user=request.user).values_list('branch_id', flat=True)
            queryset = queryset.filter(category__subject__branch_id__in=accessible_branches)
        return queryset

@admin.register(ObjectiveSubunits)
class ObjectiveSubunitsAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'unit')
    list_filter = ('unit',)
    search_fields = ('name', 'unit__name')
    readonly_fields = ('id',)

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        if not request.user.is_superuser:
            accessible_branches = UserBranchAccess.objects.filter(user=request.user).values_list('branch_id', flat=True)
            queryset = queryset.filter(unit__category__subject__branch_id__in=accessible_branches)
        return queryset

@admin.register(LearningObjectives)
class LearningObjectivesAdmin(admin.ModelAdmin):
    list_display = ('id', 'framework_code', 'description', 'unit')
    list_filter = ('unit', 'is_active')
    search_fields = ('framework_code', 'description', 'unit__name')
    readonly_fields = ('id',)

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        if not request.user.is_superuser:
            accessible_branches = UserBranchAccess.objects.filter(user=request.user).values_list('branch_id', flat=True)
            queryset = queryset.filter(unit__category__subject__branch_id__in=accessible_branches)
        return queryset

@admin.register(LessonPlans)
class LessonPlansAdmin(admin.ModelAdmin):
    form = LessonPlansAdminForm
    list_display = ('id', 'unit', 'subunit', 'subject', 'created_by', 'term')
    list_filter = ('subject', 'term', 'created_by')
    search_fields = ('unit__name', 'subject__name', 'term__name')
    readonly_fields = ('id', 'created_at', 'updated_at')
    inlines = [LessonActivitiesInline, LessonPlanEvaluationsInline]

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        if not request.user.is_superuser:
            accessible_branches = UserBranchAccess.objects.filter(user=request.user).values_list('branch_id', flat=True)
            queryset = queryset.filter(subject__branch_id__in=accessible_branches)
        return queryset

    def save_model(self, request, obj, form, change):
        if not change:  # Only set on create
            if hasattr(request.user, 'teacher'):
                teacher = request.user.teacher
                try:
                    teacher_assignment = TeacherAssignment.objects.get(
                        teacher=teacher,
                        subject=obj.subject,
                        class_fk=obj.learner_group
                    )
                    obj.created_by = teacher_assignment
                except TeacherAssignment.DoesNotExist:
                    raise ValueError("No valid TeacherAssignment for this subject and class.")
        super().save_model(request, obj, form, change)

@admin.register(LessonActivities)
class LessonActivitiesAdmin(admin.ModelAdmin):
    list_display = ('id', 'lesson_plan', 'order_number', 'time_slot')
    list_filter = ('lesson_plan',)
    search_fields = ('topic_content', 'lesson_plan__unit__name')
    readonly_fields = ('id',)

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        if not request.user.is_superuser:
            accessible_branches = UserBranchAccess.objects.filter(user=request.user).values_list('branch_id', flat=True)
            queryset = queryset.filter(lesson_plan__subject__branch_id__in=accessible_branches)
        return queryset

@admin.register(LessonPlanEvaluations)
class LessonPlanEvaluationsAdmin(admin.ModelAdmin):
    list_display = ('id', 'lesson_plan', 'section')
    list_filter = ('section', 'lesson_plan')
    search_fields = ('lesson_plan_evaluation', 'section__name')
    readonly_fields = ('id',)

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        if not request.user.is_superuser:
            accessible_branches = UserBranchAccess.objects.filter(user=request.user).values_list('branch_id', flat=True)
            queryset = queryset.filter(lesson_plan__subject__branch_id__in=accessible_branches)
        return queryset

def is_teacher(user):
    return UserRole.objects.filter(user=user, role__name__iexact='teacher').exists()
@admin.register(LessonPlanObjectives)
class LessonPlanObjectivesAdmin(admin.ModelAdmin):
    list_display = ('id', 'lesson_plan', 'objective', 'student', 'score', 'created_at')
    list_filter = ('lesson_plan', 'objective', 'student', 'created_at')
    search_fields = ('lesson_plan__unit__name', 'objective__framework_code', 'student__user__full_name')
    readonly_fields = ('id', 'created_at', 'updated_at')

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        if not request.user.is_superuser:
            accessible_branches = UserBranchAccess.objects.filter(user=request.user).values_list('branch_id', flat=True)
            queryset = queryset.filter(lesson_plan__subject__branch_id__in=accessible_branches)
        return queryset

    def has_add_permission(self, request):
        return is_teacher(request.user) and request.user.is_superuser

    def has_change_permission(self, request, obj=None):
        if not obj or not is_teacher(request.user):
            return False
        return obj.lesson_plan.created_by.teacher.user == request.user or request.user.is_superuser

    def has_delete_permission(self, request, obj=None):
        if not obj or not is_teacher(request.user):
            return False
        return obj.lesson_plan.created_by.teacher.user == request.user or request.user.is_superuser

class AssignmentsForm(forms.ModelForm):
    students = forms.ModelMultipleChoiceField(
        queryset=Student.objects.none(),
        required=False,
        widget=FilteredSelectMultiple('Students', False)
    )
    assigned_by = forms.ModelChoiceField(
        queryset=User.objects.filter(userrole__role__name__iexact='teacher').distinct(),
        required=False
    )

    class Meta:
        model = Assignments
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Import Class model
        from academics.models import Class

        # Ensure class_fk field shows all available classes
        self.fields['class_fk'].queryset = Class.objects.all()
        self.fields['class_fk'].required = True

        # Ensure section field is initially empty until class is selected
        self.fields['section'].queryset = Section.objects.none()
        self.fields['section'].required = False

        teacher_queryset = User.objects.filter(userrole__role__name__iexact='teacher').distinct()
        print(f"[AssignmentsForm] Teacher queryset count: {teacher_queryset.count()}")

        # Filter sections and students based on selected class
        if 'class_fk' in self.data or (self.instance and self.instance.pk and self.instance.class_fk):
            class_id = self.data.get('class_fk') or (self.instance.class_fk.id if self.instance.class_fk else None)
            if class_id:
                print(f"[AssignmentsForm] Filtering for class_fk: {class_id}")
                self.fields['section'].queryset = Section.objects.filter(class_fk=class_id)

                # Filter students by section if section is selected
                if 'section' in self.data or (self.instance and self.instance.pk and self.instance.section):
                    section_id = self.data.get('section') or (self.instance.section.id if self.instance.section else None)
                    if section_id:
                        print(f"[AssignmentsForm] Filtering students for section_id: {section_id}")
                        students_queryset = Student.objects.filter(section=section_id)
                        print(f"[AssignmentsForm] Found {students_queryset.count()} students in section")
                        self.fields['students'].queryset = students_queryset
                        self.fields['students'].widget.choices = [
                            (student.id, str(student)) for student in students_queryset
                        ]
                else:
                    # Show all students in the class if no section selected yet
                    students_queryset = Student.objects.filter(grade=class_id)
                    print(f"[AssignmentsForm] Found {students_queryset.count()} students in class")
                    self.fields['students'].queryset = students_queryset
        else:
            # No class selected yet - show empty querysets
            print(f"[AssignmentsForm] No class selected - showing empty querysets")

    def clean_students(self):
        students = self.cleaned_data['students']
        if students and 'all' in [str(s) for s in students]:
            section = self.cleaned_data.get('section')
            if section:
                return Student.objects.filter(section=section)
        return students

@admin.register(Assignments)
class AssignmentsAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'subject', 'class_fk', 'section', 'assigned_date', 'due_date')
    list_filter = ('subject', 'class_fk', 'section', 'assigned_date')
    search_fields = ('title', 'description', 'subject__name')
    readonly_fields = ('id',)
    date_hierarchy = 'assigned_date'
    form = AssignmentsForm

    # Define field ordering to make it clear
    fields = (
        'title',
        'description',
        'subject',
        'class_fk',  # Select class first
        'section',   # Then section (filtered by class)
        'students',  # Then students (filtered by section/class)
        'assigned_by',
        'assigned_date',
        'due_date',
        'file_url',
        'is_group_assignment',
        'group_name',
    )

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        if not request.user.is_superuser:
            accessible_branches = UserBranchAccess.objects.filter(user=request.user).values_list('branch_id', flat=True)
            queryset = queryset.filter(subject__branch_id__in=accessible_branches)
        return queryset

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if not request.user.is_superuser and 'assigned_by' in form.base_fields:
            form.base_fields['assigned_by'].initial = request.user

        # Add help text to guide users
        if 'class_fk' in form.base_fields:
            form.base_fields['class_fk'].help_text = 'Select the grade/class for this assignment'
        if 'section' in form.base_fields:
            form.base_fields['section'].help_text = 'Select a section (optional). Sections are filtered based on the selected class.'
        if 'students' in form.base_fields:
            form.base_fields['students'].help_text = 'Select specific students (optional). Students are filtered based on the selected section/class.'

        return form

    class Media:
        js = ('admin/js/vendor/jquery/jquery.js', 'admin/js/jquery.init.js')
        css = {
            'all': ('admin/css/widgets.css',)
        }

class StudentAssignmentsForm(forms.ModelForm):
    # Add a choice field for grade with common grading options
    GRADE_CHOICES = [
        ('', '--- Not Graded Yet ---'),
        ('A+', 'A+ (97-100)'),
        ('A', 'A (93-96)'),
        ('A-', 'A- (90-92)'),
        ('B+', 'B+ (87-89)'),
        ('B', 'B (83-86)'),
        ('B-', 'B- (80-82)'),
        ('C+', 'C+ (77-79)'),
        ('C', 'C (73-76)'),
        ('C-', 'C- (70-72)'),
        ('D+', 'D+ (67-69)'),
        ('D', 'D (63-66)'),
        ('D-', 'D- (60-62)'),
        ('F', 'F (Below 60)'),
    ]

    grade_letter = forms.ChoiceField(
        choices=GRADE_CHOICES,
        required=False,
        label='Grade (Letter)',
        help_text='Select a letter grade, or enter a numeric score below'
    )

    class Meta:
        model = StudentAssignments
        fields = '__all__'
        widgets = {
            'grade': forms.NumberInput(attrs={
                'placeholder': 'Enter numeric grade (0-100)',
                'min': '0',
                'max': '100',
                'step': '0.5'
            })
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Ensure assignment field shows all available assignments with class info
        self.fields['assignment'].queryset = Assignments.objects.select_related(
            'class_fk', 'section', 'subject'
        ).all()

        # Custom label to show class and section info
        self.fields['assignment'].label_from_instance = lambda obj: (
            f"{obj.title} - {obj.subject.name} "
            f"(Class: {obj.class_fk.grade if obj.class_fk else 'N/A'}, "
            f"Section: {obj.section.name if obj.section else 'All'})"
        )

        # Filter students to show their grade/section info
        self.fields['student'].queryset = Student.objects.select_related(
            'grade', 'section', 'user'
        ).all()

        # Custom label for students showing their class and section
        self.fields['student'].label_from_instance = lambda obj: (
            f"{obj.user.full_name} "
            f"(Class: {obj.grade.grade if obj.grade else 'N/A'}, "
            f"Section: {obj.section.name if obj.section else 'N/A'})"
        )

        # Add help text for grade field
        self.fields['grade'].required = False
        self.fields['grade'].label = 'Grade (Numeric Score)'
        self.fields['grade'].help_text = 'Enter a numeric score (0-100), or use the letter grade dropdown above'

        print(f"[StudentAssignmentsForm] Assignments count: {self.fields['assignment'].queryset.count()}")
        print(f"[StudentAssignmentsForm] Students count: {self.fields['student'].queryset.count()}")

    def clean(self):
        cleaned_data = super().clean()
        grade_letter = cleaned_data.get('grade_letter')
        grade_numeric = cleaned_data.get('grade')

        # Convert letter grade to numeric if letter grade is selected
        if grade_letter and not grade_numeric:
            grade_mapping = {
                'A+': 98.5, 'A': 94.5, 'A-': 91.0,
                'B+': 88.0, 'B': 84.5, 'B-': 81.0,
                'C+': 78.0, 'C': 74.5, 'C-': 71.0,
                'D+': 68.0, 'D': 64.5, 'D-': 61.0,
                'F': 50.0
            }
            cleaned_data['grade'] = grade_mapping.get(grade_letter)

        return cleaned_data

@admin.register(StudentAssignments)
class StudentAssignmentsAdmin(admin.ModelAdmin):
    list_display = ('id', 'student', 'assignment', 'grade', 'submission_url', 'submitted_date')
    list_filter = ('student', 'assignment', 'submitted_date')
    search_fields = ('student__user__full_name', 'assignment__title')
    readonly_fields = ('id', 'submitted_date')
    date_hierarchy = 'submitted_date'
    form = StudentAssignmentsForm

    fieldsets = (
        ('Assignment Information', {
            'fields': ('assignment', 'student')
        }),
        ('Submission Details', {
            'fields': ('submission_url', 'submitted_date')
        }),
        ('Grading', {
            'fields': ('grade_letter', 'grade', 'feedback'),
            'description': 'You can either select a letter grade OR enter a numeric score (0-100). If you select a letter grade, it will be automatically converted to a numeric score.'
        }),
    )

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        if not request.user.is_superuser:
            accessible_branches = UserBranchAccess.objects.filter(user=request.user).values_list('branch_id', flat=True)
            queryset = queryset.filter(student__branch_id__in=accessible_branches)
        return queryset

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)

        # Add help text
        if 'assignment' in form.base_fields:
            form.base_fields['assignment'].help_text = 'Select the assignment (shows class and section info)'
        if 'student' in form.base_fields:
            form.base_fields['student'].help_text = 'Select the student (shows their class and section)'

        return form


@admin.register(ExamResults)
class ExamResultsAdmin(admin.ModelAdmin):
    list_display = ('id', 'student', 'subject', 'exam', 'score')
    list_filter = ('subject', 'exam')
    search_fields = ('student__user__full_name', 'subject__name', 'exam__name')
    readonly_fields = ('id',)
    date_hierarchy = 'exam__start_date' 

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        if not request.user.is_superuser:
            accessible_branches = UserBranchAccess.objects.filter(user=request.user).values_list('branch_id', flat=True)
            queryset = queryset.filter(student__branch_id__in=accessible_branches)
        return queryset
