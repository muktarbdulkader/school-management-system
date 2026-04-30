#!/bin/sh
set -e

echo "Running migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Creating roles..."
python manage.py create_roles || true

echo "Creating users..."
python manage.py create_users || true

PORT=${PORT:-10000}
echo "Starting gunicorn on port $PORT..."
exec gunicorn --bind 0.0.0.0:$PORT mald_sms.wsgi:application
