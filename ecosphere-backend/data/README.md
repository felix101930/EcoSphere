# Backend Data Directory

## Purpose

This directory contains mock data files used by the backend in **production/Vercel deployment**.

In local development, the backend uses the root `mock-data/` directory instead.

## Files

- `users.json` - User accounts and authentication data
- `electricity.json` - Electricity consumption data (hourly records)
- `carbonFootprint.json` - Carbon footprint calculation history

## Important Notes

⚠️ **This is temporary mock data**

In production (Week 1-2 of full development), these files will be replaced with:
- SQL Server database
- Real-time data from GBTAC sensors
- Proper authentication system

## Vercel Deployment

Vercel's serverless environment requires data files to be within the deployment package.
That's why we have this copy of the mock data inside the backend directory.

## Synchronization

If you update the root `mock-data/` files during development, remember to copy them here before deploying to Vercel:

```bash
# Windows
Copy-Item "mock-data\*.json" "ecosphere-backend\data\"

# Linux/Mac
cp mock-data/*.json ecosphere-backend/data/
```

Or use the provided script (if available).
