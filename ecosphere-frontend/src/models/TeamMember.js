// TeamMember Type Definition (Frontend - Lightweight)
// Package: User Management
// 
// NOTE: TeamMember-specific operations are handled by backend API.
// Frontend only needs type definitions.

/**
 * @typedef {import('./User.js').User} User
 */

/**
 * @typedef {Object} TeamMember
 * @property {number|null} id
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} email
 * @property {string} role - Always 'TeamMember'
 * @property {number} promptChat - AI chat prompt count
 * @property {string[]} permissions - List of permissions
 */

/**
 * TeamMember utility functions (Frontend only - for UI purposes)
 */
class TeamMemberUtils {
  /**
   * Check if team member has specific permission
   * @param {TeamMember} teamMember 
   * @param {string} permission 
   * @returns {boolean}
   */
  static hasPermission(teamMember, permission) {
    return teamMember && 
           teamMember.permissions && 
           teamMember.permissions.includes(permission);
  }

  /**
   * Get list of permissions for display
   * @param {TeamMember} teamMember 
   * @returns {string[]}
   */
  static getPermissions(teamMember) {
    return teamMember?.permissions || [];
  }

  /**
   * Format permissions for display
   * @param {string[]} permissions 
   * @returns {string}
   */
  static formatPermissions(permissions) {
    if (!permissions || permissions.length === 0) {
      return 'No permissions';
    }
    return permissions.join(', ');
  }

  /**
   * Check if team member can access module
   * @param {TeamMember} teamMember 
   * @param {string} module 
   * @returns {boolean}
   */
  static canAccessModule(teamMember, module) {
    return this.hasPermission(teamMember, module);
  }
}

export default TeamMemberUtils;
