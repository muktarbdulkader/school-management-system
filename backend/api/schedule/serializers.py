from django.utils import timezone
from rest_framework import serializers
from academics.serializers import CourseTypeSerializer, SubjectsSerializer, TermsSerializer
from students.models import Parent, ParentStudent, Student
from students.serializers import StudentSerializer
from teachers.models import Teacher
from teachers.serializers import TeacherSerializer, TeacherAssignmentSerializer
from users.models import User
from users.serializers import UserSerializer
from .models import DAY_OF_WEEK_CHOICES, ClassScheduleSlot, LeaveRequest, SlotType, StudentScheduleOverride, Attendance, Exam, SubjectExamDay, Classroom 
from academics.models import CourseType, Subject, Class, Section, Term
from users.models import Branch
from teachers.models import TeacherAssignment
import logging
logger = logging.getLogger(__name__)

class SubjectSerializer(serializers.ModelSerializer):
    course_type = serializers.PrimaryKeyRelatedField(queryset=CourseType.objects.all(), write_only=True, required=False)
    course_type_details = CourseTypeSerializer(source='course_type', read_only=True)
    class Meta:
        model = Subject
        fields = ['id', 'name', 'code', 'course_type', 'course_type_details']

class ClassSerializer(serializers.ModelSerializer):
    branch = serializers.UUIDField(source='branch_id', read_only=True)
    
    class Meta:
        model = Class
        fields = ['id', 'grade', 'branch']

class SectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Section
        fields = ['id', 'name', 'room_number']

class SlotTypeSerializer(serializers.ModelSerializer):
    course_type = serializers.PrimaryKeyRelatedField(queryset=CourseType.objects.all(), allow_null=True, required=False, write_only=True)
    course_type_details = CourseTypeSerializer(source='course_type', read_only=True)

    class Meta:
        model = SlotType
        fields = ['id', 'name', 'course_type', 'course_type_details', 'description']

class ClassroomSerializer(serializers.ModelSerializer):
    """Serializer for Classroom model"""
    branch_id = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.all(),
        source='branch',
        write_only=True,
        required=False
    )

    class Meta:
        model = Classroom
        fields = ['id', 'name', 'code', 'building', 'floor', 'capacity', 'room_type', 'branch', 'branch_id', 'is_active', 'created_at']

