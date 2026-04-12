@echo off
echo ========================================
echo   Fixing Admin Roles
echo ========================================
echo.

cd /d "%~dp0"

python quick_fix_roles.py

echo.
pause
