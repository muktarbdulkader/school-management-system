#!/usr/bin/env python
"""
Create default Slot Types for the schedule system.
Run this script to initialize slot types if none exist.
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mald_sms.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from schedule.models import SlotType

def create_default_slot_types():
    """Create default slot types for the school schedule"""
    
    default_types = [
        {
            'name': 'Regular Class',
            'description': 'Standard teaching period'
        },
        {
            'name': 'Lab Session',
            'description': 'Practical laboratory session'
        },
        {
            'name': 'Break',
            'description': 'Recess or lunch break'
        },
        {
            'name': 'Assembly',
            'description': 'School assembly or gathering'
        },
        {
            'name': 'Club Activity',
            'description': 'Extra-curricular club meeting'
        },
        {
            'name': 'Sports',
            'description': 'Physical education or sports'
        },
        {
            'name': 'Study Hall',
            'description': 'Self-study or homework period'
        },
        {
            'name': 'Exam',
            'description': 'Examination or test period'
        }
    ]
    
    created_count = 0
    for slot_type_data in default_types:
        slot_type, created = SlotType.objects.get_or_create(
            name=slot_type_data['name'],
            defaults={'description': slot_type_data['description']}
        )
        if created:
            print(f"Created: {slot_type.name}")
            created_count += 1
        else:
            print(f"Already exists: {slot_type.name}")
    
    print(f"\nTotal slot types created: {created_count}")
    print(f"Total slot types in database: {SlotType.objects.count()}")

if __name__ == '__main__':
    print("Creating default slot types...\n")
    create_default_slot_types()
    print("\nDone! You can now create schedule slots.")
