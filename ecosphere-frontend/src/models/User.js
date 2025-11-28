// User class (Abstract class from class-diagram-optimized.puml)
// Package: User Management
class User {
  constructor() {
    // Attributes from class diagram
    this.id = null;
    this.firstName = '';
    this.lastName = '';
    this.email = '';
    this.password = '';
    this.role = '';
  }

  // Methods from class diagram
  createUser(id, firstName, lastName, email, password, role) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.password = password;
    this.role = role;
  }

  login() {
    // Login logic implemented in AuthContext
    console.log('User.login() called');
  }

  logout() {
    // Logout logic
    this.id = null;
    this.firstName = '';
    this.lastName = '';
    this.email = '';
    this.password = '';
    this.role = '';
  }
}

export default User;
