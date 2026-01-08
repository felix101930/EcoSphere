@echo off
echo ========================================
echo EcoSphere Concurrent Load Test
echo ========================================
echo.
echo This will simulate 50 concurrent users
echo making requests to the backend.
echo.
echo Make sure the backend is running first!
echo Press Ctrl+C to cancel, or
pause

cd ecosphere-backend
node test-load.js

echo.
echo Test completed!
pause
