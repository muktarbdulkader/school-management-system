"""
Resource Request Serializers
"""
from rest_framework import serializers
from .models import ResourceRequest, ResourceRequestItem, DigitalResource, DigitalResourceAssignment


class ResourceRequestItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResourceRequestItem
        fields = ['id', 'item_name', 'description', 'quantity', 'unit', 'estimated_unit_cost']
        read_only_fields = ['id']


class ResourceRequestSerializer(serializers.ModelSerializer):
    items = ResourceRequestItemSerializer(many=True, read_only=True)
    requested_by_name = serializers.CharField(source='requested_by.full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    request_type_display = serializers.CharField(source='get_request_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    class_name = serializers.SerializerMethodField()
    class_grade = serializers.CharField(source='class_fk.grade', read_only=True)

    class Meta:
        model = ResourceRequest
        fields = '__all__'
        read_only_fields = ['id', 'requested_by', 'approved_by', 'completed_at', 'created_at', 'updated_at']

    def get_class_name(self, obj):
        if obj.class_fk:
            return obj.class_fk.grade
        return None


class ResourceRequestCreateSerializer(serializers.ModelSerializer):
    items = ResourceRequestItemSerializer(many=True, required=False)

    class Meta:
        model = ResourceRequest
        fields = ['request_type', 'title', 'description', 'quantity', 'priority',
                'class_fk', 'needed_by', 'notes', 'items', 'branch']

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        resource_request = ResourceRequest.objects.create(**validated_data)

        for item_data in items_data:
            ResourceRequestItem.objects.create(resource_request=resource_request, **item_data)

        return resource_request


class ResourceRequestUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResourceRequest
        fields = ['status', 'approved_by', 'actual_cost', 'notes', 'rejection_reason', 'branch']


class ResourceRequestApprovalSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=['approved', 'rejected'])
    rejection_reason = serializers.CharField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)


class DigitalResourceAssignmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.full_name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.user.full_name', read_only=True)
    class_name = serializers.CharField(source='class_fk.grade', read_only=True)
    target_type_display = serializers.CharField(source='get_target_type_display', read_only=True)

    class Meta:
        model = DigitalResourceAssignment
        fields = ['id', 'target_type', 'target_type_display', 'student', 'student_name', 
                  'teacher', 'teacher_name', 'class_fk', 'class_name', 'created_at']
        read_only_fields = ['id', 'created_at']


class DigitalResourceSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.full_name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    resource_type_display = serializers.CharField(source='get_resource_type_display', read_only=True)
    file_size = serializers.SerializerMethodField()
    assignments = DigitalResourceAssignmentSerializer(many=True, read_only=True)
    target_type = serializers.CharField(write_only=True, required=False)
    target_students = serializers.ListField(child=serializers.UUIDField(), write_only=True, required=False)
    target_teachers = serializers.ListField(child=serializers.UUIDField(), write_only=True, required=False)
    target_classes = serializers.ListField(child=serializers.UUIDField(), write_only=True, required=False)

    class Meta:
        model = DigitalResource
        fields = '__all__'
        read_only_fields = ['id', 'uploaded_by', 'created_at', 'updated_at']

    def get_file_size(self, obj):
        try:
            return obj.file.size
        except Exception:
            return 0

    def create(self, validated_data):
        target_type = validated_data.pop('target_type', 'all')
        target_students = validated_data.pop('target_students', [])
        target_teachers = validated_data.pop('target_teachers', [])
        target_classes = validated_data.pop('target_classes', [])
        
        resource = super().create(validated_data)
        
        # Create assignments based on target type
        if target_type == 'all':
            DigitalResourceAssignment.objects.create(resource=resource, target_type='all')
        elif target_type == 'students':
            DigitalResourceAssignment.objects.create(resource=resource, target_type='students')
        elif target_type == 'teachers':
            DigitalResourceAssignment.objects.create(resource=resource, target_type='teachers')
        elif target_type == 'specific_students':
            for student_id in target_students:
                DigitalResourceAssignment.objects.create(resource=resource, target_type='specific_students', student_id=student_id)
        elif target_type == 'specific_teachers':
            for teacher_id in target_teachers:
                DigitalResourceAssignment.objects.create(resource=resource, target_type='specific_teachers', teacher_id=teacher_id)
        elif target_type == 'classes':
            for class_id in target_classes:
                DigitalResourceAssignment.objects.create(resource=resource, target_type='classes', class_fk_id=class_id)
        
        return resource
