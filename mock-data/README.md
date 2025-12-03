# Mock Data for Prototype Phase

⚠️ **IMPORTANT: This folder is TEMPORARY**

## Purpose
This folder contains mock data for the Prototype phase (Phase 3).
It simulates the real SQL Server database that will be used in production.

## Contents
- `users.json` - User accounts (Admin and TeamMember)
- `electricity.json` - Electricity consumption sensor data (16,838 records, 2024-01-01 to 2025-12-03)
- `carbonFootprint.json` - Carbon footprint historical records
- `carbonFootprintReports.json` - Carbon footprint report history
- `loginLogs.json` - User login history

## Data Update Tools
- `update-electricity-data.bat` - **Windows batch file to update electricity data** (double-click to run)
- `update-electricity-data.js` - Node.js script to append new hourly data
- `generate-electricity-data.js` - Original script to generate complete dataset
- `UPDATE_DATA_README.md` - Detailed documentation for update tools

## Usage
The backend API (`ecosphere-backend`) reads these JSON files to simulate database queries.

## File Structure

### users.json
```json
{
  "users": [
    {
      "id": 1,
      "firstName": "...",
      "lastName": "...",
      "email": "...",
      "password": "...",
      "role": "Admin",
      "permissions": []
    }
  ],
  "nextId": 2
}
```

### electricity.json (coming soon)
```json
{
  "data": [
    {
      "sequenceNumber": 1,
      "timestamp": "2024-01-01 00:00:00",
      "value": 2500.5,
      "unit": "kWh"
    }
  ]
}
```

### carbonFootprint.json (coming soon)
```json
{
  "history": [
    {
      "id": 1,
      "date": "2024-01",
      "electricityUsage": 75000,
      "carbonFootprint": 37500,
      "unit": "kg CO2"
    }
  ],
  "conversionFactor": 0.5
}
```

## Migration to Production

When connecting to the real SQL Server database:

### 1. Delete this entire folder
```bash
rm -rf mock-data/
```

### 2. Update backend to use SQL Server
- Modify `ecosphere-backend/services/*.js`
- Replace file read operations with SQL queries
- Update connection configuration

### 3. Data mapping
- `users.json` → `USERS` table
- `electricity.json` → `ELECTRICITY_SENSOR` table (or equivalent from 900+ tables)
- `carbonFootprint.json` → `CARBON_FOOTPRINT` table

## Notes
- This folder should NOT be committed to production repository
- Keep this data for reference or testing purposes
- Total database size in production: 100+ GB across 900+ tables
- Only ~30 tables will be used, but exact tables are TBD

## Created
- **Date**: 2025-11-28
- **Phase**: Prototype (Phase 3)
- **Status**: Temporary - Will be deleted after SQL Server integration

## Team
- Jessica, Felix, Sanbir, Xujun
