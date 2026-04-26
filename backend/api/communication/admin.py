from django.contrib import admin
from django.contrib.contenttypes.models import ContentType
from users.models import RolePermission
from .models import Chat, GroupChatMessage, Meeting, Announcement, GroupChat, GroupChatMember, ParentFeedback

@admin.register(Chat)
class ChatAdmin(admin.ModelAdmin):
    list_display = ('id', 'sender', 'receiver', 'timestamp', 'is_read')
    search_fields = ('id', 'sender', 'receiver')
    list_filter = ('is_read', )

@admin.register(Meeting)
class MeetingAdmin(admin.ModelAdmin):
    list_display = ('id', 'requested_by', 'requested_to', 'requested_date', 'requested_time', 'status')
    search_fields = ('id', 'requested_by', 'requested_to')
    list_filter = ('status', 'requested_date')

@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'created_by', 'created_at', 'urgency', 'get_audience_roles')
    list_filter = ('urgency', 'created_at', 'audience_roles')
    search_fields = ('title', 'message', 'created_by__full_name')
    ordering = ('-created_at',)
    filter_horizontal = ('audience_roles',)

    def get_audience_roles(self, obj):
        return ", ".join([role.name for role in obj.audience_roles.all()])
    get_audience_roles.short_description = 'Audience Roles'

@admin.register(GroupChat)
class GroupChatAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'created_by', 'created_at')
    search_fields = ('id', 'name', 'created_by')
    
    def save_model(self, request, obj, form, change):
        # Set created_by if not already set
        if not obj.created_by:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
        
        # Auto-add creator as member after save
        if not change:  # Only on create, not update
            GroupChatMember.objects.get_or_create(group_chat=obj, user=obj.created_by)

@admin.register(GroupChatMember)
class GroupChatMemberAdmin(admin.ModelAdmin):
    list_display = ('id', 'group_chat', 'user', 'joined_at')
    search_fields = ('id', 'group_chat', 'user')

@admin.register(GroupChatMessage)
class GroupChatMessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'group', 'sender', 'timestamp')
    search_fields = ('id', 'group', 'sender')

@admin.register(ParentFeedback)
class ParentFeedbackAdmin(admin.ModelAdmin):
    list_display = ('id', 'feedbacked', 'parent', 'submitted_at')
    search_fields = ('id', 'feedbacked', 'parent')