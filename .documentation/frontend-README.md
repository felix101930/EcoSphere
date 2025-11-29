# Frontend Models - Type Definitions & Utilities

## 📋 Overview

This directory contains **lightweight type definitions and utility functions** for the frontend.

**IMPORTANT**: This is NOT where business logic lives!
- ✅ Business logic is in the **backend** (`ecosphere-backend/models/`)
- ✅ Frontend only has type definitions and UI utilities
- ✅ All data operations go through the backend API

---

## 🏗️ Architecture

```
Frontend (Lightweight)          Backend (Full Logic)
├── Type Definitions            ├── Complete Business Logic
├── UI Utilities                ├── Data Validation
├── Basic Validation (UX)       ├── Security Checks
└── Display Helpers             └── Database Operations
        ↓                               ↑
        └──── API Calls ────────────────┘
```

---

## 📁 Files

### User.js
**Type**: Utility Class  
**Purpose**: User type definition and UI utilities

```javascript
/**
 * @typedef {Object} User
 * @property {number|null} id
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} email
 * @property {string} role
 */

// Utility functions for UI
UserUtils.validateEmailFormat(email)  // Basic UX validation
UserUtils.getFullName(user)           // Display helper
UserUtils.isAdmin(user)               // UI check
```

**What it does**:
- ✅ Defines User type structure
- ✅ Provides UI helper functions
- ✅ Basic format validation (for UX, not security)

**What it does NOT do**:
- ❌ Password hashing
- ❌ Database operations
- ❌ Security validation

---

### Admin.js
**Type**: Utility Class  
**Purpose**: Admin-specific UI utilities

```javascript
AdminUtils.hasAdminPrivileges(user)   // UI check
AdminUtils.validateUserData(userData) // Basic UX validation
```

**What it does**:
- ✅ Admin UI checks
- ✅ Form validation (for UX)

**What it does NOT do**:
- ❌ User creation (done by backend)
- ❌ Permission updates (done by backend)

---

### TeamMember.js
**Type**: Utility Class  
**Purpose**: TeamMember-specific UI utilities

```javascript
TeamMemberUtils.hasPermission(user, 'electricity')  // UI check
TeamMemberUtils.formatPermissions(permissions)      // Display helper
```

**What it does**:
- ✅ Permission UI checks
- ✅ Display formatting

**What it does NOT do**:
- ❌ Permission enforcement (done by backend)

---

### AccessControl.js
**Type**: Utility Class  
**Purpose**: Client-side permission checks for UI

```javascript
AccessControl.checkPermission(user, 'electricity')  // UI check
AccessControl.getAccessibleModules(user)            // UI display
```

**⚠️ IMPORTANT WARNING**:
```javascript
// ❌ WRONG - Never trust client-side checks for security!
if (AccessControl.checkPermission(user, 'admin')) {
  deleteAllUsers();  // BAD! User can bypass this in browser
}

// ✅ CORRECT - Use for UI display only
if (AccessControl.checkPermission(user, 'admin')) {
  showAdminButton();  // OK - just hiding UI element
}
```

**What it does**:
- ✅ Show/hide UI elements
- ✅ Display appropriate menus

**What it does NOT do**:
- ❌ Enforce security (done by backend)

---

## 🔒 Security Model

### Client-Side (Frontend)
```javascript
// This is for UX only!
if (!UserUtils.validateEmailFormat(email)) {
  showError('Please enter a valid email');  // ✅ Good UX
  return;
}

// Send to backend for real validation
await UserService.createUser(userData);
```

### Server-Side (Backend)
```javascript
// This is the real security!
class User {
  async createUser(data) {
    // ✅ Real validation
    if (!this.isValidEmail(data.email)) {
      throw new Error('Invalid email');
    }
    
    // ✅ Security checks
    if (await this.emailExists(data.email)) {
      throw new Error('Email already exists');
    }
    
    // ✅ Sensitive operations
    data.password = await this.hashPassword(data.password);
    
    // ✅ Database operations
    await this.save(data);
  }
}
```

---

## 📊 Data Flow

### Example: Creating a User

```
1. User fills form (Frontend)
   ↓
2. Basic validation (Frontend - UX only)
   if (!AdminUtils.validateUserData(data).valid) {
     showErrors();  // Show errors to user
     return;
   }
   ↓
3. API call (Frontend Service)
   const user = await UserService.createUser(data);
   ↓
4. Receive request (Backend Route)
   POST /api/users
   ↓
5. Real validation (Backend Model)
   User.validateEmail()
   User.checkDuplicateEmail()
   ↓
6. Business logic (Backend Model)
   User.hashPassword()
   User.assignDefaultPermissions()
   ↓
7. Save to database (Backend)
   await User.save()
   ↓
8. Return result (Backend → Frontend)
   res.json({ user })
   ↓
9. Update UI (Frontend)
   showSuccess('User created!')
```

---

## 🎯 Best Practices

### ✅ DO

```javascript
// ✅ Use for type checking (JSDoc)
/**
 * @param {User} user
 * @returns {string}
 */
function displayUserName(user) {
  return UserUtils.getFullName(user);
}

// ✅ Use for UI validation (UX)
if (!UserUtils.validateEmailFormat(email)) {
  setError('Please enter a valid email');
}

// ✅ Use for UI display
if (AccessControl.isAdmin(user)) {
  return <AdminPanel />;
}

// ✅ Always call backend for real operations
const result = await UserService.createUser(data);
```

### ❌ DON'T

```javascript
// ❌ Don't put business logic in frontend
class User {
  hashPassword(password) {  // WRONG! This should be in backend
    return bcrypt.hash(password);
  }
}

// ❌ Don't trust client-side validation for security
if (UserUtils.validatePassword(password)) {
  grantAccess();  // WRONG! User can bypass this
}

// ❌ Don't do database operations in frontend
class User {
  async save() {  // WRONG! This should be in backend
    await database.insert(this);
  }
}
```

---

## 🔄 Migration from Old Architecture

### Before (Full Classes in Frontend)
```javascript
// ❌ Old way - Full class with business logic
class User {
  constructor() { ... }
  createUser() { ... }
  hashPassword() { ... }  // Sensitive!
  validateEmail() { ... }
}
```

### After (Lightweight Utilities)
```javascript
// ✅ New way - Type definition + utilities
/**
 * @typedef {Object} User
 */

class UserUtils {
  static validateEmailFormat(email) { ... }  // UX only
  static getFullName(user) { ... }           // Display only
}
```

---

## 📚 Related Documentation

- **Backend Models**: `ecosphere-backend/models/README.md`
- **API Documentation**: `ecosphere-backend/routes/README.md`
- **Architecture Guide**: `ReadMeBeforeStart/COMPONENT_ARCHITECTURE.md`

---

## 💡 Summary

**Frontend Models = Type Definitions + UI Utilities**

- ✅ Lightweight
- ✅ UI-focused
- ✅ No business logic
- ✅ No security enforcement
- ✅ Always call backend API

**Backend Models = Complete Business Logic**

- ✅ Full validation
- ✅ Security enforcement
- ✅ Database operations
- ✅ Sensitive operations

---

**Remember**: Frontend is for display, Backend is for logic! 🎨 ↔️ 🧠

