#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Installing dependencies..."
python -m pip install --upgrade pip
pip install --prefer-binary -r requirements.txt

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Cleaning up stale migration records..."
python -c "
import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mald_sms.settings')
django.setup()
from django.db import connection

stale_migrations = [
    ('users', '0002_librarianprofile'),
    ('academics', '0003_add_subject_section_to_classsubjectteacher'),
    ('academics', '0004_alter_classelectiveoffering_subject_id_and_more'),
    ('academics', '0005_fix_duplicate_columns'),
    ('teachers', '0003_teachermetrics_teacherperformancerating_and_more'),
    ('teachers', '0003_teacher_branch'),
    ('teachers', '0007_merge_0003_teacher_branch_0006_teacher_branch'),
    ('tasks', '0002_employeetask_fiscalyear_employeesubtask_kpiplan_and_more'),
    ('tasks', '0003_merge_20260403_1553'),
    ('library', '0002_book_added_by'),
    ('library', '0003_merge_0002_book_added_by_0002_initial'),
    ('lessontopics', '0002_add_created_by_to_objective_models'),
    ('lessontopics', '0003_add_unit_progress_tracking'),
    ('lessontopics', '0004_merge_0002_initial_0003_add_unit_progress_tracking')
]

with connection.cursor() as cursor:
    for app, name in stale_migrations:
        cursor.execute(\"DELETE FROM django_migrations WHERE app=%s AND name=%s\", [app, name])
    print(f'Cleaned up {len(stale_migrations)} stale migration records')
" || echo "No cleanup needed"

echo "Running migrations in correct order..."
echo "Step 1: Migrating contenttypes..."
python manage.py migrate contenttypes --noinput

echo "Step 2: Migrating users..."
python manage.py migrate users --noinput

echo "Step 3: Migrating auth..."
python manage.py migrate auth --noinput

echo "Step 4: Migrating all remaining apps..."
python manage.py migrate --noinput

echo "Build complete!"
