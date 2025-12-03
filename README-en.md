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

### 3. Update Data

**In the project root directory**, double-click to run:

```
update-electricity-data.bat
```

This will update electricity data to the current time.

### 4. Start the Application

**In the project root directory**, double-click to run:

```
start.bat
```

This will automatically start both backend and frontend servers.

### 5. Access the Application

Open in browser: **http://localhost:5174**

---

## Local Development (Recommended)

### Why Local Development is Recommended?

✅ **Advantages**:

- Real-time data updates (run `update-electricity-data.bat` once daily)
- No need to wait for Vercel deployment
- More convenient for development and testing
- Full control over data and configuration

❌ **Vercel Issues**:

- Data does not auto-update
- Requires redeployment for each data update
- Longer deployment time
- Not suitable for frequently updated data

### Daily Usage Workflow

#### First Use Each Day

1. **Update Data** (double-click to run):

   ```
   update-electricity-data.bat
   ```

   - Adds new data from yesterday to now
   - Shows "Data is already up to date!" if data is current
2. **Start Application** (double-click to run):

   ```
   start.bat
   ```

   - Automatically starts backend (port 3001)
   - Automatically starts frontend (port 5174)
   - Automatically opens browser
3. **Use Application**:

   - Open http://localhost:5174
   - Login with test account
   - Start using features

#### Stop Application

- Close both command line windows
- Or press `Ctrl + C` in each window

---

## Vercel Deployment (Not Recommended)

⚠️ **Warning**: Vercel deployment is not recommended because data requires manual synchronization and does not auto-update.

If you must deploy to Vercel, follow these steps:

### Pre-Deployment Preparation

1. **Update Data** (double-click to run):

   ```
   update-electricity-data.bat
   ```
2. **Sync Data to Backend** (double-click to run):

   ```
   sync-mock-data.bat
   ```

   - Copies files from mock-data/ to ecosphere-backend/data/
   - Vercel deployment uses files from backend/data/
3. **Commit to Git**:

   ```bash
   git add .
   git commit -m "Update data for deployment"
   git push
   ```
4. **Wait for Vercel Auto-Deployment**

   - Login to Vercel to check deployment status
   - Access the URL provided by Vercel after deployment completes

### Updating Data on Vercel

Each time you need to update data, repeat the above steps:

1. Run `update-electricity-data.bat`
2. Run `sync-mock-data.bat`
3. Git commit and push
4. Wait for Vercel to redeploy

**This is why Vercel is not recommended!**

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

### 3. Data Sources

- **Electricity Maps API**: Real-time carbon intensity data (Alberta, Calgary)
- **Mock Data**: Electricity consumption data (2024-01-01 to present)
- **Auto-Update**: Run `update-electricity-data.bat` to update data

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

### Issue 5: Data Update Failed

**Error Message**: `electricity.json not found`

**Solution**:

1. Ensure running `update-electricity-data.bat` in project root directory
2. Check if `mock-data/electricity.json` exists
3. If file is corrupted, restore from Git

---

### Issue 6: Startup Script Won't Run

**Error Message**: `.bat` file closes immediately after double-clicking

**Solution**:

1. Right-click the `.bat` file
2. Select "Run as administrator"
3. Or run in command line to see error messages

---

## 📝 Version Information

- **Version**: Prototype Phase 3
- **Last Updated**: 2025-12-02
- **Status**: In Development

---

## ⚠️ Important Notes

1. **This is Prototype Phase**

   - Uses Mock data (JSON files)
   - Will connect to real SQL Server database in the future
2. **Data Security**

   - Do not use in production environment
   - Test account passwords are for demonstration only
3. **Performance Optimization**

   - Electricity data file is large (~1.7 MB)
   - First load may take a few seconds

---

**Enjoy using the application! Contact the development team if you have any questions.** 🎉
