// User Controller - Handles HTTP requests
const UserService = require('../services/userService');

class UserController {
  /**
   * GET /api/users - Get all users
   */
  static async getAllUsers(req, res) {
    try {
      console.log('📝 getAllUsers called');
      const users = await UserService.getAllUsers();
      console.log('✅ Users fetched:', users.length);
      res.json(users);
    } catch (error) {
      console.error('❌ Error in getAllUsers:', error.message);
      console.error('Stack:', error.stack);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }

  /**
   * GET /api/users/:id - Get user by ID
   */
  static async getUserById(req, res) {
    try {
      const user = await UserService.getUserById(req.params.id);
      
      if (user) {
        res.json(user);
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    } catch (error) {
      console.error('Error in getUserById:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  }

  /**
   * POST /api/users - Create new user
   */
  static async createUser(req, res) {
    try {
      const { firstName, lastName, email, password, role, permissions } = req.body;
      
      // Validation
      if (!firstName || !lastName || !email || !password || !role) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      const newUser = await UserService.createUser({
        firstName,
        lastName,
        email,
        password,
        role,
        permissions
      });
      
      res.status(201).json(newUser);
    } catch (error) {
      console.error('Error in createUser:', error);
      
      if (error.message === 'Email already exists') {
        return res.status(400).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Failed to create user' });
    }
  }

  /**
   * PUT /api/users/:id - Update user
   */
  static async updateUser(req, res) {
    try {
      const updatedUser = await UserService.updateUser(req.params.id, req.body);
      res.json(updatedUser);
    } catch (error) {
      console.error('Error in updateUser:', error);
      
      if (error.message === 'User not found') {
        return res.status(404).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Failed to update user' });
    }
  }

  /**
   * DELETE /api/users/:id - Delete user
   */
  static async deleteUser(req, res) {
    try {
      const deletedUser = await UserService.deleteUser(req.params.id);
      res.json(deletedUser);
    } catch (error) {
      console.error('Error in deleteUser:', error);
      
      if (error.message === 'User not found') {
        return res.status(404).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }

  /**
   * POST /api/auth/login - Authenticate user
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body;
      
      const user = await UserService.authenticate(email, password);
      
      if (user) {
        res.json(user);
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    } catch (error) {
      console.error('Error in login:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }
}

module.exports = UserController;
