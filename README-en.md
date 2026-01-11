## Quick Start

### 1. Clone the Project

```bash
git clone <repository-url>
cd Capstone
```

### 2. Install Dependencies

#### Install Backend Dependencies

```bash
cd ecosphere-backend
npm install
cd ..
```

#### Install Frontend Dependencies

```bash
cd ecosphere-frontend
npm install
cd ..
```

### 3. Configure Database Connection

Edit `ecosphere-backend/.env` file to configure your SQL Server database:

```env
# SQL Server Configuration
DB_SERVER=.\SQLEXPRESS        # Database server address (use .\SQLEXPRESS for SQL Server Express)
DB_DATABASE=TestSlimDB        # Database name

# If using SQL Server Authentication, uncomment and fill in:
# DB_USER=your_username
# DB_PASSWORD=your_password

# If using Windows Authentication (default), no need to set username and password
```

**Important Notes**:

- Default uses **Windows Authentication** (no username/password needed)
- For SQL Server Express, use `.\SQLEXPRESS` as the server name
- If your database uses SQL Server Authentication, set `DB_USER` and `DB_PASSWORD`
- Ensure SQL Server is running and accessible
- Table name format: `SaitSolarLab_<sensor_id>` (e.g., `SaitSolarLab_20004_TL2`)
- **ODBC Driver 18 Requirement**: If using sqlcmd version 18+, add `-C` flag to trust server certificate

**Test Database Connection**:

```bash
# Test connection in command line (with ODBC Driver 18)
sqlcmd -S .\SQLEXPRESS -E -d TestSlimDB -C -Q "SELECT TOP 5 * FROM SaitSolarLab_20004_TL2"

# If using older sqlcmd version (without -C flag)
sqlcmd -S .\SQLEXPRESS -E -d TestSlimDB -Q "SELECT TOP 5 * FROM SaitSolarLab_20004_TL2"
```

### 4. Start the Application

**In the project root directory**, double-click to run:

```
start.bat
```

This will automatically start both backend and frontend servers.

### 5. Access the Application

Open in browser: **http://localhost:5173**

**Login Credentials**:

- Email: `super.admin@edu.sait.ca`
- Password: `abcd1234`

---

## Local Development

### Why Local Development?

✅ **Advantages**:

- Real-time data from SQL Server database
- No need to wait for Vercel deployment
- More convenient for development and testing
- Full control over data and configuration

### Daily Usage Workflow

#### Start Application

**Double-click to run**:

```
start.bat
```

- Automatically starts backend (port 3001)
- Automatically starts frontend (port 5174)
- Automatically opens browser

#### Use Application

- Open http://localhost:5174
- Login with test account
- Start using features

#### Stop Application

- Close both command line windows
- Or press `Ctrl + C` in each window

---

## Vercel Deployment

### Pre-Deployment Preparation

1. **Commit to Git**:

   ```bash
   git add .
   git commit -m "Update for deployment"
   git push
   ```
2. **Wait for Vercel Auto-Deployment**

   - Login to Vercel to check deployment status
   - Access the URL provided by Vercel after deployment completes

**Note**: Vercel deployment uses SQL Server database connection. Ensure database is accessible from Vercel servers.

---

## Test Accounts

### Admin Account (Administrator)

- **Email**: `admin.admin@edu.sait.ca`
- **Password**: `abcd1234`
- **Permissions**:
  - User Management (add, edit, delete users)
  - View login logs
  - All Dashboard features
  - Carbon Footprint Calculator
  - Report generation and history

### TeamMember Account (Team Member)

- Must be created through Admin account
- Can be assigned the following permissions:
  - Electricity Dashboard
  - Water Dashboard
  - Thermal Dashboard
  - 3D Model
  - Carbon Footprint Calculator

**Steps to Create TeamMember**:

1. Login with Admin account
2. Go to User Management page
3. Click "Add User" button
4. Fill in user information
5. Select Role as "Team Member"
6. Check required permissions
7. Click "Add" to save

---

## Features

### 1. User Management

**Admin-Only Feature**

- **Add User**: Create new Admin or TeamMember
- **Edit User**: Modify user information and permissions
- **Delete User**: Remove unwanted users
- **Login Log**: View all users' login history

### 2. Carbon Footprint Calculator

**Available to All Users (requires permission)**

#### Three Views

1. **Real-time View**

   - Shows today's electricity consumption and carbon footprint
   - Updates hourly
2. **Daily View**

   - Select date range to view
   - Shows daily data
3. **Long-term View**

   - Shows last 12 months of data
   - Aggregated by month

#### Custom Calculation

- Manually input electricity bill data
- Supports multiple months
- Temporary calculation, not saved to database
- Suitable for quick estimates

#### Report Features

1. **Export Report**

   - Generate PDF report containing all views
   - Automatically saves report record
   - Includes GBTAC header and generation time
2. **Report Log**

   - View all historical reports
   - Preview report content
   - Re-download PDF
   - Delete unwanted reports

### 3. Electricity Dashboard

**Four Main Tabs**:

1. **Consumption Tab**: View electricity consumption with breakdown by phase and equipment
2. **Generation Tab**: View solar generation with breakdown by source (Carport vs Rooftop)
3. **Net Energy Tab**: View net energy with self-sufficiency rate analysis
4. **Forecast Tab**: Predict future consumption and generation (7/14/30 days)

### 4. Water Dashboard

**Two Main Tabs**:

1. **Rainwater Harvesting**: Monitor rainwater tank level with weather-based forecast
2. **Hot Water Consumption**: Track hot water usage with historical pattern forecast

### 5. Thermal Dashboard

**Three View Modes**:

