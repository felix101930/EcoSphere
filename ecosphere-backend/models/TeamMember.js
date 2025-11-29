// TeamMember class (Inherits from User)
// Package: User Management
// Relationship: TeamMember --|> User : is-a
const User = require('./User');

class TeamMember extends User {
  constructor() {
    super();
    this.role = 'TeamMember';
    
    // Additional attributes from class diagram
    this.promptChat = 0;
    this.permissions = [];
  }

  // Methods from class diagram
  getPermissions() {
    return this.permissions;
  }

  /**
   * Convert to plain object (override)
   */
  toObject() {
    return {
      ...super.toObject(),
      promptChat: this.promptChat,
      permissions: this.permissions
    };
  }

  /**
   * Create TeamMember instance from plain object
   */
  static fromObject(obj) {
    const teamMember = new TeamMember();
    teamMember.id = obj.id;
    teamMember.firstName = obj.firstName;
    teamMember.lastName = obj.lastName;
    teamMember.email = obj.email;
    teamMember.password = obj.password;
    teamMember.role = obj.role;
    teamMember.promptChat = obj.promptChat || 0;
    teamMember.permissions = obj.permissions || [];
    return teamMember;
  }
}

module.exports = TeamMember;

