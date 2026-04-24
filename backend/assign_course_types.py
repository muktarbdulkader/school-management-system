#!/usr/bin/env python
"""
Script to assign course types to subjects that don't have one.
Run with: python manage.py shell < assign_course_types.py
"""

from api.academics.models import Subject, CourseType

# Get or create Core course type
core_type, created = CourseType.objects.get_or_create(
    name='Core',
    defaults={'description': 'Core curriculum subjects'}
)
print(f"Core type: {'Created' if created else 'Already exists'}")

# Also ensure Elective and Extra exist for future use
elective_type, _ = CourseType.objects.get_or_create(
    name='Elective',
    defaults={'description': 'Elective subjects students can choose'}
)
extra_type, _ = CourseType.objects.get_or_create(
    name='Extra',
    defaults={'description': 'Extra-curricular activities'}
)

# Find subjects without course type
subjects_without_type = Subject.objects.filter(course_type__isnull=True)
count = subjects_without_type.count()

if count == 0:
    print("All subjects already have course types assigned!")
else:
    print(f"\nFound {count} subjects without course type")
    print("\nAssigning all to 'Core' type...")
    
    # Assign Core type to all
    updated = subjects_without_type.update(course_type=core_type)
    print(f"✓ Successfully assigned 'Core' to {updated} subjects")

# Summary
print("\n" + "="*50)
print("SUMMARY:")
print("="*50)
total_subjects = Subject.objects.count()
core_count = Subject.objects.filter(course_type__name='Core').count()
elective_count = Subject.objects.filter(course_type__name='Elective').count()
extra_count = Subject.objects.filter(course_type__name='Extra').count()
no_type_count = Subject.objects.filter(course_type__isnull=True).count()

print(f"Total subjects: {total_subjects}")
print(f"  - Core: {core_count}")
print(f"  - Elective: {elective_count}")
print(f"  - Extra: {extra_count}")
print(f"  - No type: {no_type_count}")
