## 📝 Startup Steps

### 1️⃣ First, Start the Backend Server

Open the first terminal window:

```bash
cd ecosphere-backend
npm start
```

**Backend server will run on**: http://localhost:3001

**Successful startup message**:

```
Server is running on http://localhost:3001
```

---

### 2️⃣ Then, Start the Frontend Application

Open the second terminal window:

```bash
cd ecosphere-frontend
npm run dev
```

**Frontend application will run on**: http://localhost:5174

**Successful startup message**:

```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5174/
```

---

## 🌐 Access the Application

Open in browser: **http://localhost:5174**

---

## 🔑 Test Accounts

### Admin Account (Administrator)

- **Email**: `admin.admin@edu.sait.ca`
- **Password**: `abcd1234`
- **Permissions**: All features

### TeamMember Account (Team Member)

- Must be created by Admin account in the User Management page
- Can be assigned different permissions

---

## ⚠️ Important Notes

1. **Must start backend first, then frontend**
2. **Both servers must run simultaneously**
3. If port is occupied, please close the program using that port first

---

## 🛑 Stop the Application

Press `Ctrl + C` in each terminal window to stop the servers

---

## 📦 First-time Dependency Installation

If running the project for the first time, install dependencies first:

### Install Backend Dependencies

```bash
cd ecosphere-backend
npm install
```

### Install Frontend Dependencies

```bash
cd ecosphere-frontend
npm install
```

---

## 🔧 Troubleshooting

### Issue 1: Port Already in Use

**Error Message**: `Error: listen EADDRINUSE: address already in use :::3001`

**Solution**:

- Close the program using port 3001
- Or modify the port number in `ecosphere-backend/server.js`

### Issue 2: Frontend Cannot Connect to Backend

**Error Message**: `Network Error` or `Failed to fetch`

**Solution**:

- Ensure backend server is running
- Check if backend is running on http://localhost:3001

### Issue 3: Dependency Installation Failed

**Solution**:

```bash
# Clear cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```
