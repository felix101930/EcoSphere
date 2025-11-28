// Admin class (Inherits from User)
// Package: User Management
// Relationship: Admin --|> User : is-a
import User from './User.js';

class Admin extends User {
  constructor() {
    super();
    this.role = 'Admin';
  }

  // Methods from class diagram
  addUser(userData) {
    console.log('Admin.addUser() called', userData);
    // Implementation in UserService
  }

  editUserPermissions(userId, permissions) {
    console.log('Admin.editUserPermissions() called', userId, permissions);
    // Implementation in UserService
  }

  assignRole(userId, role) {
    console.log('Admin.assignRole() called', userId, role);
    // Implementation in UserService
  }

  createQuiz() {
    // Future implementation
  }

  editQuiz(quizId) {
    // Future implementation
  }

  deleteQuiz(quizId) {
    // Future implementation
  }
}

export default Admin;