1. **Single Day View**: Hourly temperature data with outdoor temperature overlay
2. **Multiple Days View**: Aggregated temperature data for date range
3. **Forecast View**: Predict indoor temperature using hybrid model (7/14/30 days)

**Floor Plan Heat Map**: Real-time temperature visualization with 8-level color coding

### 6. Overview Dashboard

**Unified View**: All three modules (Electricity, Water, Thermal) on single page with consistent time range

### 3. Data Sources

- **SQL Server Database**: Real-time data from GBTAC building sensors
  - Electricity data (TL341, TL340, TL339)
  - Water data (TL93, TL210)
  - Thermal data (20004-20016_TL2)
- **Electricity Maps API**: Historical carbon intensity data (Alberta, CA-AB zone)
- **Open-Meteo API**: Weather data for forecasting (solar radiation, precipitation, temperature)
- **Mock Data**: User accounts and login logs (will migrate to SQL Server in future)

### 4. Performance Features

**Optimized for 50 Concurrent Users**:

- **In-Memory Caching**: Reduces database load, faster response times
- **Rate Limiting**: Protects forecast endpoints from abuse (200 requests/minute per IP)
- **Connection Pool**: Efficient database connection management with automatic fallback
- **Load Testing**: Built-in tool to test system performance

**Test System Performance**:

```bash
cd ecosphere-backend
node test-load.js
```

This will simulate 50 concurrent users and show performance metrics.

---

## Troubleshooting

### Issue 1: Node.js Not Installed

**Error Message**: `'node' is not recognized as an internal or external command`

**Solution**:

1. Download and install Node.js: https://nodejs.org/
2. Restart command line window
3. Verify installation: `node --version`

---

### Issue 2: Port Already in Use

**Error Message**: `Error: listen EADDRINUSE: address already in use :::3001`

**Solution**:

**Method 1: Close the program using the port**

```bash
# Find process using the port
netstat -ano | findstr :3001

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

**Method 2: Change port**

- Edit `ecosphere-backend/.env`
- Change `PORT=3001` to another port

---

### Issue 3: Frontend Cannot Connect to Backend

**Error Message**: `Network Error` or `Failed to fetch`

**Solution**:

1. Ensure backend server is running (http://localhost:3001)
2. Check API URL in `ecosphere-frontend/.env`
3. Check firewall settings

---

### Issue 4: Dependency Installation Failed

**Error Message**: `npm ERR!` or `ENOENT`

**Solution**:

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

---

### Issue 5: Database Connection Failed

**Error Message**: `.bat` file closes immediately after double-clicking

**Solution**:

1. Right-click the `.bat` file
2. Select "Run as administrator"
3. Or run in command line to see error messages

---

### Issue 6: Startup Script Won't Run

**Error Message**: `Cannot open database` or `Login failed`

**Solution**:

**Step 1: Check if SQL Server is Running**

```bash
# Check SQL Server service status
sc query MSSQLSERVER
```

**Step 2: Test Database Connection**

```bash
# Test with Windows Authentication (ODBC Driver 18)
sqlcmd -S .\SQLEXPRESS -E -d TestSlimDB -C -Q "SELECT @@VERSION"

# Test with SQL Server Authentication (ODBC Driver 18)
sqlcmd -S .\SQLEXPRESS -U your_username -P your_password -d TestSlimDB -C -Q "SELECT @@VERSION"

# If using older sqlcmd version, omit the -C flag
sqlcmd -S .\SQLEXPRESS -E -d TestSlimDB -Q "SELECT @@VERSION"
```

**Step 3: Verify Database Configuration**

- Open `ecosphere-backend/.env`
- Confirm `DB_SERVER` and `DB_DATABASE` are correct
- If using SQL Server Authentication, confirm `DB_USER` and `DB_PASSWORD` are correct

**Step 4: Check Database Tables**

```bash
# List all tables (ODBC Driver 18)
sqlcmd -S .\SQLEXPRESS -E -d TestSlimDB -C -Q "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES"

# Check if sensor table exists (ODBC Driver 18)
sqlcmd -S .\SQLEXPRESS -E -d TestSlimDB -C -Q "SELECT TOP 5 * FROM SaitSolarLab_20004_TL2"
```

**Common Issues**:

- **Wrong server name**: For SQL Server Express, use `.\SQLEXPRESS` not `localhost`
- **Wrong database name**: Confirm your database name is `TestSlimDB`
- **Wrong table name**: Sensor table format must be `SaitSolarLab_<sensor_id>`
- **ODBC Driver 18**: If using sqlcmd version 18+, add `-C` flag to trust server certificate
- **Port issue**: If SQL Server uses non-default port, set `DB_SERVER=.\SQLEXPRESS,1434` in `.env`
- **Firewall**: Ensure firewall allows SQL Server connections

**Test API Endpoint**:

```bash
# After starting backend, test sensor data API
curl http://localhost:3001/api/db/sensor/20004_TL2?limit=5
```

---

## 📝 Version Information

- **Version**: Prototype Phase 3
- **Last Updated**: 2026-01-07
- **Status**: In Development
- **Database**: SQL Server (Electricity, Water, Thermal, Carbon Footprint modules migrated)
- **Performance**: Optimized for 50 concurrent users

---

## ⚠️ Important Notes

1. **Database Connection Required**

   - All data modules now use SQL Server database
   - Ensure SQL Server is running and accessible
   - User Management still uses Mock JSON (will migrate in future)
   - System includes caching for better performance
2. **Data Security**

   - Do not use in production environment
   - Test account passwords are for demonstration only
3. **Performance**

   - System optimized for 50 concurrent users
   - In-memory caching reduces database load
   - Rate limiting protects forecast endpoints
   - First load may take a few seconds, subsequent loads are faster (cached)

---

**Enjoy using the application! Contact the development team if you have any questions.** 🎉
