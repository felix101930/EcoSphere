// User Service - Business logic for user operations
const FileHelper = require('../utils/fileHelper');
const config = require('../config/config');

class UserService {
  /**
   * Get all users
   */
  static async getAllUsers() {
    const data = await FileHelper.readJSON(config.usersFile);
    return data.users || [];
  }

  /**
   * Get user by ID
   */
  static async getUserById(id) {
    const data = await FileHelper.readJSON(config.usersFile);
    return data.users.find(u => u.id === parseInt(id));
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email) {
    const data = await FileHelper.readJSON(config.usersFile);
    return data.users.find(u => u.email === email);
  }

  /**
   * Create new user
   */
  static async createUser(userData) {
    const data = await FileHelper.readJSON(config.usersFile);
    
    // Check if email already exists
    const existingUser = data.users.find(u => u.email === userData.email);
    if (existingUser) {
      throw new Error('Email already exists');
    }
    
    // Create new user
    const newUser = {
      id: data.nextId,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      password: userData.password,
      role: userData.role,
      permissions: userData.permissions || []
    };
    
    data.users.push(newUser);
    data.nextId++;
    
    await FileHelper.writeJSON(config.usersFile, data);
    return newUser;
  }

  /**
   * Update user
   */
  static async updateUser(id, userData) {
    const data = await FileHelper.readJSON(config.usersFile);
    const index = data.users.findIndex(u => u.id === parseInt(id));
    
    if (index === -1) {
      throw new Error('User not found');
    }
    
    // Update user (preserve ID)
    data.users[index] = {
      ...data.users[index],
      ...userData,
      id: parseInt(id)
    };
    
    await FileHelper.writeJSON(config.usersFile, data);
    return data.users[index];
  }

  /**
   * Delete user
   */
  static async deleteUser(id) {
    const data = await FileHelper.readJSON(config.usersFile);
    const index = data.users.findIndex(u => u.id === parseInt(id));
    
    if (index === -1) {
      throw new Error('User not found');
    }
    
    const deletedUser = data.users.splice(index, 1)[0];
    await FileHelper.writeJSON(config.usersFile, data);
    return deletedUser;
  }

  /**
   * Authenticate user
   */
  static async authenticate(email, password) {
    const data = await FileHelper.readJSON(config.usersFile);
    const user = data.users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      return null;
    }
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

module.exports = UserService;
