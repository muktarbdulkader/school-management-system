from rest_framework import serializers
from .models import TeacherRating

class TeacherRatingSerializer(serializers.ModelSerializer):
    parent_name = serializers.CharField(source='parent.user.full_name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.user.full_name', read_only=True)
    student_name = serializers.CharField(source='student.user.full_name', read_only=True)
    subject = serializers.CharField(source='teacher.subject.name', read_only=True)
    
    class Meta:
        model = TeacherRating
        fields = [
            'id', 'parent', 'parent_name', 'teacher', 'teacher_name', 
            'student', 'student_name', 'subject',
            'teaching_quality', 'communication', 'subject_knowledge', 
            'punctuality', 'behavior_management', 'overall_rating',
            'comment', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'overall_rating']

class TeacherRatingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeacherRating
        fields = [
            'teacher', 'student',
            'teaching_quality', 'communication', 'subject_knowledge', 
            'punctuality', 'behavior_management',
            'comment'
        ]
    
    def validate(self, data):
        # Validate that the student belongs to the parent (only if user is a parent)
        request = self.context['request']
        user = request.user
        
        # Skip parent validation for superadmins/staff without parent profiles
        if not hasattr(user, 'parent_profile'):
            return data
            
        parent = user.parent_profile
        from .models import ParentStudent
        if not ParentStudent.objects.filter(parent=parent, student=data['student']).exists():
            raise serializers.ValidationError("You can only rate teachers of your own children.")
        return data

class TeacherRatingStatsSerializer(serializers.Serializer):
    teacher_id = serializers.UUIDField()
    teacher_name = serializers.CharField()
    subject = serializers.CharField()
    average_rating = serializers.FloatField()
    total_ratings = serializers.IntegerField()
    rating_breakdown = serializers.DictField()
    recent_comments = serializers.ListField()
