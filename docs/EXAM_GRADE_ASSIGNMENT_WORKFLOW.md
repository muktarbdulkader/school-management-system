# Exam, Grade & Assignment Workflow

## Overview
This document describes the complete workflow for exams, grades, and assignments across different user roles.

---

## User Roles & Permissions

### 1. Teacher
**Can:**
- Create exams/assessments for assigned classes/subjects
- Enter grades for students in their assigned subjects
- View all students in their assigned classes/sections
- Create and manage assignments
- View assignment submissions from students

**Access Control:**
- Based on `TeacherAssignment` model (class_fk, section, subject)
- Can access gradebook only for assigned subjects
- Can only see exams they created or for their assigned subjects

### 2. Student
**Can:**
- View upcoming exams
- View their own exam results/grades
- View assignments assigned to them
- Submit assignments

**Access Control:**
- Based on their `grade` and `section`
- Can only see exams matching their class/section
- Can only see their own results

### 3. Parent
**Can:**
- View children's upcoming exams
- View children's exam results
- View children's assignments
- Submit assignments on behalf of children

**Access Control:**
- Based on `ParentStudent` relationships
- Can only see data for their linked children

### 4. Admin/Staff
**Can:**
- Create exams for any class/subject
- Enter/modify any grades
- View all exams and results
- Manage all assignments

---

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TEACHER WORKFLOW                                   │
└─────────────────────────────────────────────────────────────────────────────┘

1. CREATE ASSESSMENT/EXAM
   ┌──────────────┐
   │   Teacher    │───Select Term, Class, Section, Subject
   │   Gradebook  │
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │ Create Exam  │───Enter: Name, Type, Dates, Max Score, Description
   │   Dialog     │
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │   Backend    │───POST /api/exams/
   │   Validation │      Requires: branch_id (from teacher profile)
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │ Exam Created │───Visible to students/parents in that class/section
   └──────────────┘

2. ENTER GRADES
   ┌──────────────┐
   │   Teacher    │───Click "Enter Grade" on student row
   │   Gradebook  │
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │ Grade Entry  │───Enter: Score, Max Score, Remarks
   │   Dialog     │
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │   Backend    │───POST /api/exam_results/
   │   Validation │      Requires: teacher_assignment verification
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │ Grade Saved  │───Auto-calculates percentage
   └──────────────┘      Student/Parent can now see result

3. CREATE ASSIGNMENT
   ┌──────────────┐
   │   Teacher    │───Navigate to Assignments page
   │   Dashboard  │
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │  Assignment  │───Enter: Title, Description, Due Date, Class/Section
   │    Form      │      Option: Assign to specific students or entire class
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │   Backend    │───POST /api/assignments/
   │   Validation │      Links to teacher_assignment
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │ Assignment   │───Students see in their dashboard
   │  Created     │
   └──────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           STUDENT/PARENT WORKFLOW                          │
└─────────────────────────────────────────────────────────────────────────────┘

1. VIEW UPCOMING EXAMS
   ┌──────────────┐
   │   Student    │───Dashboard shows exams for their class/section/subject
   │   Dashboard  │
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │   Backend    │───GET /api/exams/?class_id=X&section_id=Y
   │    Query     │      Filters by class/section and future dates
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │   Display    │───Shows: Subject, Exam Name, Date, Time
   │    List      │
   └──────────────┘

2. VIEW EXAM RESULTS
   ┌──────────────┐
   │   Student    │───Dashboard shows "Exam Results" card
   │   Dashboard  │
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │   Backend    │───GET /api/exam_results/
   │    Query     │      Filters by student_id
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │   Display    │───Shows: Subject, Score, Percentage, Grade, Remarks
   │    List      │
   └──────────────┘

3. VIEW & SUBMIT ASSIGNMENTS
   ┌──────────────┐
   │   Student    │───Dashboard shows "Assignments" card
   │   Dashboard  │
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │   Backend    │───GET /api/assignments/
   │    Query     │      Filters by class/section or direct student assignment
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │ Assignment   │───Shows: Title, Due Date, Status, Submit Button
   │    List      │
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │   Submit     │───Upload file or enter text
   │  Assignment  │
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │   Backend    │───POST /api/student_assignments/
   │   Submission │      Links student to assignment with submission_url
   └──────────────┘

---

## API Endpoints

### Exams
```
GET    /api/exams/                    - List exams (role-filtered)
POST   /api/exams/                    - Create exam (teachers/admins only)
GET    /api/exams/{id}/               - Get exam details
PUT    /api/exams/{id}/               - Update exam
DELETE /api/exams/{id}/               - Delete exam

Query Parameters:
  - class_id / grade_id: Filter by class
  - section_id: Filter by section
  - subject_id: Filter by subject
  - student_id: For parents viewing child's exams
```

### Exam Results (Grades)
```
GET    /api/exam_results/             - List results (role-filtered)
POST   /api/exam_results/             - Create/enter grade (teachers/admins)
GET    /api/exam_results/{id}/        - Get result details
PUT    /api/exam_results/{id}/        - Update grade
DELETE /api/exam_results/{id}/        - Delete grade

Query Parameters:
  - student_id: Filter by student
  - exam_id: Filter by exam
```

### Assignments
```
GET    /api/assignments/                - List assignments (role-filtered)
POST   /api/assignments/                - Create assignment (teachers/admins)
GET    /api/assignments/{id}/           - Get assignment details
PUT    /api/assignments/{id}/           - Update assignment
DELETE /api/assignments/{id}/           - Delete assignment

Query Parameters:
  - class_id: Filter by class
  - section_id: Filter by section
  - subject_id: Filter by subject
  - student_id: Filter by assigned student
```

