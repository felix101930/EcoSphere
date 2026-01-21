// AccessControl class
// Package: Security
// Relationship: Admin ..> AccessControl : uses

class AccessControl {
  // Static methods from class diagram
  static checkPermission(user, module) {
    if (!user) return false;

    // SuperAdmin and Admin have all permissions
    if (user.role === 'SuperAdmin' || user.role === 'Admin') {
      return true;
    }

    // TeamMember permissions based on permissions list
    if (user.role === 'TeamMember') {
      return user.permissions && user.permissions.includes(module);
    }

    return false;
  }

  static updateUserPermissions(userId, permissions) {
    console.log('AccessControl.updateUserPermissions() called', userId, permissions);
    // Implementation in UserService
  }
}

module.exports = AccessControl;

