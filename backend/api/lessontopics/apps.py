from django.apps import AppConfig


class LessonTopicsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'lessontopics'

    def ready(self):
        # Import signals to register them
        import lessontopics.signals
