"""
Resource Request Serializers
"""
from rest_framework import serializers
from .models import ResourceRequest, ResourceRequestItem, DigitalResource


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


class DigitalResourceSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.full_name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    resource_type_display = serializers.CharField(source='get_resource_type_display', read_only=True)
    file_size = serializers.SerializerMethodField()

    class Meta:
        model = DigitalResource
        fields = '__all__'
        read_only_fields = ['id', 'uploaded_by', 'created_at', 'updated_at']

    def get_file_size(self, obj):
        try:
            return obj.file.size
        except Exception:
            return 0