class ClassScheduleSlotsSerializer(serializers.ModelSerializer):
    # Write-only fields for creating/updating - use PrimaryKeyRelatedField for FK resolution
    class_id = serializers.PrimaryKeyRelatedField(queryset=Class.objects.all(), write_only=True)
    section_id = serializers.PrimaryKeyRelatedField(queryset=Section.objects.all(), write_only=True)
    subject_id = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all(), allow_null=True, required=False, write_only=True)
    teacher_id = serializers.UUIDField(write_only=True, allow_null=True, required=False)
    classroom_id = serializers.PrimaryKeyRelatedField(queryset=Classroom.objects.all(), allow_null=True, required=False, write_only=True)
    slot_type = serializers.PrimaryKeyRelatedField(queryset=SlotType.objects.all(), write_only=True)
    term = serializers.PrimaryKeyRelatedField(queryset=Term.objects.all(), allow_null=True, required=False, write_only=True)
    
    # Read-only nested serializers for responses - source must match model field names
    class_details = ClassSerializer(source='class_fk', read_only=True)
    section_details = SectionSerializer(source='section', read_only=True)
    subject = SubjectSerializer(read_only=True)
    slot_type_details = SlotTypeSerializer(source='slot_type', read_only=True)
    teacher_details = TeacherAssignmentSerializer(source='teacher_assignment', read_only=True)
    classroom_details = ClassroomSerializer(source='classroom', read_only=True)
    term_details = TermsSerializer(source='term', read_only=True)

    class Meta:
        model = ClassScheduleSlot
        fields = ['id', 'class_id', 'section_id', 'subject_id', 'teacher_id', 'classroom_id', 
                  'slot_type', 'term', 'term_details', 'day_of_week', 'start_time', 'end_time', 'period_number',
                  'class_details', 'section_details', 'subject', 'slot_type_details', 
                  'teacher_details', 'classroom_details']

    def validate(self, data):
        """Validate the data for conflicts."""
        # PrimaryKeyRelatedField returns model instances
        class_obj = data.get('class_id')  # This is a Class instance
        section_obj = data.get('section_id')  # This is a Section instance
        day_of_week = data.get('day_of_week')
        period_number = data.get('period_number')
        classroom_obj = data.get('classroom_id')  # This is a Classroom instance or None
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        slot_type_obj = data.get('slot_type')  # This is a SlotType instance

        # Get IDs from model instances
        class_id = class_obj.id if class_obj else None
        section_id = section_obj.id if section_obj else None
        classroom_id = classroom_obj.id if classroom_obj else None

        if self.instance:
            existing_slots = ClassScheduleSlot.objects.filter(
                class_fk_id=class_id or self.instance.class_fk_id,
                section_id=section_id or self.instance.section_id,
                day_of_week=day_of_week or self.instance.day_of_week
            ).exclude(id=self.instance.id).exclude(term__status='closed')
        else:
            existing_slots = ClassScheduleSlot.objects.filter(
                class_fk_id=class_id,
                section_id=section_id,
                day_of_week=day_of_week
            ).exclude(term__status='closed')
        if period_number and existing_slots.filter(period_number=period_number).exists():
            raise serializers.ValidationError("This period number is already assigned for the given day.")

        # Check classroom conflicts (exclude closed terms)
        if classroom_id and day_of_week and start_time and end_time:
            if self.instance:
                classroom_conflicts = ClassScheduleSlot.objects.filter(
                    classroom_id=classroom_id,
                    day_of_week=day_of_week,
                    start_time__lt=end_time,
                    end_time__gt=start_time
                ).exclude(id=self.instance.id).exclude(term__status='closed')
            else:
                classroom_conflicts = ClassScheduleSlot.objects.filter(
                    classroom_id=classroom_id,
                    day_of_week=day_of_week,
                    start_time__lt=end_time,
                    end_time__gt=start_time
                ).exclude(term__status='closed')

            if classroom_conflicts.exists():
                raise serializers.ValidationError("This classroom is already booked at this time")

        return data

    def create(self, validated_data):
        """Create a new ClassScheduleSlot, mapping field names to model fields."""
        from teachers.models import TeacherAssignment, Teacher
        
        # PrimaryKeyRelatedField returns model instances - extract IDs
        create_data = {
            'class_fk_id': validated_data.get('class_id').id if validated_data.get('class_id') else None,
            'section_id': validated_data.get('section_id').id if validated_data.get('section_id') else None,
            'subject_id': validated_data.get('subject_id').id if validated_data.get('subject_id') else None,
            'classroom_id': validated_data.get('classroom_id').id if validated_data.get('classroom_id') else None,
            'slot_type_id': validated_data.get('slot_type').id if validated_data.get('slot_type') else None,
            'term_id': validated_data.get('term').id if validated_data.get('term') else None,
            'day_of_week': validated_data.get('day_of_week'),
            'start_time': validated_data.get('start_time'),
            'end_time': validated_data.get('end_time'),
            'period_number': validated_data.get('period_number', 1),
        }
        
        # Handle teacher_id - it's a Teacher ID, find the TeacherAssignment
        teacher_id = validated_data.get('teacher_id')
        if teacher_id:
            try:
                # Try to find assignment by TeacherAssignment ID first
                assignment = TeacherAssignment.objects.get(id=teacher_id)
                create_data['teacher_assignment_id'] = assignment.id
            except TeacherAssignment.DoesNotExist:
                # If not found, try to find by Teacher ID
                try:
                    teacher = Teacher.objects.get(id=teacher_id)
                    # Find an active assignment for this teacher
                    assignment = TeacherAssignment.objects.filter(
                        teacher=teacher,
                        is_active=True
                    ).first()
                    if assignment:
                        create_data['teacher_assignment_id'] = assignment.id
                except Teacher.DoesNotExist:
                    pass  # Leave teacher_assignment_id as None
        
        # Set default period_number if not provided
        if not create_data['period_number']:
            create_data['period_number'] = 1
            
        return ClassScheduleSlot.objects.create(**create_data)

    def update(self, instance, validated_data):
        """Update an existing ClassScheduleSlot, mapping field names to model fields."""
        from teachers.models import TeacherAssignment, Teacher
        
        # Map model instances to FK IDs
        if 'class_id' in validated_data:
            class_obj = validated_data['class_id']
            instance.class_fk_id = class_obj.id if class_obj else None
        if 'section_id' in validated_data:
            section_obj = validated_data['section_id']
            instance.section_id = section_obj.id if section_obj else None
        if 'subject_id' in validated_data:
            subject_obj = validated_data['subject_id']
            instance.subject_id = subject_obj.id if subject_obj else None
        if 'classroom_id' in validated_data:
            classroom_obj = validated_data['classroom_id']
            instance.classroom_id = classroom_obj.id if classroom_obj else None
        if 'slot_type' in validated_data:
            slot_type_obj = validated_data['slot_type']
            instance.slot_type_id = slot_type_obj.id if slot_type_obj else None
        if 'term' in validated_data:
            term_obj = validated_data['term']
            instance.term_id = term_obj.id if term_obj else None
        
        # Direct field updates
        for field in ['day_of_week', 'start_time', 'end_time', 'period_number']:
            if field in validated_data:
                setattr(instance, field, validated_data[field])
        
        # Handle teacher_id - it's a Teacher ID, find the TeacherAssignment
        if 'teacher_id' in validated_data:
            teacher_id = validated_data['teacher_id']
            if teacher_id:
                try:
                    # Try to find assignment by TeacherAssignment ID first
                    assignment = TeacherAssignment.objects.get(id=teacher_id)
                    instance.teacher_assignment_id = assignment.id
                except TeacherAssignment.DoesNotExist:
                    # If not found, try to find by Teacher ID
                    try:
                        teacher = Teacher.objects.get(id=teacher_id)
                        # Find an active assignment for this teacher
                        assignment = TeacherAssignment.objects.filter(
                            teacher=teacher,
                            is_active=True
                        ).first()
                        if assignment:
                            instance.teacher_assignment_id = assignment.id
                        else:
                            instance.teacher_assignment_id = None
                    except Teacher.DoesNotExist:
                        instance.teacher_assignment_id = None
            else:
                instance.teacher_assignment_id = None
        
        instance.save()
        return instance

