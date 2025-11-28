// TeamMember class (Inherits from User)
// Package: User Management
// Relationship: TeamMember --|> User : is-a
import User from './User.js';

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
}

export default TeamMember;
