# EcoSphere Testing Guide

## 🚀 Quick Start

### 1. Start Development Server
```bash
cd ecosphere-frontend
npm run dev
```

Server will start at: **http://localhost:5174/**

---

## 🧪 Testing Login Functionality

### Admin Login
1. Open http://localhost:5174/
2. Enter credentials:
   - **Email**: `admin.admin@edu.sait.ca`
   - **Password**: `abcd1234`
3. Click "Sign In"
4. Should redirect to **User Management** page (`/users`)

### Expected Behavior:
- ✅ Login form validates email and password
- ✅ Error message shows if credentials are wrong
- ✅ Admin redirects to User Management page
- ✅ Sidebar shows: Dashboard, User Management, Reports, Logout
- ✅ User info displays in sidebar

---

## 👥 Testing User Management (Admin Only)

### View Users
1. Login as Admin
2. Navigate to User Management (should be default page)
3. Should see user table with:
   - ID, First Name, Last Name, Email, Role
   - Edit and Delete buttons

### Add New User
1. Click "Add User" button (top right)
2. Fill in form:
   - First Name: `Test`
   - Last Name: `Member`
   - Email: `test.member@edu.sait.ca`
   - Password: `test1234`
   - Role: `Team Member`
3. Click "Add"
4. Should see success message
5. New user appears in table

### Edit User
1. Click Edit icon (pencil) on any user
2. Modify fields (e.g., change first name)
3. Click "Update"
4. Should see success message
5. Changes reflected in table

### Delete User
1. Click Delete icon (trash) on any user (except yourself)
2. Confirm deletion in popup
3. Should see success message
4. User removed from table

### Expected Behavior:
- ✅ Cannot delete your own account
- ✅ Form validation works
- ✅ Success/error messages display
- ✅ Data persists after page refresh (localStorage)

---

## 🧑‍💼 Testing TeamMember Login

### Create TeamMember Account
1. Login as Admin
2. Add new user with role "Team Member"
3. Logout (click Logout in sidebar)

### Login as TeamMember
1. Enter TeamMember credentials
2. Click "Sign In"
3. Should redirect to **Dashboard** page (`/dashboard`)

### Expected Behavior:
- ✅ TeamMember redirects to Dashboard
- ✅ Sidebar shows: Dashboard, Reports, Logout (NO User Management)
- ✅ Cannot access `/users` route (redirects to dashboard)
- ✅ Dashboard shows welcome message with user name

---

## 🔒 Testing Protected Routes

### Without Login
1. Open http://localhost:5174/dashboard directly
2. Should redirect to `/login`

### TeamMember Accessing Admin Route
1. Login as TeamMember
2. Try to access http://localhost:5174/users
3. Should redirect to `/dashboard`

### Expected Behavior:
- ✅ All routes except `/login` require authentication
- ✅ `/users` route requires Admin role
- ✅ Unauthorized access redirects appropriately

---

## 🔄 Testing Session Management

### Session Persistence
1. Login as any user
2. Refresh page (F5)
3. Should remain logged in
4. User info preserved

### Logout
1. Click "Logout" in sidebar
2. Should redirect to `/login`
3. Session cleared
4. Cannot access protected routes

### Expected Behavior:
- ✅ Session persists across page refreshes
- ✅ Logout clears session completely
- ✅ Must login again after logout

---

## 📊 Data Storage (Current Implementation)

### Where Data is Stored
- **Initial Data**: `src/data/users.json`
- **Runtime Data**: `localStorage` (key: `ecosphere_users`)
- **Session Data**: `sessionStorage` (key: `ecosphere_current_user`)

### Reset Data
To reset to initial state:
1. Open browser DevTools (F12)
2. Go to Application tab
3. Clear Storage:
   - localStorage → `ecosphere_users`
   - sessionStorage → `ecosphere_current_user`
4. Refresh page

---

## ⚠️ Known Limitations (Prototype Phase)

### Current Implementation
- ✅ Data stored in browser (localStorage)
- ✅ No backend API
- ✅ No real database
- ✅ Passwords stored in plain text (NOT SECURE)

### Future Implementation (Week 1-2)
- 🔄 SQL Server database
- 🔄 Node.js + Express backend
- 🔄 JWT token authentication
- 🔄 Password hashing (bcrypt)
- 🔄 API endpoints

---

## 🐛 Troubleshooting

### Login Not Working
- Check browser console for errors
- Verify credentials are correct
- Clear localStorage and try again

### Page Not Loading
- Check if dev server is running
- Check console for errors
- Try clearing browser cache

### Data Not Persisting
- Check if localStorage is enabled
- Check browser privacy settings
- Try different browser

---

## 📝 Test Checklist

### Login Functionality
- [ ] Admin can login
- [ ] TeamMember can login
- [ ] Wrong credentials show error
- [ ] Redirects based on role

### User Management
- [ ] View all users
- [ ] Add new user
- [ ] Edit existing user
- [ ] Delete user
- [ ] Cannot delete own account

### Navigation
- [ ] Sidebar shows correct menu items
- [ ] Role-based menu filtering works
- [ ] Logout works
- [ ] Protected routes work

### Session Management
- [ ] Session persists on refresh
- [ ] Logout clears session
- [ ] Unauthorized access blocked

---

## 🎯 Next Steps

After testing current functionality:
1. Create TeamMember test account
2. Test both Admin and TeamMember workflows
3. Report any bugs or issues
4. Proceed to Carbon Footprint implementation

---

**Last Updated**: 2025-11-28  
**Status**: Login and User Management Complete ✅
