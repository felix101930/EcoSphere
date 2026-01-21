// Admin Type Definition (Frontend - Lightweight)
// Package: User Management
// 
// NOTE: Admin-specific operations are handled by backend API.
// Frontend only needs type definitions.

/**
 * @typedef {import('./User.js').User} User
 */

/**
 * @typedef {User} Admin
 * Admin is a User with role='Admin'
 */

/**
 * Admin utility functions (Frontend only - for UI purposes)
 */
class AdminUtils {
  /**
   * Check if user has admin privileges
   * @param {User} user 
   * @returns {boolean}
   */
  static hasAdminPrivileges(user) {
    return user && user.role === 'Admin';
  }

  /**
   * Validate user data before sending to backend
   * @param {Partial<User>} userData 
   * @returns {{valid: boolean, errors: string[]}}
   */
  static validateUserData(userData) {
    const errors = [];

    if (!userData.firstName || userData.firstName.trim() === '') {
      errors.push('First name is required');
    }

    if (!userData.lastName || userData.lastName.trim() === '') {
      errors.push('Last name is required');
    }

    if (!userData.email || !userData.email.includes('@')) {
      errors.push('Valid email is required');
    }

    if (!userData.role) {
      errors.push('Role is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export default AdminUtils;
