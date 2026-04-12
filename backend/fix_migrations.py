#!/usr/bin/env python
"""
Script to fix migration issues when database columns already exist.
This checks if columns exist and fakes migrations if they do.
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mald_sms.settings')
sys.path.insert(0, os.path.dirname(__file__))
django.setup()

from django.db import connection
from django.core.management import call_command


def check_column_exists(table_name, column_name):
    """Check if a column exists in a table"""
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name=%s AND column_name=%s
        """, [table_name, column_name])
        return cursor.fetchone() is not None


def check_table_exists(table_name):
    """Check if a table exists"""
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name=%s
        """, [table_name])
        return cursor.fetchone() is not None


def main():
    print("Checking database state...")
    
    # Check for problematic columns
    issues = []
    
    if check_table_exists('class_subject_teachers'):
        if check_column_exists('class_subject_teachers', 'section_id_id'):
            issues.append("class_subject_teachers.section_id_id exists")
        if check_column_exists('class_subject_teachers', 'subject_id_id'):
            issues.append("class_subject_teachers.subject_id_id exists")
    
    if check_table_exists('teachers_teacher'):
        if check_column_exists('teachers_teacher', 'teacher_id'):
            issues.append("teachers_teacher.teacher_id exists")
    
    if issues:
        print("\nFound existing columns that migrations want to add:")
        for issue in issues:
            print(f"  - {issue}")
        
        print("\nThese columns already exist in the database.")
        print("Running migrations with --fake-initial to skip creating existing tables...")
        
        try:
            # First, try to migrate with fake-initial
            call_command('migrate', '--fake-initial', verbosity=2)
            print("\n✓ Migrations completed successfully!")
        except Exception as e:
            print(f"\n✗ Migration failed: {e}")
            print("\nTrying to fake specific problematic migrations...")
            
            # If that fails, try faking specific migrations
            try:
                call_command('migrate', 'academics', '--fake', verbosity=2)
                call_command('migrate', 'teachers', '--fake', verbosity=2)
                call_command('migrate', verbosity=2)
                print("\n✓ Migrations completed with faking!")
            except Exception as e2:
                print(f"\n✗ Still failed: {e2}")
                return 1
    else:
        print("\nNo column conflicts detected. Running normal migration...")
        try:
            call_command('migrate', verbosity=2)
            print("\n✓ Migrations completed successfully!")
        except Exception as e:
            print(f"\n✗ Migration failed: {e}")
            return 1
    
    return 0


if __name__ == '__main__':
    sys.exit(main())
