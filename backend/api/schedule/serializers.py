from django.utils import timezone
from rest_framework import serializers
from academics.serializers import CourseTypeSerializer, SubjectsSerializer, TermsSerializer
from students.models import Parent, ParentStudent, Student
from students.serializers import StudentSerializer
from teachers.models import Teacher
from teachers.serializers import TeacherSerializer, TeacherAssignmentSerializer
from users.models import User
from users.serializers import UserSerializer
from .models import DAY_OF_WEEK_CHOICES, ClassScheduleSlot, LeaveRequest, SlotType, StudentScheduleOverride, Attendance, Exam, SubjectExamDay 
from academics.models import CourseType, Subject, Class, Section, Term
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
    class Meta:
        model = Class
        fields = ['id', 'grade']

class SectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Section
        fields = ['id', 'name', 'room_number']

class SlotTypeSerializer(serializers.ModelSerializer):
    course_type = serializers.PrimaryKeyRelatedField(queryset=CourseType.objects.all(), allow_null=True, required=False, write_only=True)
    course_type_details = CourseTypeSerializer(source='course_type', read_only=True)
    class Meta:
        model = SlotType
        fields = ['id', 'name', 'description', 'course_type', 'course_type_details']

class ClassScheduleSlotsSerializer(serializers.ModelSerializer):
    subject_id = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all(), allow_null=True, required=False, write_only=True)
    subject = SubjectSerializer(read_only=True)
    class_id = serializers.PrimaryKeyRelatedField(queryset=Class.objects.all(), allow_null=True, required=False, write_only=True)
    class_details = ClassSerializer(source = 'class_fk', read_only=True)
    section_id = serializers.PrimaryKeyRelatedField(queryset=Section.objects.all(), allow_null=True, required=False, write_only=True)
    section_details = SectionSerializer(source='section', read_only=True)
    slot_type = serializers.PrimaryKeyRelatedField(queryset=SlotType.objects.all(), allow_null=True, required=False, write_only=True)
    slot_type_details = SlotTypeSerializer(source = 'slot_type', read_only=True)
    teacher_id = serializers.PrimaryKeyRelatedField(queryset=TeacherAssignment.objects.all(), allow_null=True, required=False, write_only=True)
    teacher_details = TeacherAssignmentSerializer(source='teacher_assignment', read_only=True)

    class Meta:
        model = ClassScheduleSlot
        fields = ['id', 'class_fk', 'class_id', 'class_details', 'section_id', 'section_details', 'slot_type', 'slot_type_details', 'day_of_week', 'start_time', 'end_time', 'subject_id', 'subject',  'period_number', 'teacher_id', 'teacher_details']

    def validate(self, data):
        # Ensure period_number is unique for the day
        if self.instance:
            existing_slots = ClassScheduleSlot.objects.filter(
                class_id=data.get('class_fk', self.instance.class_fk),
                section_id=data.get('section_id', self.instance.section_id),
                day_of_week=data.get('day_of_week', self.instance.day_of_week)
            ).exclude(id=self.instance.id)
        else:
            existing_slots = ClassScheduleSlot.objects.filter(
                class_id=data.get('class_fk'),
                section_id=data.get('section_id'),
                day_of_week=data.get('day_of_week')
            )
        if 'period_number' in data and existing_slots.filter(period_number=data['period_number']).exists():
            raise serializers.ValidationError("This period number is already assigned for the given day.")
        return data

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
            class_id=student.grade_id,
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
    student_id = serializers.PrimaryKeyRelatedField(queryset=Student.objects.all(), write_only=True)
    student_details = StudentSerializer(source = 'student_id', read_only=True)
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
    subject_id = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all(), write_only=True)
    subject = SubjectSerializer(source='subject_id', read_only=True)
    term_id = serializers.PrimaryKeyRelatedField(queryset=Term.objects.all(), write_only=True)
    term_details = TermsSerializer(source='term', read_only=True)
    class_id = serializers.PrimaryKeyRelatedField(queryset=Class.objects.all(), write_only=True)
    class_details = ClassSerializer(source='class_id', read_only=True)
    section_id = serializers.PrimaryKeyRelatedField(queryset=Section.objects.all(), write_only=True)
    section_details = SectionSerializer(source='section_id', read_only=True)

    class Meta:
        model = Exam
        fields = ['id', 'name', 'term_id', 'term_details', 'exam_type', 'subject_id', 'subject', 'class_id', 'class_details', 'section_id', 'section_details', 'branch_id', 'start_date', 'end_date', 'description']

class SubjectExamDaysSerializer(serializers.ModelSerializer):
    subject_id = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all(), write_only=True)
    subject = SubjectSerializer(source='subject_id', read_only=True)

    class Meta:
        model = SubjectExamDay
        fields = ['id', 'subject_id', 'subject', 'day_of_week']