import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class AIRequest(models.Model):
    """Track AI API requests for monitoring and rate limiting"""
    REQUEST_TYPES = [
        ('grammar', 'Grammar Check'),
        ('summarize', 'Summarize'),
        ('explain', 'Explain'),
        ('generate', 'Generate Content'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_requests')
    request_type = models.CharField(max_length=20, choices=REQUEST_TYPES)
    input_text = models.TextField()
    output_text = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    provider = models.CharField(max_length=50, blank=True, null=True)
    tokens_used = models.IntegerField(null=True, blank=True)
    error_message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        db_table = 'ai_requests'
    
    def __str__(self):
        return f"{self.request_type} - {self.user.email} - {self.status}"
