#!/bin/bash
set -e

echo "Running migrations..."
python manage.py migrate --noinput

echo "Creating roles..."
python manage.py create_roles --noinput || true

echo "Creating users..."
python manage.py create_users --noinput || true

echo "Starting gunicorn..."
exec gunicorn mald_sms.wsgi:application --config gunicorn_config.py
