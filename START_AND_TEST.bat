@echo off
echo ========================================
echo   School Management System
echo   Complete Startup and Test Guide
echo ========================================
echo.

:MENU
echo What would you like to do?
echo.
echo 1. Start Backend Server (Django)
echo 2. Start Frontend Server (React)
echo 3. Test Backend API
echo 4. Run Backend Migrations
echo 5. Create Sample Data (Roles and Users)
echo 6. Check System Status
echo 7. View Logs
echo 8. Stop All Servers
echo 9. Exit
echo.

set /p choice="Enter your choice (1-9): "

if "%choice%"=="1" goto START_BACKEND
if "%choice%"=="2" goto START_FRONTEND
if "%choice%"=="3" goto TEST_API
if "%choice%"=="4" goto RUN_MIGRATIONS
if "%choice%"=="5" goto CREATE_DATA
if "%choice%"=="6" goto CHECK_STATUS
if "%choice%"=="7" goto VIEW_LOGS
if "%choice%"=="8" goto STOP_SERVERS
if "%choice%"=="9" goto END

echo Invalid choice! Please try again.
echo.
goto MENU

:START_BACKEND
echo.
echo ========================================
echo   Starting Django Backend Server
echo ========================================
echo.
cd backend
echo Activating virtual environment...
call venv\Scripts\activate
echo.
echo Starting server at http://localhost:8000
echo Press Ctrl+C to stop
echo.
python manage.py runserver
cd ..
pause
goto MENU

:START_FRONTEND
echo.
echo ========================================
echo   Starting React Frontend Server
echo ========================================
echo.
cd frontend
echo.
echo Starting server at http://localhost:3000
echo Press Ctrl+C to stop
echo.
npm run dev
cd ..
pause
goto MENU

:TEST_API
echo.
echo ========================================
echo   Testing Backend API
echo ========================================
echo.
echo Testing if backend is running...
curl -s http://localhost:8000/api/ 2>nul
if errorlevel 1 (
    echo ❌ Backend is NOT running!
    echo Please start the backend first (Option 1)
) else (
    echo ✓ Backend is running!
    echo.
    echo Testing Resource Requests endpoint...
    curl -s http://localhost:8000/api/materials/resource-requests/ 2>nul
    if errorlevel 1 (
        echo ❌ Resource Requests endpoint not accessible
    ) else (
        echo ✓ Resource Requests endpoint is accessible!
    )
)
echo.
pause
goto MENU

:RUN_MIGRATIONS
echo.
echo ========================================
echo   Running Database Migrations
echo ========================================
echo.
cd backend
call venv\Scripts\activate
echo.
echo Running migrations...
python manage.py migrate
echo.
echo ✓ Migrations complete!
cd ..
pause
goto MENU

:CREATE_DATA
echo.
echo ========================================
echo   Creating Sample Data
echo ========================================
echo.
cd backend
call venv\Scripts\activate
echo.
echo Creating roles...
python manage.py create_roles
echo.
echo Creating sample users...
python manage.py create_users
echo.
echo ✓ Sample data created!
echo.
echo Default credentials:
echo Super Admin: superadmin@school.com / Admin@123
echo Admin: admin@school.com / Admin@123
echo Teacher: teacher@school.com / Teacher@123
echo Student: student@school.com / Student@123
echo Parent: parent@school.com / Parent@123
echo.
cd ..
pause
goto MENU

:CHECK_STATUS
echo.
echo ========================================
echo   System Status Check
echo ========================================
echo.
echo Checking Backend (Port 8000)...
netstat -an | findstr ":8000" >nul
if errorlevel 1 (
    echo ❌ Backend NOT running
) else (
    echo ✓ Backend is running on port 8000
)
echo.
echo Checking Frontend (Port 3000)...
netstat -an | findstr ":3000" >nul
if errorlevel 1 (
    echo ❌ Frontend NOT running
) else (
    echo ✓ Frontend is running on port 3000
)
echo.
echo Checking Database Connection...
cd backend
call venv\Scripts\activate
python -c "import django; import os; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mald_sms.settings'); django.setup(); from django.db import connection; connection.ensure_connection(); print('✓ Database connected')" 2>nul
if errorlevel 1 (
    echo ❌ Database connection failed
) else (
    echo ✓ Database is connected
)
cd ..
echo.
pause
goto MENU

:VIEW_LOGS
echo.
echo ========================================
echo   View Logs
echo ========================================
echo.
echo 1. Backend logs
echo 2. Frontend logs
echo 3. Back to menu
echo.
set /p logchoice="Enter choice: "
if "%logchoice%"=="1" (
    if exist backend\logs\django.log (
        type backend\logs\django.log
    ) else (
        echo No backend logs found
    )
)
if "%logchoice%"=="2" (
    if exist frontend\logs\npm.log (
        type frontend\logs\npm.log
    ) else (
        echo No frontend logs found
    )
)
pause
goto MENU

:STOP_SERVERS
echo.
echo ========================================
echo   Stopping All Servers
echo ========================================
echo.
echo Stopping processes on port 8000 (Backend)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000"') do taskkill /F /PID %%a 2>nul
echo.
echo Stopping processes on port 3000 (Frontend)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000"') do taskkill /F /PID %%a 2>nul
echo.
echo ✓ Servers stopped
pause
goto MENU

:END
echo.
echo ========================================
echo   Thank you for using SMS!
echo ========================================
echo.
echo Quick Start:
echo 1. Run migrations (Option 4)
echo 2. Create sample data (Option 5)
echo 3. Start backend (Option 1) - in one terminal
echo 4. Start frontend (Option 2) - in another terminal
echo 5. Open http://localhost:3000 in browser
echo.
pause
exit
