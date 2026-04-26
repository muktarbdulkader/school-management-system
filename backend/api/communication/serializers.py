from rest_framework import serializers
from users.models import Role, User
from users.serializers import UserSerializer
from .models import Chat, GroupChatMessage, Meeting, Announcement, GroupChat, GroupChatMember, ParentFeedback, Notification

class ChatSerializer(serializers.ModelSerializer):
    sender = serializers.StringRelatedField(read_only=True)
    receiver = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        write_only=True
    )
    receiver_details = UserSerializer(source='receiver', read_only=True)
    attachment = serializers.FileField(required=False, allow_null=True)
    latest_message = serializers.CharField(source='message', read_only=True)
    last_timestamp = serializers.DateTimeField(source='timestamp', read_only=True)
    unread_count = serializers.SerializerMethodField()

    def get_unread_count(self, obj):
        user = self.context.get('request').user
        return Chat.objects.filter(
            receiver=user, sender=obj.sender if obj.receiver == user else obj.receiver,
            is_read=False
        ).count()

    class Meta:
        model = Chat
        fields = '__all__'
        read_only_fields = ['id', 'sender', 'timestamp', 'is_read', 'latest_message', 'last_timestamp', 'unread_count']

    @staticmethod
    def summarize_conversations(chats, user):
        # Group chats by the other user and get the latest per conversation
        conversations = {}
        for chat in chats:
            other_user = chat.receiver if chat.sender == user else chat.sender
            if other_user not in conversations or chat.timestamp > conversations[other_user].timestamp:
                conversations[other_user] = chat
        return conversations.values()

class UserSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'full_name']

class ConversationSummarySerializer(serializers.Serializer):
    id = serializers.SerializerMethodField()
    other_user = UserSummarySerializer()
    display_name = serializers.SerializerMethodField()
    latest_message = serializers.CharField()
    last_timestamp = serializers.DateTimeField()
    unread_count = serializers.SerializerMethodField()

    def get_id(self, obj):
        other_user = obj.get('other_user')
        return str(other_user.id) if other_user else None

    def get_display_name(self, obj):
        other_user = obj.get('other_user')
        return other_user.full_name if other_user else 'Unknown'

    def get_unread_count(self, obj):
        user = self.context.get('request').user
        other_user = obj.get('other_user')
        return Chat.objects.filter(
            receiver=user, sender=other_user, is_read=False
        ).count()

class MessageDetailSerializer(serializers.ModelSerializer):
    sender = serializers.StringRelatedField()
    sender_id = serializers.UUIDField(read_only=True)
    timestamp = serializers.DateTimeField()
    attachment = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = Chat
        fields = ['sender', 'sender_id', 'message', 'timestamp', 'attachment', 'is_read']


class MeetingSerializer(serializers.ModelSerializer):
    requested_by = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        write_only=True
    )
    requested_to = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        write_only=True
    )
    requested_by_details = UserSerializer(source='requested_by', read_only=True)
    requested_to_details = UserSerializer(source='requested_to', read_only=True)
    branch_id = serializers.CharField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Meeting
        fields = ['id', 'requested_by', 'requested_to', 'requested_by_details',
                'requested_to_details', 'requested_date', 'requested_time',
                'status', 'notes', 'is_canceled', 'canceled_at', 'parent_comment', 'parent_rating', 'branch_id']
        read_only_fields = ['id', 'requested_by_details', 'requested_to_details',
                            'is_canceled', 'canceled_at']

    def validate(self, data):
        request_user = self.context.get('request').user if self.context.get('request') else None

        # Prevent requesting a meeting with oneself during creation
        if not self.instance:
            req_by = data.get('requested_by')
            req_to = data.get('requested_to')
            if req_by and req_to and req_by == req_to:
                raise serializers.ValidationError({"requested_to": "You cannot request a meeting with yourself."})

        # Prevent requester from approving/rejecting their own request
        if self.instance and 'status' in data:
            if data['status'] != self.instance.status:
                if data['status'] in ['approved', 'rejected', 'completed']:
                    if request_user and request_user == self.instance.requested_by and not request_user.is_superuser:
                        raise serializers.ValidationError({"status": "You cannot approve or reject your own meeting request."})

        if self.instance and self.instance.is_canceled:
            raise serializers.ValidationError("Cannot modify a canceled meeting.")
            
        if 'parent_comment' in data or 'parent_rating' in data:
            if not self.instance.can_add_feedback():
                raise serializers.ValidationError("Feedback can only be added after the approved meeting date.")
            if request_user != self.instance.requested_by:
                raise serializers.ValidationError("Only the requesting parent can add feedback.")
        return data

    def update(self, instance, validated_data):
        if 'parent_comment' in validated_data or 'parent_rating' in validated_data:
            if not instance.can_add_feedback():
                raise serializers.ValidationError("Feedback can only be added after the approved meeting date.")
            if self.context['request'].user != instance.requested_by:
                raise serializers.ValidationError("Only the requesting parent can add feedback.")
        return super().update(instance, validated_data)


class AnnouncementSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField(read_only=True)
    audience_roles = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(),
        many=True,
        required=False,
        allow_empty=True,
    )
    audience_roles_names = serializers.SerializerMethodField()

    def to_internal_value(self, data):
        if 'audience_roles' in data:
            if isinstance(data['audience_roles'], str):
                try:
                    role = Role.objects.get(name__iexact=data['audience_roles'])
                    data['audience_roles'] = [role.pk]  
                except Role.DoesNotExist:
                    raise serializers.ValidationError({"audience_roles": f"Role '{data['audience_roles']}' does not exist"})
            elif isinstance(data['audience_roles'], list):
                roles = []
                for item in data['audience_roles']:
                    if isinstance(item, str):
                        try:
                            role = Role.objects.get(name__iexact=item)
                            roles.append(role.pk)  
                        except Role.DoesNotExist:
                            raise serializers.ValidationError({"audience_roles": f"Role '{item}' does not exist"})
                    else:
                        roles.append(item) 
                data['audience_roles'] = roles
        return super().to_internal_value(data)

    def validate_audience_roles(self, value):
        if not value:
            return value
        return value

    def get_audience_roles_names(self, obj):
        return [role.name for role in obj.audience_roles.all()] if obj.audience_roles.exists() else []

    class Meta:
        model = Announcement
        fields = '__all__'

class GroupChatSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField(read_only=True)
    class Meta:
        model = GroupChat
        fields = '__all__'

class GroupChatMemberSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), write_only=True)
    user_details = UserSerializer(source='user', read_only=True)
    group_chat = serializers.PrimaryKeyRelatedField(queryset=GroupChat.objects.all(), write_only=True)
    group_chat_details = GroupChatSerializer(source = 'group_chat', read_only=True)
    class Meta:
        model = GroupChatMember
        fields = '__all__'

class GroupChatMessageSerializer(serializers.ModelSerializer):
    sender = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        write_only=True
    )
    sender_details = UserSerializer(source='sender', read_only=True)
    group = serializers.PrimaryKeyRelatedField(
        queryset=GroupChat.objects.all(),
        write_only=True
    )
    group_details = GroupChatSerializer(source='group', read_only=True)
    class Meta:
        model = GroupChatMessage
        fields = '__all__'
        read_only_fields = ['id', 'sender', 'timestamp']

class GroupChatConversationSummarySerializer(serializers.Serializer):
    group = GroupChatSerializer()
    latest_message = serializers.CharField()
    last_timestamp = serializers.DateTimeField()
    unread_count = serializers.SerializerMethodField()
    member_count = serializers.IntegerField()

    def get_unread_count(self, obj):
        user = self.context.get('request').user
        group_id = obj['group'].id
        return GroupChatMessage.objects.filter(
            group_id=group_id,  
            group__members__user=user,
            is_read=False
        ).count()

class GroupChatMessageDetailSerializer(serializers.ModelSerializer):
    sender = serializers.StringRelatedField()
    sender_id = serializers.UUIDField(read_only=True)
    timestamp = serializers.DateTimeField()
    attachment = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = GroupChatMessage
        fields = ['sender', 'sender_id', 'message', 'timestamp', 'attachment']
class ParentFeedbackSerializer(serializers.ModelSerializer):
    feedbacked = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        write_only=True
    )
    feedbacked_detail = UserSerializer(source='feedbacked', read_only=True)
    parent = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        write_only=True
    )
    parent_detail = UserSerializer(source='parent', read_only=True)
    rating = serializers.IntegerField(min_value=1, max_value=5)  # Validate rating range

    class Meta:
        model = ParentFeedback
        fields = '__all__'

    def validate(self, data):
        if 'rating' in data and not 1 <= data['rating'] <= 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return data

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
