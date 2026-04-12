#!/bin/sh

echo "Waiting for PostgreSQL to be ready..."

# Wait until Postgres is ready
while ! nc -z "$DB_HOST" "$DB_PORT"; do
  sleep 1
done

echo "PostgreSQL is up - continuing..."

# Collect static files
python manage.py collectstatic --noinput

# Run migrations for contenttypes first (required for other apps)
python manage.py migrate contenttypes --noinput || true

# Run migrations for users app
python manage.py migrate users --noinput || true

# Run migrations for auth
python manage.py migrate auth --noinput || true

# Fix migration conflicts using our custom script
python fix_migrations.py || python manage.py migrate --fake-initial --noinput

# Create superuser if not exists
python manage.py shell < /app/create_superuser.py || true

# Start the Django server
python manage.py runserver 0.0.0.0:8000
