from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import GroupChat, GroupChatMember


@receiver(post_save, sender=GroupChat)
def add_creator_as_member(sender, instance, created, **kwargs):
    """
    Signal to automatically add the creator as a member when a GroupChat is created.
    This works for both API and Django Admin creation.
    """
    if created and instance.created_by:
        # Check if creator is already a member (avoid duplicates)
        GroupChatMember.objects.get_or_create(
            group_chat=instance,
            user=instance.created_by
        )
