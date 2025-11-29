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

  /**
   * Convert to plain object (for JSON serialization)
   */
  toObject() {
    return {
      id: this.id,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      password: this.password,
      role: this.role
    };
  }

  /**
   * Create User instance from plain object
   */
  static fromObject(obj) {
    const user = new User();
    user.id = obj.id;
    user.firstName = obj.firstName;
    user.lastName = obj.lastName;
    user.email = obj.email;
    user.password = obj.password;
    user.role = obj.role;
    return user;
  }
}

module.exports = User;

