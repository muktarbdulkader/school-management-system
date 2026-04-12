from django.db.models.signals import post_save
from django.dispatch import receiver
from students.models import Student, StudentSubject
from academics.models import Subject
from django.utils import timezone

@receiver(post_save, sender=Student)
def enroll_core_subjects(sender, instance, created, **kwargs):
    if created:
        core_subjects = Subject.objects.filter(course_type__name='core')
        for subject in core_subjects:
            StudentSubject.objects.create(
                student=instance,
                subject=subject,
                enrolled_on=timezone.now().date()
            )