### Student Assignments (Submissions)
```
GET    /api/student_assignments/      - List submissions
POST   /api/student_assignments/      - Submit assignment (students/parents)
PUT    /api/student_assignments/{id}/ - Grade submission (teachers)

Query Parameters:
  - assignment_id: Filter by assignment
  - student_id: Filter by student
```

---

## Database Models

### Exam (schedule app)
```python
class Exam(models.Model):
    id = UUIDField(primary_key=True)
    name = CharField()
    exam_type = CharField(choices=EXAM_TYPE_CHOICES)
    start_date = DateField()
    end_date = DateField()
    start_time = TimeField(null=True)
    end_time = TimeField(null=True)
    max_score = FloatField(default=100)
    description = TextField(blank=True)
    
    # Relationships
    term = ForeignKey(Term)
    class_fk = ForeignKey(Class)
    section = ForeignKey(Section, null=True, blank=True)
    subject = ForeignKey(Subject)
    branch = ForeignKey(Branch)
    created_by = ForeignKey(User)
```

### ExamResults (lessontopics app)
```python
class ExamResults(models.Model):
    id = UUIDField(primary_key=True)
    student = ForeignKey(Student)
    teacher_assignment = ForeignKey(TeacherAssignment)
    subject = ForeignKey(Subject)
    exam = ForeignKey(Exam)
    
    # Score fields
    max_score = FloatField(default=100)
    score = FloatField()
    percentage = DecimalField(max_digits=5, decimal_places=2)
    grade = CharField(max_length=2, null=True)
    remarks = TextField(blank=True)
    
    # Audit
    recorded_by = ForeignKey(User)
    recorded_at = DateTimeField(auto_now_add=True)
```

### Assignments (lessontopics app)
```python
class Assignments(models.Model):
    id = UUIDField(primary_key=True)
    title = CharField()
    description = TextField()
    due_date = DateField()
    max_score = FloatField(default=100)
    
    # Assignment scope
    class_fk = ForeignKey(Class)
    section = ForeignKey(Section, null=True, blank=True)
    subject = ForeignKey(Subject)
    students = ManyToManyField(Student, blank=True)
    is_group_assignment = BooleanField(default=False)
    
    # Metadata
    assigned_by = ForeignKey(User)
    created_at = DateTimeField(auto_now_add=True)
```

### StudentAssignments (Submissions)
```python
class StudentAssignments(models.Model):
    id = UUIDField(primary_key=True)
    assignment = ForeignKey(Assignments)
    student = ForeignKey(Student)
    
    # Submission
    submission_url = URLField()
    submission_date = DateTimeField(null=True)
    
    # Grading
    score = FloatField(null=True)
    status = CharField(choices=STATUS_CHOICES, default='assigned')
    feedback = TextField(blank=True)
    graded_by = ForeignKey(User, null=True)
    graded_at = DateTimeField(null=True)
```

---

## Key Backend Logic

### Teacher Access Control
```python
# Teachers can only see data for their assigned classes/subjects
assignments = TeacherAssignment.objects.filter(
    teacher=teacher, 
    is_active=True
)

for assignment in assignments:
    if assignment.section:
        # Specific section assignment
        queryset |= Q(
            class_fk=assignment.class_fk,
            section=assignment.section,
            subject=assignment.subject
        )
    else:
        # All sections of this class
        queryset |= Q(
            class_fk=assignment.class_fk,
            subject=assignment.subject
        )
```

### Parent Access Control
```python
# Parents can only see data for their linked children
children_ids = ParentStudent.objects.filter(
    parent__user=user
).values_list('student_id', flat=True)

queryset = queryset.filter(student_id__in=children_ids)
```

### Student Access Control
```python
# Students can only see their own data
if hasattr(user, 'student_profile'):
    student = Student.objects.get(user=user)
    queryset = queryset.filter(student=student)
```

---

## Frontend Routes

### Teacher Routes
```
/grades                    - Gradebook (create exams, enter grades)
/assignments              - Create and manage assignments
/child-profile/:studentId  - View student details (teacher view)
```

### Student Routes
```
/my-subjects               - View enrolled subjects and assignments
/child-profile/:studentId  - View own dashboard (redirects to own profile)
```

### Parent Routes
```
/child-profile/:studentId  - View child's dashboard
                          - Shows: Schedule, Exams, Results, Assignments
```

---

## Common Issues & Solutions

### Issue: "Branch information is required" when creating exam
**Cause:** Teacher profile doesn't have a branch assigned.
**Solution:** 
1. Check teacher profile: GET /api/teachers/me/
2. If branch_id is null, contact admin to assign branch in Teacher model

### Issue: Students not showing in gradebook
**Cause:** TeacherAssignment doesn't match selected class/section/subject.
**Solution:**
1. Check TeacherAssignment records for the teacher
2. Ensure is_active=True
3. Verify class_fk, section (can be null for all sections), and subject match

### Issue: "No upcoming exams" shown to students/parents
**Cause:** 
1. Exams not created for that class/section
2. Exam dates are in the past
3. Wrong class/section filters

**Solution:**
1. Teacher creates exam with correct class/section/subject
2. Check exam start_date is in future
3. Verify student.class_fk and student.section match exam filters

### Issue: Can't enter grade for student
**Cause:** TeacherAssignment doesn't authorize this subject/class combination.
**Solution:**
1. Check teacher has TeacherAssignment for this class/subject
2. Verify teacher_assignment.is_active=True

---

## Best Practices

1. **Always use server-side filtering** - Never rely on client-side filtering for access control
2. **Verify teacher assignments** - Check TeacherAssignment before allowing any teacher action
3. **Audit trail** - Always set recorded_by, graded_by, created_by fields
4. **Calculate percentages automatically** - Backend should auto-calculate percentage from score/max_score
5. **Handle null sections** - TeacherAssignment with null section = access to ALL sections of that class
