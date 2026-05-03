from django.apps import AppConfig


class LibraryConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'library'
    
    def ready(self):
        # Import signal handlers
        from django.db.models.signals import post_save
        from users.models import UserRole
        from library.models import handle_user_role_assigned
        
        # Connect signal to auto-create LibraryMember when user gets a role
        post_save.connect(handle_user_role_assigned, sender=UserRole)
