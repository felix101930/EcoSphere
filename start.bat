@echo off
echo ========================================
echo   Starting EcoSphere Application
echo ========================================
echo.

REM Add sqlcmd to PATH for database connectivity
echo [1/5] Setting up environment...
set "PATH=%PATH%;C:\Program Files\Microsoft SQL Server\Client SDK\ODBC\180\Tools\Binn"
set "PATH=%PATH%;C:\Program Files\Microsoft SQL Server\Client SDK\ODBC\170\Tools\Binn"
set "PATH=%PATH%;C:\Program Files\Microsoft SQL Server\160\Tools\Binn"
set "PATH=%PATH%;C:\Program Files\Microsoft SQL Server\Client SDK\ODBC\130\Tools\Binn"
echo Environment configured
timeout /t 1 /nobreak >nul

REM Clean up old processes
echo [2/5] Cleaning up old Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo Old processes terminated
) else (
    echo No old processes found
)
timeout /t 1 /nobreak >nul

REM Clean up ports (kills any process using ports 3001 and 5173)
echo [3/5] Cleaning up ports 3001 and 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do taskkill /F /PID %%a >nul 2>&1
echo Ports cleaned
timeout /t 1 /nobreak >nul

REM Start backend in a new terminal window
echo [4/5] Starting Backend Server...
start "EcoSphere Backend" cmd /k "cd /d "%~dp0ecosphere-backend" && npm start"

REM Wait for backend to initialize
echo Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

REM Start frontend in a new terminal window
echo [5/5] Starting Frontend Development Server...
start "EcoSphere Frontend" cmd /k "cd /d %~dp0ecosphere-frontend && npm run dev"

echo.
echo ========================================
echo   Services Starting...
echo ========================================
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:5173
echo.
echo Database: .\SQLEXPRESS (TestSlimDB)
echo.
echo Login Credentials:
echo   Email:    super.admin@edu.sait.ca
echo   Password: abcd1234
echo.
echo Test Endpoints:
echo   http://localhost:3001/api/health
echo   http://localhost:3001/api/db/test-connection
echo.
echo Press any key to exit this window...
pause >nul
