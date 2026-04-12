@echo off
echo ========================================
echo   Fixing Admin Roles
echo ========================================
echo.

cd /d "%~dp0"

echo Running fix_admin_roles command...
python manage.py fix_admin_roles

echo.
echo ========================================
echo   Done!
echo ========================================
pause
