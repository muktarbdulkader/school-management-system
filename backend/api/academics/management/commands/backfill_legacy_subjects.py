"""
Management command to backfill legacy Subject records for existing ClassSubject entries.
This ensures teacher assignments work with SubjectManagement subjects.
"""
from django.core.management.base import BaseCommand
from academics.models import ClassSubject, Subject


class Command(BaseCommand):
    help = 'Backfill legacy Subject records for ClassSubject entries that lack them'

    def handle(self, *args, **options):
        # Find ClassSubject records without a legacy subject
        class_subjects_without_subject = ClassSubject.objects.filter(
            subject__isnull=True,
            global_subject__isnull=False,
            is_active=True
        )

        created_count = 0
        linked_count = 0

        for cs in class_subjects_without_subject:
            try:
                # Check if a Subject already exists for this GlobalSubject
                existing_subject = Subject.objects.filter(
                    global_subject=cs.global_subject,
                    class_grade=cs.class_fk,
                ).first()

                if existing_subject:
                    # Link existing subject
                    cs.subject = existing_subject
                    cs.save(update_fields=['subject'])
                    linked_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'Linked existing subject "{existing_subject.name}" to ClassSubject {cs.id}'
                        )
                    )
                else:
                    # Create new legacy Subject
                    subject = Subject.objects.create(
                        name=cs.global_subject.name,
                        code=cs.subject_code or cs.global_subject.name[:3].upper(),
                        global_subject=cs.global_subject,
                        class_grade=cs.class_fk,
                        branch=cs.class_fk.branch if cs.class_fk else None,
                    )
                    cs.subject = subject
                    cs.save(update_fields=['subject'])
                    created_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'Created and linked subject "{subject.name}" ({subject.id}) to ClassSubject {cs.id}'
                        )
                    )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Error processing ClassSubject {cs.id}: {e}')
                )

        self.stdout.write(self.style.SUCCESS(
            f'\nDone! Created {created_count} new subjects, linked {linked_count} existing subjects.'
        ))
