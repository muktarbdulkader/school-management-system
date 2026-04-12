@echo off
echo ========================================
echo Testing Resource Requests API
echo ========================================
echo.

echo Testing if backend is running...
curl -s http://localhost:8000/api/materials/resource-requests/ -H "Content-Type: application/json" || echo ERROR: Backend not responding!
echo.
echo.

echo If you see HTML or JSON above, the backend is running.
echo If you see an error, start the backend with START_BACKEND.bat
echo.

pause
