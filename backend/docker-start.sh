#!/bin/sh
set -e

echo "PORT env var: $PORT"
echo "Current directory: $(pwd)"
echo "Python version: $(python --version)"

echo "Running migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Creating roles..."
python manage.py create_roles || echo "Role creation had issues but continuing"

echo "Creating users..."
python manage.py create_users || echo "User creation had issues but continuing"

PORT=${PORT:-10000}
echo "Starting gunicorn on port $PORT..."
exec gunicorn --bind 0.0.0.0:$PORT --timeout 30 --workers 1 --log-level debug mald_sms.wsgi:application
