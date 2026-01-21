// User Type Definition (Frontend - Lightweight)
// Package: User Management
// 
// NOTE: This is a TYPE DEFINITION only, not a full class.
// Business logic is handled by the backend.
// Frontend only uses this for type checking and basic validation.

/**
 * @typedef {Object} User
 * @property {number|null} id - User ID
 * @property {string} firstName - First name
 * @property {string} lastName - Last name
 * @property {string} email - Email address
 * @property {string} role - User role ('Admin' or 'TeamMember')
 * @property {string[]} [permissions] - Permissions (for TeamMember only)
 */

/**
 * User utility functions (Frontend only - for UI purposes)
 */
class UserUtils {
  /**
   * Basic email format validation (for UX only, not security)
   * @param {string} email 
   * @returns {boolean}
   */
  static validateEmailFormat(email) {
    return email && email.includes('@') && email.includes('.');
  }

  /**
   * Basic password format validation (for UX only, not security)
   * @param {string} password 
   * @returns {boolean}
   */
  static validatePasswordFormat(password) {
    return password && password.length >= 8;
  }

  /**
   * Get user's full name
   * @param {User} user 
   * @returns {string}
   */
  static getFullName(user) {
    return `${user.firstName} ${user.lastName}`;
  }

  /**
   * Check if user is admin
   * @param {User} user 
   * @returns {boolean}
   */
  static isAdmin(user) {
    return user && user.role === 'Admin';
  }

  /**
   * Check if user is team member
   * @param {User} user 
   * @returns {boolean}
   */
  static isTeamMember(user) {
    return user && user.role === 'TeamMember';
  }
}

export default UserUtils;
