from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Attendance
from communication.models import Notification, Announcement, Chat
from students.models import ParentStudent
from users.models import User
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Attendance)
def notify_parents_on_absence(sender, instance, created, **kwargs):
    """
    Fulfills SRS Section 2: Parent Portal Alerts.
    Automatically notifies linked parents when a student is marked Absent or Late.
    Also creates a chat message for direct communication.
    """
    # Only notify for absence-related statuses
    if instance.status not in ['Absent', 'Late', 'Excused']:
        return
    
    try:
        student = instance.student
        
        # Get subject name from teacher assignment
        subject_name = "Unknown"
        if instance.teacher_assignment and instance.teacher_assignment.subject:
            subject_name = instance.teacher_assignment.subject.name
        
        # Find all parents linked to this student
        parent_links = ParentStudent.objects.filter(student=student)
        
        if not parent_links.exists():
            logger.warning(f"No parents found for student {student.id}")
            return
        
        # Get system user for automated messages (first superuser)
        system_user = User.objects.filter(is_superuser=True).first()
        
        for link in parent_links:
            parent = link.parent
            
            # Build message
            message = (
                f"Your child {student.user.full_name} was marked '{instance.status}' "
                f"for {subject_name} on {instance.date}."
            )
            if instance.notes:
                message += f"\nNotes: {instance.notes}"
            
            # Create notification
            notification = Notification.objects.create(
                user=parent,
                title=f"Attendance Alert: {student.user.full_name}",
                message=message,
                urgency=Announcement.Urgency.HIGH if instance.status == 'Absent' else Announcement.Urgency.MEDIUM
            )
            
            # Also create chat message if system user exists
            if system_user:
                # Check if already sent today (avoid duplicates)
                already_sent = Chat.objects.filter(
                    sender=system_user,
                    receiver=parent,
                    timestamp__date=instance.date,
                    message__contains=student.user.full_name
                ).exists()
                
                if not already_sent:
                    Chat.objects.create(
                        sender=system_user,
                        receiver=parent,
                        message=message,
                        is_read=False
                    )
                    logger.info(f"Absence chat sent to parent {parent.id}")
            
            logger.info(f"Absence notification sent to parent {parent.id} for student {student.id}")
            
    except Exception as e:
        logger.error(f"Failed to send absence notification: {e}")
