@echo off
echo ========================================
echo Restarting EcoSphere Backend Server
echo ========================================
echo.

echo Step 1: Killing existing Node processes...
taskkill /F /IM node.exe 2>nul
if %errorlevel% equ 0 (
    echo    - Node processes killed
) else (
    echo    - No Node processes found
)
echo.

echo Step 2: Clearing Node module cache...
cd ecosphere-backend
if exist node_modules\.cache (
    rmdir /s /q node_modules\.cache
    echo    - Cache cleared
) else (
    echo    - No cache found
)
echo.

echo Step 3: Starting backend server...
echo    - Server will start on http://localhost:3001
echo    - Press Ctrl+C to stop the server
echo.
start "EcoSphere Backend" cmd /k "npm start"
echo    - Server started in new window
echo.

echo Step 4: Waiting for server to be ready...
timeout /t 3 /nobreak >nul
echo.

echo ========================================
echo Backend server restarted successfully!
echo ========================================
echo.
echo You can now test the API at:
echo http://localhost:3001/api/health
echo.
pause
