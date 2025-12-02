@echo off
REM Sync mock data from root to backend/data for Vercel deployment

echo Syncing mock data files...

copy "mock-data\users.json" "ecosphere-backend\data\users.json"
copy "mock-data\electricity.json" "ecosphere-backend\data\electricity.json"
copy "mock-data\carbonFootprint.json" "ecosphere-backend\data\carbonFootprint.json"
copy "mock-data\loginLogs.json" "ecosphere-backend\data\loginLogs.json"

echo.
echo Mock data synced successfully!
echo Ready for Vercel deployment.
pause
