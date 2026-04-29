from django.contrib import admin
from .models import AIRequest


@admin.register(AIRequest)
class AIRequestAdmin(admin.ModelAdmin):
    list_display = ['request_type', 'user', 'status', 'provider', 'created_at', 'completed_at']
    list_filter = ['request_type', 'status', 'provider', 'created_at']
    search_fields = ['user__email', 'input_text', 'output_text']
    readonly_fields = ['created_at', 'completed_at']
    ordering = ['-created_at']
