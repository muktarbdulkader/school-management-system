import uuid
from django.db import models
from django.core.validators import FileExtensionValidator
from users.models import User, Role
from django.core.validators import MaxValueValidator, MinValueValidator

def chat_attachment_path(instance, filename):
    # Organize uploads by chat ID and timestamp
    return f'chat_attachments/{instance.id}/{filename}'

class Chat(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sender = models.ForeignKey(User, related_name='sent_messages', on_delete=models.CASCADE)
    receiver = models.ForeignKey(User, related_name='received_messages', on_delete=models.CASCADE)
    message = models.TextField()
    attachment = models.FileField(
        upload_to=chat_attachment_path,
        blank=True,
        null=True,
        validators=[FileExtensionValidator(
            allowed_extensions=['jpg', 'jpeg', 'png', 'gif', 'mp3', 'wav', 'mp4', 'mov', 'doc', 'docx', 'pdf', 'txt', 'zip', 'ppt', 'pptx', 'xls', 'xlsx']
        )]
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.sender.full_name} → {self.receiver.full_name}"

class GroupChat(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    created_by = models.ForeignKey(User, related_name='created_group_chats', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class GroupChatMember(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    group_chat = models.ForeignKey(GroupChat, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('group_chat', 'user')

    def __str__(self):
        return f"{self.user.full_name} in {self.group_chat.name}"

class GroupChatMessage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    group = models.ForeignKey(GroupChat, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.TextField()
    attachment = models.FileField(
        upload_to=chat_attachment_path,
        blank=True,
        null=True,
        validators=[FileExtensionValidator(
            allowed_extensions=['jpg', 'jpeg', 'png', 'gif', 'mp3', 'wav', 'mp4', 'mov', 'doc', 'docx', 'pdf', 'txt', 'zip', 'ppt', 'pptx', 'xls', 'xlsx']
        )]
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

class ParentFeedback(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    feedbacked = models.ForeignKey(User, on_delete=models.CASCADE)  
    parent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='feedbacks')
    subject = models.CharField(max_length=255)
    message = models.TextField()
    rating = models.PositiveIntegerField(blank=True, null=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)])
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.parent.full_name} - {self.subject}"


class Meeting(models.Model):
    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("resecheduled", "Rescheduled"),
        ("canceled", "Canceled"),
        ("rejected", "Rejected"),
        ("completed", "Completed"),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    requested_by = models.ForeignKey(User, related_name='meeting_requests', on_delete=models.CASCADE)
    requested_to = models.ForeignKey(User, related_name='meeting_invites', on_delete=models.CASCADE)
    requested_date = models.DateField()
    requested_time = models.TimeField()
    attchemnt = models.FileField(
        upload_to='meeting_attachments/', blank=True, null=True,
        validators=[FileExtensionValidator(
            allowed_extensions=['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'])]
        )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True)
    is_canceled = models.BooleanField(default=False)
    canceled_at = models.DateTimeField(null=True, blank=True)
    parent_comment = models.TextField(blank=True, null=True, help_text="Parent's feedback comment after the meeting")
    parent_rating = models.PositiveIntegerField(
        blank=True, null=True, 
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )

    def __str__(self):
        return f"{self.requested_by.full_name} → {self.requested_to.full_name}"

    def can_add_feedback(self):
        from django.utils import timezone
        return (self.status == "approved" and 
                timezone.now().date() > self.requested_date)

class Announcement(models.Model):
    class Urgency(models.TextChoices):
        LOW = 'LOW', 'Low'
        MEDIUM = 'MEDIUM', 'Medium'
        HIGH = 'HIGH', 'High'
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    message = models.TextField()
    event_date = models.DateField(default=None, null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    audience_roles = models.ManyToManyField(Role, related_name='announcements')
    urgency = models.CharField(
        max_length=20,
        choices=Urgency.choices,
        default=Urgency.LOW,
    )

    def __str__(self):
        return self.title

class Notification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    urgency = models.CharField(
        max_length=20,
        choices=Announcement.Urgency.choices,
        default=Announcement.Urgency.LOW,
    )

    def __str__(self):
        return f"{self.title} for {self.user.full_name}"