class StudentScheduleOverridesSerializer(serializers.ModelSerializer):
    subject_id = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all(), write_only=True)
    subject_details = SubjectsSerializer(source='subject', read_only=True)
    term_id = serializers.PrimaryKeyRelatedField(queryset=Term.objects.all(), write_only=True)
    term_details = TermsSerializer(source='term_id', read_only=True)
    student_id = serializers.PrimaryKeyRelatedField(queryset=Student.objects.all(), write_only=True) 
    day_of_week = serializers.ChoiceField(choices=DAY_OF_WEEK_CHOICES, required=True)
    slot_type = serializers.PrimaryKeyRelatedField(queryset=SlotType.objects.all(), write_only=True)
    slot_type_details = SlotTypeSerializer(source='slot_type', read_only=True)
    teacher_id = serializers.PrimaryKeyRelatedField(queryset=TeacherAssignment.objects.all(), allow_null=True, required=False, write_only=True)
    teacher_details = TeacherAssignmentSerializer(source='teacher_id', read_only=True)

    class Meta:
        model = StudentScheduleOverride
        fields = ['id', 'student_id', 'slot_type', 'slot_type_details', 'subject', 'subject_details', 'term_id', 'term_details', 'day_of_week', 'period_number', 'teacher_id', 'teacher_details']

    def validate(self, data):
        from students.models import Student
        logger.info(f"Initial data: {self.initial_data}")

        logger.info(f"Raw data in validate: {data}")
        student = data.get('student_id')  # Now a Student object
        logger.info(f"Raw student from data: {student.id} - {student.user.full_name}")

        period_number = data.get('period_number')
        day_of_week = data.get('day_of_week')
        slot_type = data.get('slot_type')
        term = data.get('term')

        logger.info(f"Filter params - class_id: {student.grade_id}, section_id: {student.section_id}, day_of_week: {day_of_week}, period_number: {period_number}")

        # Ensure day_of_week is iterable
        day_of_week_list = [day_of_week] if day_of_week else []

        # Check if the period exists in the student's class schedule
        class_slot = ClassScheduleSlot.objects.filter(
            class_fk_id=student.grade_id,
            section_id=student.section_id,
            day_of_week__in=day_of_week_list,
            period_number=period_number
        ).first()
        logger.info(f"Found class_slot: {class_slot}")
        if not class_slot or class_slot.slot_type != slot_type:
            raise serializers.ValidationError(
                f"No matching slot found for period {period_number} and slot type {slot_type.name}"
            )
        return data

