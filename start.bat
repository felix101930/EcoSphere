@echo off
echo ========================================
echo   Starting EcoSphere Application
echo ========================================
echo.

REM Add sqlcmd to PATH for database connectivity
echo [1/6] Setting up environment...
set "PATH=%PATH%;C:\Program Files\Microsoft SQL Server\Client SDK\ODBC\180\Tools\Binn"
set "PATH=%PATH%;C:\Program Files\Microsoft SQL Server\Client SDK\ODBC\170\Tools\Binn"
set "PATH=%PATH%;C:\Program Files\Microsoft SQL Server\160\Tools\Binn"
set "PATH=%PATH%;C:\Program Files\Microsoft SQL Server\Client SDK\ODBC\130\Tools\Binn"
echo Environment configured
timeout /t 1 /nobreak >nul

REM Check and install dependencies if needed
echo [2/6] Checking dependencies...
if not exist "%~dp0ecosphere-backend\node_modules" (
    echo Installing backend dependencies...
    cd /d "%~dp0ecosphere-backend"
    call npm install
    cd /d "%~dp0"
    echo Backend dependencies installed
) else (
    echo Backend dependencies already installed
)

if not exist "%~dp0ecosphere-frontend\node_modules" (
    echo Installing frontend dependencies...
    cd /d "%~dp0ecosphere-frontend"
    call npm install
    cd /d "%~dp0"
    echo Frontend dependencies installed
) else (
    echo Frontend dependencies already installed
)
timeout /t 1 /nobreak >nul

REM Clean up old processes
echo [3/6] Cleaning up old Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo Old processes terminated
) else (
    echo No old processes found
)
timeout /t 1 /nobreak >nul

REM Clean up ports (kills any process using ports 3001 and 5173)
echo [4/6] Cleaning up ports 3001 and 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do taskkill /F /PID %%a >nul 2>&1
echo Ports cleaned
timeout /t 1 /nobreak >nul

REM Start backend in a new terminal window
echo [5/6] Starting Backend Server...
start "EcoSphere Backend" cmd /k "cd /d "%~dp0ecosphere-backend" && echo. && echo ========================================== && echo    EcoSphere Backend Server && echo ========================================== && echo. && echo Backend running on: http://localhost:3001 && echo. && echo Test Endpoints: && echo   http://localhost:3001/api/health && echo   http://localhost:3001/api/db/test-connection && echo. && npm start"

REM Wait for backend to initialize
echo Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

REM Start frontend in a new terminal window
echo [6/6] Starting Frontend Development Server...
start "EcoSphere Frontend" cmd /k "cd /d %~dp0ecosphere-frontend && echo. && echo ========================================== && echo    EcoSphere Frontend Server && echo ========================================== && echo. && npm run dev"

echo.
echo ========================================
echo   Services Started Successfully!
echo ========================================
echo.
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
echo ========================================
echo   Two new windows have been opened:
echo   - EcoSphere Backend
echo   - EcoSphere Frontend
echo.
echo   You can Ctrl+Click the URLs in those
echo   windows to open them in your browser.
echo ========================================
echo.
echo Press any key to close this window...
pause >nul
