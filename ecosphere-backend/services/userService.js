// backend/services/userService.js
const FileHelper = require("../utils/fileHelper");
const config = require("../config/config");
const admin = require("../firebase/admin");

class UserService {
  /**
   * Create user in Firebase and backend (Admin function)
   */
  static async addUserWithFirebase(userData) {
    const data = await FileHelper.readJSON(config.usersFile);

    // Check if email already exists
    const existingUser = data.users.find((u) => u.email === userData.email);
    if (existingUser) {
      throw new Error("Email already exists");
    }

    // Check if Firebase Admin is initialized
    if (!admin) {
      throw new Error("Firebase Admin not initialized");
    }

    try {
      // 1. Create user in Firebase
      const firebaseUser = await admin.auth().createUser({
        email: userData.email,
        password: userData.password || "TempPassword123!",
        displayName: `${userData.firstName} ${userData.lastName}`,
        emailVerified: false,
        disabled: false,
      });

      // 2. Create user in our database
      const newUser = {
        id: data.nextId,
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        email: userData.email,
        role: userData.role || "TeamMember",
        permissions: userData.permissions || [],
        firebaseUid: firebaseUser.uid,
        createdAt: new Date().toISOString(),
      };

      data.users.push(newUser);
      data.nextId++;

      await FileHelper.writeJSON(config.usersFile, data);
      return newUser;
    } catch (error) {
      console.error("Firebase user creation error:", error);
      throw new Error(`Failed to create user in Firebase: ${error.message}`);
    }
  }

  /**
   * Get all users (NO PASSWORDS)
   */
  static async getAllUsers() {
    const data = await FileHelper.readJSON(config.usersFile);
    return data.users || [];
  }

  /**
   * Get user by ID
   */
  static async getUserById(id) {
    const data = await FileHelper.readJSON(config.usersFile);
    return data.users.find((u) => u.id === parseInt(id));
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email) {
    const data = await FileHelper.readJSON(config.usersFile);
    return data.users.find((u) => u.email === email);
  }

  /**
   * Create new user - with SuperAdmin ID handling
   */
  static async createUser(userData) {
    const data = await FileHelper.readJSON(config.usersFile);

    // Check if email already exists
    const existingUser = data.users.find((u) => u.email === userData.email);
    if (existingUser) {
      throw new Error("Email already exists");
    }

    // Special handling for SuperAdmin (if email matches)
    if (
      userData.email === "superadmin@ecosphere.com" ||
      userData.role === "SuperAdmin"
    ) {
      // Check if there's already a user with ID 1
      const existingId1 = data.users.find((u) => u.id === 1);

      if (existingId1) {
        // If ID 1 exists but email doesn't match, reassign ID for existing user
        if (existingId1.email !== userData.email) {
          // Find max ID
          const maxId = Math.max(...data.users.map((u) => u.id), 0);
          existingId1.id = maxId + 1;
        }
      }

      // Create SuperAdmin with ID 1
      const superAdminUser = {
        id: 1,
        firstName: userData.firstName || "Super",
        lastName: userData.lastName || "Admin",
        email: userData.email,
        role: "SuperAdmin",
        permissions: userData.permissions || [],
        firebaseUid: userData.firebaseUid || null,
        createdAt: new Date().toISOString(),
      };

      data.users = data.users.filter((u) => u.email !== userData.email); // Remove duplicate if exists
      data.users.unshift(superAdminUser); // Add at beginning

      // Ensure nextId is at least 2
      if (data.nextId <= 1) {
        data.nextId = 2;
      }

      await FileHelper.writeJSON(config.usersFile, data);
      return superAdminUser;
    }

    // For regular users (Admin and TeamMember)
    const newUser = {
      id: data.nextId,
      firstName: userData.firstName || "",
      lastName: userData.lastName || "",
      email: userData.email,
      role: userData.role || "TeamMember",
      permissions: userData.permissions || [],
      firebaseUid: userData.firebaseUid || null,
      createdAt: new Date().toISOString(),
    };

    data.users.push(newUser);
    data.nextId++;

    await FileHelper.writeJSON(config.usersFile, data);
    return newUser;
  }

  /**
   * Update user
   */
  static async updateUser(id, userData) {
    const data = await FileHelper.readJSON(config.usersFile);
    const index = data.users.findIndex((u) => u.id === parseInt(id));

    if (index === -1) {
      throw new Error("User not found");
    }

    const userToUpdate = data.users[index];

    // Prevent changing SuperAdmin ID or role (if you're not SuperAdmin)
    if (parseInt(id) === 1 && userData.role && userData.role !== "SuperAdmin") {
      throw new Error("Cannot change SuperAdmin role");
    }

    // Update user - ensure no password field
    const updatedUser = {
      ...userToUpdate,
      ...userData,
      id: parseInt(id), // Ensure ID stays the same
      updatedAt: new Date().toISOString(),
    };

    // Remove password if somehow included
    delete updatedUser.password;

    data.users[index] = updatedUser;
    await FileHelper.writeJSON(config.usersFile, data);
    return updatedUser;
  }

  /**
   * Delete user from database (Firebase deletion handled separately)
   */
  static async deleteUser(id) {
    const data = await FileHelper.readJSON(config.usersFile);
    const index = data.users.findIndex((u) => u.id === parseInt(id));

    if (index === -1) {
      throw new Error("User not found");
    }

    // Check if trying to delete SuperAdmin (ID 1)
    if (parseInt(id) === 1) {
      throw new Error("Cannot delete Super Admin");
    }

    const deletedUser = data.users.splice(index, 1)[0];
    await FileHelper.writeJSON(config.usersFile, data);
    return deletedUser;
  }

  /**
   * Delete user from Firebase (used when admin deletes a user)
   */
  static async deleteUserFromFirebase(firebaseUid) {
    if (!admin) {
      throw new Error("Firebase Admin not initialized");
    }

    if (!firebaseUid) {
      throw new Error("Firebase UID is required");
    }

    try {
      await admin.auth().deleteUser(firebaseUid);
      return { success: true, message: "User deleted from Firebase" };
    } catch (error) {
      console.error("Firebase delete error:", error);
      throw new Error(`Failed to delete user from Firebase: ${error.message}`);
    }
  }
}

module.exports = UserService;
