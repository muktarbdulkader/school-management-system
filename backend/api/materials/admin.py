from django.contrib import admin

# Register your models here.
"""
Resource Request Admin Configuration
"""
from django.contrib import admin
from .models import ResourceRequest, ResourceRequestItem


class ResourceRequestItemInline(admin.TabularInline):
    model = ResourceRequestItem
    extra = 1
    fields = ['item_name', 'description', 'quantity', 'unit', 'estimated_unit_cost']


@admin.register(ResourceRequest)
class ResourceRequestAdmin(admin.ModelAdmin):
    list_display = ['title', 'request_type', 'priority', 'status', 'requested_by', 'created_at']
    list_filter = ['status', 'request_type', 'priority', 'created_at']
    search_fields = ['title', 'description', 'requested_by__full_name', 'department']
    readonly_fields = ['created_at', 'updated_at', 'completed_at']
    date_hierarchy = 'created_at'
    inlines = [ResourceRequestItemInline]

    fieldsets = (
        ('Request Information', {
            'fields': ('request_type', 'title', 'description', 'quantity', 'priority')
        }),
        ('Requester Details', {
            'fields': ('requested_by', 'department', 'needed_by')
        }),
        ('Status & Approval', {
            'fields': ('status', 'approved_by', 'rejection_reason', 'notes')
        }),
        ('Cost Information', {
            'fields': ('estimated_cost', 'actual_cost')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'completed_at'),
            'classes': ('collapse',)
        }),
    )

    def save_model(self, request, obj, form, change):
        if not change:
            obj.requested_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(ResourceRequestItem)
class ResourceRequestItemAdmin(admin.ModelAdmin):
    list_display = ['item_name', 'resource_request', 'quantity', 'unit', 'estimated_unit_cost']
    list_filter = ['resource_request__request_type']
    search_fields = ['item_name', 'description', 'resource_request__title']