class AttendanceSerializer(serializers.ModelSerializer):
    student_id = serializers.PrimaryKeyRelatedField(queryset=Student.objects.all(), source='student', write_only=True)
    student_details = StudentSerializer(source='student', read_only=True)
    subject_id = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all(), write_only=True)
    subject = SubjectSerializer(source='subject_id', read_only=True)
    status = serializers.ChoiceField(choices=Attendance.STATUS_CHOICES)

    class Meta:
        model = Attendance
        fields = ['id', 'student_id', 'student_details', 'subject_id', 'subject', 'date', 'status']
        read_only_fields = ['id', 'student_details', 'subject']

    def validate(self, data):
        return data

class LeaveRequestSerializer(serializers.ModelSerializer):
    student_id = serializers.PrimaryKeyRelatedField(queryset=Student.objects.all(), write_only=True)
    student_details = StudentSerializer(source='student_id', read_only=True)
    subject_id = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all(), write_only=True, required=False)
    subject = SubjectSerializer(source='subject_id', read_only=True)
    requested_by = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        write_only=True
    )
    requester_details = UserSerializer(source = "requested_by", read_only=True)

    class Meta:
        model = LeaveRequest
        fields = ['id', 'student_id', 'student_details', 'subject_id', 'subject', 'date', 'reason', 'status', 'created_at', 'updated_at', 'requested_by', 'requester_details']
        read_only_fields = ['id', 'student_details', 'subject', 'status', 'created_at', 'updated_at']

    def validate(self, data):
        request_user = self.context['request'].user
        if data['requested_by'] != request_user:
            raise serializers.ValidationError("Only the requesting parent can submit a leave request.")
        if not ParentStudent.objects.filter(parent__user=request_user, student_id=data['student_id']).exists():
            raise serializers.ValidationError("You are not authorized to submit a leave request for this student.")
        if data['date'] < timezone.now().date():
            raise serializers.ValidationError("Leave request date cannot be in the past.")
        return data

class ExamsSerializer(serializers.ModelSerializer):
    subject_id = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all(), source='subject', write_only=True)
    subject = SubjectSerializer(read_only=True)
    term_id = serializers.PrimaryKeyRelatedField(queryset=Term.objects.all(), source='term', write_only=True)
    term_details = TermsSerializer(source='term', read_only=True)
    class_id = serializers.PrimaryKeyRelatedField(queryset=Class.objects.all(), source='class_fk', write_only=True)
    class_details = ClassSerializer(source='class_fk', read_only=True)
    section_id = serializers.PrimaryKeyRelatedField(queryset=Section.objects.all(), source='section', write_only=True)
    section_details = SectionSerializer(source='section', read_only=True)

    created_by_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), source='created_by', write_only=True, required=False)

    class Meta:
        model = Exam
        fields = ['id', 'name', 'term_id', 'term_details', 'exam_type', 'subject_id', 'subject', 'class_id', 'class_details', 'section_id', 'section_details', 'branch_id', 'start_date', 'end_date', 'start_time', 'end_time', 'max_score', 'description', 'created_by_id']

class SubjectExamDaysSerializer(serializers.ModelSerializer):
    subject_id = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all(), source='subject', write_only=True)
    subject = SubjectSerializer(read_only=True)

    class Meta:
        model = SubjectExamDay
        fields = ['id', 'subject_id', 'subject', 'day_of_week']