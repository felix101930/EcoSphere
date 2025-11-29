@echo off
echo Starting EcoSphere Application...
echo.

REM Start backend in a new terminal window
start "EcoSphere Backend" cmd /k "cd ecosphere-backend && npm start"

REM Wait a moment before starting frontend
timeout /t 2 /nobreak >nul

REM Start frontend in a new terminal window
start "EcoSphere Frontend" cmd /k "cd ecosphere-frontend && npm run dev"

echo.
echo Both services are starting...
echo Backend: http://localhost:3000 (or your configured port)
echo Frontend: http://localhost:5173 (or your configured port)
echo.
