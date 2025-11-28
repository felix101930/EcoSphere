// UserService - Handles all user-related operations
// Now uses Express backend API (preparation for SQL Server)

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

class UserService {
  constructor() {
    this.users = [];
  }

  // Get all users
  async getAllUsers() {
    try {
      const response = await fetch(`${API_BASE_URL}/users`);
      if (!response.ok) throw new Error('Failed to fetch users');
      this.users = await response.json();
      return this.users;
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  // Get user by ID
  async getUserById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${id}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return await response.json();
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  // Get user by email (client-side filter)
  async getUserByEmail(email) {
    const users = await this.getAllUsers();
    return users.find(user => user.email === email);
  }

  // Authenticate user (login)
  async authenticate(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        return null;
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error authenticating user:', error);
      return null;
    }
  }

  // Add new user (Admin only)
  async addUser(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add user');
      }
      
      const newUser = await response.json();
      return newUser;
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  }

  // Update user
  async updateUser(id, userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) throw new Error('Failed to update user');
      
      return await response.json();
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Delete user
  async deleteUser(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete user');
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Update user permissions
  async updateUserPermissions(userId, permissions) {
    return await this.updateUser(userId, { permissions });
  }
}

// Create singleton instance
const userService = new UserService();

export default userService;
