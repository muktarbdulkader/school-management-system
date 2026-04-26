from django.core.management.base import BaseCommand
from communication.models import GroupChat, GroupChatMember


class Command(BaseCommand):
    help = 'Fix existing group chats by adding creators as members'

    def handle(self, *args, **options):
        groups = GroupChat.objects.all()
        fixed_count = 0
        
        for group in groups:
            if group.created_by:
                member, created = GroupChatMember.objects.get_or_create(
                    group_chat=group,
                    user=group.created_by
                )
                if created:
                    self.stdout.write(
                        self.style.SUCCESS(f'Added {group.created_by.email} to group "{group.name}"')
                    )
                    fixed_count += 1
        
        if fixed_count == 0:
            self.stdout.write(self.style.WARNING('No groups needed fixing'))
        else:
            self.stdout.write(
                self.style.SUCCESS(f'Successfully fixed {fixed_count} group(s)')
            )
