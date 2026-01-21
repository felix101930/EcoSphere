# Node.js/Express Backend Development Standards

> Enterprise-level best practices for building maintainable, scalable Node.js backend applications

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Code Organization](#code-organization)
3. [Error Handling](#error-handling)
4. [Security Best Practices](#security-best-practices)
5. [Database & Data Access](#database--data-access)
6. [API Design](#api-design)
7. [Code Quality](#code-quality)
8. [Performance](#performance)
9. [Testing](#testing)
10. [Documentation](#documentation)

---

## 1. Project Structure

### Standard MVC Architecture

```
backend/
├── config/              # Configuration files
│   ├── database.js      # Database configuration
│   └── config.js        # App configuration
├── controllers/         # Request handlers
│   └── userController.js
├── services/            # Business logic
│   └── userService.js
├── models/              # Data models
│   └── User.js
├── routes/              # API routes
│   └── userRoutes.js
├── middleware/          # Custom middleware
│   └── authMiddleware.js
├── utils/               # Utility functions
│   └── helpers.js
├── scripts/             # Utility scripts
│   └── seedDatabase.js
├── .env                 # Environment variables
├── server.js            # Entry point
└── package.json
```

### Separation of Concerns

**✅ GOOD - Clear separation:**
```javascript
// routes/userRoutes.js - Only routing
router.get('/users/:id', getUser);

// controllers/userController.js - Request/response handling
const getUser = async (req, res) => {
  try {
    const user = await UserService.findById(req.params.id);
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// services/userService.js - Business logic
class UserService {
  static async findById(id) {
    // Business logic here
    return await database.query('SELECT * FROM users WHERE id = ?', [id]);
  }
}
```

**❌ BAD - Everything in routes:**
```javascript
// routes/userRoutes.js - Too much logic!
router.get('/users/:id', async (req, res) => {
  try {
    const result = await database.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    const user = result[0];
    // ... more business logic
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## 2. Code Organization

### File Size Guidelines

- **Controllers**: < 300 lines (ideal < 200)
- **Services**: < 400 lines (ideal < 300)
- **Routes**: < 100 lines (should be simple)
- **Utils**: < 200 lines per file

### Function Guidelines

- **Single Responsibility**: One function = one task
- **Function Length**: < 50 lines (ideal < 30)
- **Parameters**: Max 4 parameters (use object for more)

### Naming Conventions

```javascript
// Classes: PascalCase
class UserService {}

// Functions/Methods: camelCase
async function getUserById(id) {}

// Constants: UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;

// Files: camelCase or kebab-case
userService.js
user-service.js
```

### Constants Management

**✅ GOOD - Centralized constants:**
```javascript
// utils/constants.js
module.exports = {
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    SERVER_ERROR: 500
  },
  
  ERROR_MESSAGES: {
    USER_NOT_FOUND: 'User not found',
    INVALID_CREDENTIALS: 'Invalid credentials',
    SERVER_ERROR: 'Internal server error'
  },
  
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100
  }
};

// Usage
const { HTTP_STATUS, ERROR_MESSAGES } = require('./utils/constants');

res.status(HTTP_STATUS.NOT_FOUND).json({
  success: false,
  error: ERROR_MESSAGES.USER_NOT_FOUND
});
```

**❌ BAD - Magic numbers/strings everywhere:**
```javascript
res.status(404).json({ error: 'User not found' });
// ... in another file
res.status(404).json({ error: 'User not found' }); // Duplicate!
```

---

## 3. Error Handling

### Consistent Error Response Format

```javascript
// utils/errorResponse.js
class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
  }
}

module.exports = ErrorResponse;
```

### Controller Error Handling Pattern

**✅ GOOD - Consistent error handling:**
```javascript
const getUser = async (req, res) => {
  try {
    // Input validation
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Business logic
    const user = await UserService.findById(id);
    
    // Success response
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error in getUser:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user'
    });
  }
};
```

### Global Error Handler

```javascript
// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;

// server.js
app.use(errorHandler);
```

---

## 4. Security Best Practices

### Input Validation

**✅ ALWAYS validate user input:**
```javascript
const createUser = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validate required fields
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and name are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters'
      });
    }

    // Proceed with user creation
    const user = await UserService.create({ email, password, name });
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, error: 'Failed to create user' });
  }
};
```

### SQL Injection Prevention

**✅ GOOD - Parameterized queries:**
```javascript
// NEVER concatenate user input into SQL
const query = `SELECT * FROM users WHERE email = ? AND status = ?`;
const result = await database.query(query, [email, status]);
```

**❌ BAD - String concatenation:**
```javascript
// VULNERABLE TO SQL INJECTION!
const query = `SELECT * FROM users WHERE email = '${email}'`;
```

### Environment Variables

```javascript
// .env
DATABASE_HOST=localhost
DATABASE_USER=admin
DATABASE_PASSWORD=secret123
JWT_SECRET=your-secret-key
NODE_ENV=development

