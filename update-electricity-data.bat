@echo off
REM ========================================
REM GBTAC Electricity Data Updater
REM ========================================
REM This script updates electricity.json with new data
REM from the last record to current time (hourly)
REM ========================================

title GBTAC Electricity Data Updater
color 0A

echo.
echo ========================================
echo   GBTAC Electricity Data Updater
echo ========================================
echo.
echo This tool will update electricity.json
echo with new hourly data from the last
echo record to current time.
echo.
echo ========================================
echo.

REM Check if Node.js is installed
echo [1/3] Checking Node.js installation...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo.
    echo ERROR: Node.js is not installed or not in PATH!
    echo.
    echo Please install Node.js from:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo      Node.js found!
echo.

REM Check if electricity.json exists
echo [2/3] Checking electricity.json...
if not exist "mock-data\electricity.json" (
    color 0C
    echo.
    echo ERROR: electricity.json not found!
    echo.
    echo Please run generate-electricity-data.js first
    echo to create the initial data file.
    echo.
    pause
    exit /b 1
)
echo      File found!
echo.

REM Run the update script
echo [3/3] Running update script...
echo.
echo ----------------------------------------
node mock-data\update-electricity-data.js
echo ----------------------------------------

REM Check if script succeeded
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   Update completed successfully!
    echo ========================================
    echo.
    echo You can now use the updated data in
    echo the Carbon Footprint Calculator.
) else (
    color 0C
    echo.
    echo ========================================
    echo   Update failed!
    echo ========================================
    echo.
    echo Please check the error message above.
)

echo.
echo Press any key to close this window...
pause >nul
