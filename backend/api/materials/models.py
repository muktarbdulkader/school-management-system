from django.db import models

# Create your models here.
"""
Resource Request Models
"""
from django.db import models
import uuid


class ResourceRequest(models.Model):
    """
    Requests for supplies, exam duplication, and other resources
    """
    REQUEST_TYPE_CHOICES = (
        ('supplies', 'Office Supplies'),
        ('exam_duplication', 'Exam Duplication'),
        ('equipment', 'Equipment'),
        ('maintenance', 'Maintenance'),
        ('other', 'Other')
    )

    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled')
    )

    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent')
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    request_type = models.CharField(max_length=20, choices=REQUEST_TYPE_CHOICES)
    title = models.CharField(max_length=200)
    description = models.TextField()
    quantity = models.IntegerField(default=1)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    requested_by = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='resource_requests')
    approved_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_resource_requests')
    department = models.CharField(max_length=100, blank=True)

    estimated_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    actual_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    needed_by = models.DateField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    notes = models.TextField(blank=True)
    rejection_reason = models.TextField(blank=True)

    branch = models.ForeignKey('users.Branch', on_delete=models.SET_NULL, null=True, blank=True, related_name='resource_requests')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'resource_requests'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.get_request_type_display()} ({self.status})"


class ResourceRequestItem(models.Model):
    """
    Individual items in a resource request
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    resource_request = models.ForeignKey(ResourceRequest, on_delete=models.CASCADE, related_name='items')
    item_name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    quantity = models.IntegerField(default=1)
    unit = models.CharField(max_length=50, blank=True)
    estimated_unit_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    class Meta:
        db_table = 'resource_request_items'

    def __str__(self):
        return f"{self.item_name} x{self.quantity}"


class DigitalResource(models.Model):
    """
    Centralized resource sharing for audio, video, images, and documents
    """
    RESOURCE_TYPE_CHOICES = (
        ('audio', 'Audio File'),
        ('video', 'Video Content'),
        ('image', 'Image/Photo'),
        ('document', 'Document (PDF, Doc, Ppt)'),
        ('archive', 'Compressed Archive (Zip, Rar)'),
        ('other', 'Other Resource')
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    resource_type = models.CharField(max_length=20, choices=RESOURCE_TYPE_CHOICES)
    
    file = models.FileField(upload_to='resources/%Y/%m/')
    
    branch = models.ForeignKey('users.Branch', on_delete=models.CASCADE, related_name='digital_resources')
    uploaded_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='uploaded_resources')
    
    is_public = models.BooleanField(default=True, help_text="Visible for all authenticated users in the branch")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'digital_resources'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.get_resource_type_display()})"
