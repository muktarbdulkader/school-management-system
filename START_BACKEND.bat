@echo off
echo ========================================
echo Starting Django Backend Server
echo ========================================
echo.

cd backend

echo Checking Python version...
python --version
echo.

echo Starting Django development server...
echo Server will be available at: http://localhost:8000
echo API endpoint: http://localhost:8000/api/materials/resource-requests/
echo.
echo Press Ctrl+C to stop the server
echo.

python manage.py runserver

pause