// config/config.js
require('dotenv').config();

module.exports = {
  database: {
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD
  },
  jwtSecret: process.env.JWT_SECRET,
  env: process.env.NODE_ENV || 'development'
};
```

---

## 5. Database & Data Access

### Service Layer Pattern

**✅ GOOD - Service handles all data access:**
```javascript
// services/userService.js
class UserService {
  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = ?';
    const result = await database.query(query, [id]);
    return result[0];
  }

  static async create(userData) {
    const query = 'INSERT INTO users (email, name) VALUES (?, ?)';
    const result = await database.query(query, [userData.email, userData.name]);
    return { id: result.insertId, ...userData };
  }

  static async update(id, userData) {
    const query = 'UPDATE users SET name = ?, email = ? WHERE id = ?';
    await database.query(query, [userData.name, userData.email, id]);
    return this.findById(id);
  }

  static async delete(id) {
    const query = 'DELETE FROM users WHERE id = ?';
    await database.query(query, [id]);
  }
}

module.exports = UserService;
```

### Query Optimization

```javascript
// ✅ GOOD - Efficient query with specific fields
const query = `
  SELECT id, name, email, created_at 
  FROM users 
  WHERE status = 'active' 
  ORDER BY created_at DESC 
  LIMIT 100
`;

// ❌ BAD - SELECT * is inefficient
const query = 'SELECT * FROM users';
```

---

## 6. API Design

### RESTful Conventions

```javascript
// ✅ GOOD - RESTful routes
GET    /api/users           // List all users
GET    /api/users/:id       // Get specific user
POST   /api/users           // Create user
PUT    /api/users/:id       // Update user (full)
PATCH  /api/users/:id       // Update user (partial)
DELETE /api/users/:id       // Delete user
```

### Consistent Response Format

```javascript
// Success response
{
  "success": true,
  "data": { /* result */ },
  "message": "Operation successful" // optional
}

// Error response
{
  "success": false,
  "error": "Error message",
  "details": { /* optional error details */ }
}

