from rest_framework import serializers
from .models import AIRequest


class GrammarCheckRequestSerializer(serializers.Serializer):
    text = serializers.CharField(required=True, min_length=1, max_length=10000)
    language = serializers.CharField(required=False, default='en', max_length=10)
    

class GrammarCheckResponseSerializer(serializers.Serializer):
    original_text = serializers.CharField()
    corrected_text = serializers.CharField()
    suggestions = serializers.ListField(child=serializers.DictField(), required=False)
    errors_found = serializers.IntegerField()
    

class SummarizeRequestSerializer(serializers.Serializer):
    text = serializers.CharField(required=True, min_length=10, max_length=50000)
    max_length = serializers.IntegerField(required=False, default=150, min_value=50, max_value=500)
    style = serializers.ChoiceField(
        choices=['concise', 'detailed', 'bullet_points', 'key_points'],
        required=False,
        default='concise'
    )


class SummarizeResponseSerializer(serializers.Serializer):
    original_length = serializers.IntegerField()
    summary = serializers.CharField()
    summary_length = serializers.IntegerField()
    compression_ratio = serializers.FloatField()
    

class ExplainRequestSerializer(serializers.Serializer):
    text = serializers.CharField(required=True, min_length=1, max_length=20000)
    audience = serializers.ChoiceField(
        choices=['beginner', 'intermediate', 'expert'],
        required=False,
        default='intermediate'
    )
    format = serializers.ChoiceField(
        choices=['paragraph', 'steps', 'analogy'],
        required=False,
        default='paragraph'
    )


class BatchSummarizeRequestSerializer(serializers.Serializer):
    items = serializers.ListField(
        child=serializers.DictField(),
        required=True,
        min_length=1,
        max_length=50
    )
    summary_type = serializers.ChoiceField(
        choices=['overview', 'trends', 'comparison', 'key_insights'],
        required=False,
        default='overview'
    )


class BatchSummaryResponseSerializer(serializers.Serializer):
    data_count = serializers.IntegerField()
    summary = serializers.CharField()
    key_insights = serializers.ListField(child=serializers.CharField(), required=False)


class AIRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIRequest
        fields = ['id', 'request_type', 'status', 'created_at', 'completed_at']
        read_only_fields = fields
