@echo off
echo ========================================
echo Natural Gas Performance Test
echo ========================================
echo.
echo Make sure the backend is running on port 3001
echo Press Ctrl+C to cancel, or
pause

cd ecosphere-backend
node scripts/test-natural-gas-performance.js

pause
