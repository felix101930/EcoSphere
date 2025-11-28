// EcoSphere Backend Server
// Simple Express server for user management
// This will be replaced with SQL Server in production

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Path to users.json file
const USERS_FILE = path.join(__dirname, '../ecosphere-frontend/src/data/users.json');

// Helper function to read users from file
async function readUsers() {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading users file:', error);
    return { users: [], nextId: 1 };
  }
}

// Helper function to write users to file
async function writeUsers(data) {
  try {
    await fs.writeFile(USERS_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing users file:', error);
    return false;
  }
}

// API Routes

// GET /api/users - Get all users
app.get('/api/users', async (req, res) => {
  try {
    const data = await readUsers();
    res.json(data.users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/users/:id - Get user by ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const data = await readUsers();
    const user = data.users.find(u => u.id === parseInt(req.params.id));
    
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST /api/users - Create new user
app.post('/api/users', async (req, res) => {
  try {
    const data = await readUsers();
    const { firstName, lastName, email, password, role, permissions } = req.body;
    
    // Validation
    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if email already exists
    const existingUser = data.users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    // Create new user
    const newUser = {
      id: data.nextId,
      firstName,
      lastName,
      email,
      password,
      role,
      permissions: permissions || []
    };
    
    data.users.push(newUser);
    data.nextId++;
    
    const success = await writeUsers(data);
    
    if (success) {
      res.status(201).json(newUser);
    } else {
      res.status(500).json({ error: 'Failed to save user' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT /api/users/:id - Update user
app.put('/api/users/:id', async (req, res) => {
  try {
    const data = await readUsers();
    const userId = parseInt(req.params.id);
    const index = data.users.findIndex(u => u.id === userId);
    
    if (index === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update user (preserve ID)
    data.users[index] = {
      ...data.users[index],
      ...req.body,
      id: userId
    };
    
    const success = await writeUsers(data);
    
    if (success) {
      res.json(data.users[index]);
    } else {
      res.status(500).json({ error: 'Failed to update user' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /api/users/:id - Delete user
app.delete('/api/users/:id', async (req, res) => {
  try {
    const data = await readUsers();
    const userId = parseInt(req.params.id);
    const index = data.users.findIndex(u => u.id === userId);
    
    if (index === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const deletedUser = data.users.splice(index, 1)[0];
    
    const success = await writeUsers(data);
    
    if (success) {
      res.json(deletedUser);
    } else {
      res.status(500).json({ error: 'Failed to delete user' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// POST /api/auth/login - Authenticate user
app.post('/api/auth/login', async (req, res) => {
  try {
    const data = await readUsers();
    const { email, password } = req.body;
    
    const user = data.users.find(u => u.email === email && u.password === password);
    
    if (user) {
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'EcoSphere Backend is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 EcoSphere Backend running on http://localhost:${PORT}`);
  console.log(`📁 Users file: ${USERS_FILE}`);
});