// List response with pagination
{
  "success": true,
  "data": [ /* items */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### HTTP Status Codes

```javascript
const HTTP_STATUS = {
  OK: 200,                    // Success
  CREATED: 201,               // Resource created
  NO_CONTENT: 204,            // Success, no content to return
  BAD_REQUEST: 400,           // Invalid request
  UNAUTHORIZED: 401,          // Not authenticated
  FORBIDDEN: 403,             // Not authorized
  NOT_FOUND: 404,             // Resource not found
  CONFLICT: 409,              // Conflict (e.g., duplicate)
  SERVER_ERROR: 500           // Server error
};
```

---

## 7. Code Quality

### Avoid Code Duplication (DRY)

**✅ GOOD - Reusable function:**
```javascript
// utils/responseHelper.js
const sendSuccess = (res, data, message = null) => {
  res.json({
    success: true,
    data,
    ...(message && { message })
  });
};

const sendError = (res, statusCode, error) => {
  res.status(statusCode).json({
    success: false,
    error
  });
};

module.exports = { sendSuccess, sendError };

// Usage in controllers
const { sendSuccess, sendError } = require('../utils/responseHelper');

const getUser = async (req, res) => {
  try {
    const user = await UserService.findById(req.params.id);
    sendSuccess(res, user);
  } catch (error) {
    sendError(res, 500, 'Failed to fetch user');
  }
};
```

### Comments & Documentation

```javascript
/**
 * Get user by ID
 * @param {string} id - User ID
 * @returns {Promise<Object>} User object
 * @throws {Error} If user not found
 */
static async findById(id) {
  const query = 'SELECT * FROM users WHERE id = ?';
  const result = await database.query(query, [id]);
  
  if (!result || result.length === 0) {
    throw new Error('User not found');
  }
  
  return result[0];
}
```

---

## 8. Performance

### Async/Await Best Practices

**✅ GOOD - Parallel execution:**
```javascript
// Execute independent queries in parallel
const [users, posts, comments] = await Promise.all([
  UserService.findAll(),
  PostService.findAll(),
  CommentService.findAll()
]);
```

**❌ BAD - Sequential execution:**
```javascript
// Unnecessarily slow
const users = await UserService.findAll();
const posts = await PostService.findAll();
const comments = await CommentService.findAll();
```

### Caching Strategy

```javascript
// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCachedData = async (key, fetchFunction) => {
  const cached = cache.get(key);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const data = await fetchFunction();
  cache.set(key, { data, timestamp: Date.now() });
  
  return data;
};
```

---

## 9. Testing

### Unit Test Example

```javascript
// tests/services/userService.test.js
const UserService = require('../../services/userService');

describe('UserService', () => {
  describe('findById', () => {
    it('should return user when ID exists', async () => {
      const user = await UserService.findById(1);
      expect(user).toBeDefined();
      expect(user.id).toBe(1);
    });

    it('should throw error when user not found', async () => {
      await expect(UserService.findById(999999))
        .rejects
        .toThrow('User not found');
    });
  });
});
```

---

## 10. Documentation

### API Documentation

```javascript
/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Public
 * @param   {string} id - User ID
 * @returns {Object} User object
 * @example
 * GET /api/users/123
 * Response: {
 *   "success": true,
 *   "data": {
 *     "id": "123",
 *     "name": "John Doe",
 *     "email": "john@example.com"
 *   }
 * }
 */
router.get('/users/:id', getUser);
```

---

## Common Anti-Patterns to Avoid

### ❌ 1. Callback Hell
```javascript
// BAD
getData(function(a) {
  getMoreData(a, function(b) {
    getMoreData(b, function(c) {
      // ...
    });
  });
});

// GOOD
const a = await getData();
const b = await getMoreData(a);
const c = await getMoreData(b);
```

### ❌ 2. Not Handling Errors
```javascript
// BAD
const user = await UserService.findById(id); // What if this fails?

// GOOD
try {
  const user = await UserService.findById(id);
} catch (error) {
  console.error('Error:', error);
  // Handle error appropriately
}
```

### ❌ 3. Exposing Sensitive Data
```javascript
// BAD
res.json({ user }); // Might include password hash!

// GOOD
const { password, ...safeUser } = user;
res.json({ user: safeUser });
```

---

## Checklist for Code Review

- [ ] No magic numbers/strings (use constants)
- [ ] Proper error handling in all async functions
- [ ] Input validation for all user inputs
- [ ] Consistent response format
- [ ] No SQL injection vulnerabilities
- [ ] Environment variables for sensitive data
- [ ] Functions < 50 lines
- [ ] Files < 400 lines
- [ ] Clear separation of concerns (routes/controllers/services)
- [ ] Meaningful variable/function names
- [ ] Comments for complex logic
- [ ] No code duplication
- [ ] Proper HTTP status codes
- [ ] Async operations optimized (parallel where possible)
