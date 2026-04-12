from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Attendance
from communication.models import Notification, Announcement
from students.models import ParentStudent

@receiver(post_save, sender=Attendance)
def notify_parents_on_absence(sender, instance, created, **kwargs):
    """
    Fulfills SRS Section 2: Parent Portal Alerts.
    Automatically notifies linked parents when a student is marked Absent or Late.
    """
    if instance.status in ['Absent', 'Late']:
        student = instance.student_id
        # Find all parents linked to this student
        parent_links = ParentStudent.objects.filter(student=student)
        
        for link in parent_links:
            parent_user = link.parent.user
            
            # Create a high-priority notification for the parent
            Notification.objects.create(
                user=parent_user,
                title=f"Urgent: Attendance Alert for {student.user.full_name}",
                message=f"Your child, {student.user.full_name}, was marked as '{instance.status}' for {instance.subject_id.name} on {instance.date}.",
                urgency=Announcement.Urgency.HIGH
            )
