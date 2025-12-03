@echo off
REM Sync mock data from root to backend/data for Vercel deployment

title Sync Mock Data
color 0B

echo.
echo ========================================
echo   Sync Mock Data for Vercel
echo ========================================
echo.
echo Copying files from mock-data/ to
echo ecosphere-backend/data/
echo.
echo ========================================
echo.

echo [1/4] Syncing users.json...
copy "mock-data\users.json" "ecosphere-backend\data\users.json" >nul
if %ERRORLEVEL% EQU 0 (echo      Done!) else (echo      Failed!)

echo [2/4] Syncing electricity.json...
copy "mock-data\electricity.json" "ecosphere-backend\data\electricity.json" >nul
if %ERRORLEVEL% EQU 0 (echo      Done!) else (echo      Failed!)

echo [3/4] Syncing carbonFootprint.json...
copy "mock-data\carbonFootprint.json" "ecosphere-backend\data\carbonFootprint.json" >nul
if %ERRORLEVEL% EQU 0 (echo      Done!) else (echo      Failed!)

echo [4/4] Syncing loginLogs.json...
copy "mock-data\loginLogs.json" "ecosphere-backend\data\loginLogs.json" >nul
if %ERRORLEVEL% EQU 0 (echo      Done!) else (echo      Failed!)

echo.
echo Note: carbonFootprintReports.json is stored
echo directly in backend/data/ (not synced)

echo.
echo ========================================
echo   Sync completed successfully!
echo ========================================
echo.
echo All mock data files are now ready for
echo Vercel deployment.
echo.
pause
