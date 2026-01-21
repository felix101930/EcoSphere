// AccessControl Utility (Frontend - Lightweight)
// Package: Security
// 
// NOTE: This is CLIENT-SIDE permission checking for UI purposes only.
// NEVER trust client-side checks for security!
// Real permission checking happens on the backend.

/**
 * @typedef {import('./User.js').User} User
 */

/**
 * AccessControl utility for UI permission checks
 * WARNING: This is for UI display only, not for security!
 */
class AccessControl {
  /**
   * Check if user can access a module (CLIENT-SIDE ONLY)
   * This is for showing/hiding UI elements, NOT for security
   * @param {User} user 
   * @param {string} module 
   * @returns {boolean}
   */
  static checkPermission(user, module) {
    if (!user) return false;
    
    // Admin has all permissions (UI display)
    if (user.role === 'Admin') {
      return true;
    }
    
    // TeamMember permissions (UI display)
    if (user.role === 'TeamMember') {
      return user.permissions && user.permissions.includes(module);
    }
    
    return false;
  }

  /**
   * Get list of accessible modules for user (UI display)
   * @param {User} user 
   * @returns {string[]}
   */
  static getAccessibleModules(user) {
    if (!user) return [];
    
    if (user.role === 'Admin') {
      return ['electricity', 'water', 'thermal', '3d-model', 'carbon-footprint'];
    }
    
    if (user.role === 'TeamMember') {
      return user.permissions || [];
    }
    
    return [];
  }

  /**
   * Check if user can perform admin actions (UI display)
   * @param {User} user 
   * @returns {boolean}
   */
  static isAdmin(user) {
    return user && user.role === 'Admin';
  }
}

export default AccessControl;

