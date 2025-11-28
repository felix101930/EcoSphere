// UserService - Handles all user-related operations
// Uses JSON file for temporary storage (will be replaced with SQL Server)
import usersData from '../data/users.json';

class UserService {
  constructor() {
    // Load users from JSON (in real app, this would be from database)
    this.users = usersData.users || [];
    this.nextId = usersData.nextId || 1;
  }

  // Get all users
  getAllUsers() {
    return this.users;
  }

  // Get user by ID
  getUserById(id) {
    return this.users.find(user => user.id === id);
  }

  // Get user by email
  getUserByEmail(email) {
    return this.users.find(user => user.email === email);
  }

  // Authenticate user (login)
  authenticate(email, password) {
    const user = this.users.find(
      u => u.email === email && u.password === password
    );
    
    if (user) {
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    
    return null;
  }

  // Add new user (Admin only)
  addUser(userData) {
    const newUser = {
      id: this.nextId++,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      password: userData.password,
      role: userData.role || 'TeamMember',
      permissions: userData.permissions || []
    };

    this.users.push(newUser);
    this.saveToStorage();
    
    return newUser;
  }

  // Update user
  updateUser(id, userData) {
    const index = this.users.findIndex(user => user.id === id);
    
    if (index !== -1) {
      this.users[index] = {
        ...this.users[index],
        ...userData,
        id: this.users[index].id // Preserve ID
      };
      this.saveToStorage();
      return this.users[index];
    }
    
    return null;
  }

  // Delete user
  deleteUser(id) {
    const index = this.users.findIndex(user => user.id === id);
    
    if (index !== -1) {
      const deletedUser = this.users.splice(index, 1)[0];
      this.saveToStorage();
      return deletedUser;
    }
    
    return null;
  }

  // Update user permissions
  updateUserPermissions(userId, permissions) {
    const user = this.getUserById(userId);
    
    if (user) {
      user.permissions = permissions;
      this.saveToStorage();
      return user;
    }
    
    return null;
  }

  // Save to localStorage (temporary solution)
  // In production, this would be API calls to backend
  saveToStorage() {
    const data = {
      users: this.users,
      nextId: this.nextId
    };
    localStorage.setItem('ecosphere_users', JSON.stringify(data));
  }

  // Load from localStorage
  loadFromStorage() {
    const stored = localStorage.getItem('ecosphere_users');
    if (stored) {
      const data = JSON.parse(stored);
      this.users = data.users || [];
      this.nextId = data.nextId || 1;
    }
  }
}

// Create singleton instance
const userService = new UserService();

// Initialize from localStorage if available
userService.loadFromStorage();

export default userService;
