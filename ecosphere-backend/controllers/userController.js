// backend/controllers/userController.js

/**
 * User Controller
 * 
 * Handles HTTP requests for user management (CRUD operations)
 * Used by Admin/SuperAdmin to manage system users
 * Supports both Firebase authentication and simple password-based auth
 * Users are stored in JSON file (data/users.json)
 */

const UserService = require("../services/userService");
const admin = require("../firebase/admin");

/**
 * Admin creates user (simple version without Firebase)
 * 
 * Creates a new user with password-based authentication
 * Used for testing or when Firebase is not available
 * Password is stored in plain text (NOT recommended for production)
 * 
 * @route POST /api/users/admin-create
 * @access Admin/SuperAdmin only
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.body - User data
 * @param {string} req.body.firstName - User's first name
 * @param {string} req.body.lastName - User's last name
 * @param {string} req.body.email - User's email (must be unique)
 * @param {string} req.body.password - User's password (plain text)
 * @param {string} req.body.role - User role (Admin/TeamMember/SuperAdmin)
 * @param {Array<string>} [req.body.permissions] - Optional permission array
 * @param {Object} res - Express response object
 * @returns {Object} Created user object (without password)
 * 
 * @throws {400} If required fields are missing
 * @throws {400} If email already exists
 * @throws {500} If user creation fails
 * 
 * @example
 * Request body: {
 *   firstName: "John",
 *   lastName: "Doe",
 *   email: "john@example.com",
 *   password: "password123",
 *   role: "TeamMember",
 *   permissions: []
 * }
 */
const adminCreateUser = async (req, res) => {
  try {
    // Extract user data from request body
    const { firstName, lastName, email, password, role, permissions } =
      req.body;

    // Validate required fields
    // All fields are required for simple auth (password is needed)
    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Create user via service layer
    // Service will:
    // 1. Check if email already exists
    // 2. Generate unique ID
    // 3. Store user in JSON file
    // 4. Return created user object
    const newUser = await UserService.addUserSimple({
      firstName,
      lastName,
      email,
      password,
      role,
      permissions,
    });

    // Return 201 Created with user data
    // Password is included in response (for testing only)
    res.status(201).json(newUser);
  } catch (error) {
    // Log error for debugging
    console.error("Error in adminCreateUser:", error);

    // Handle duplicate email error
    // Service throws this error if email already exists in JSON file
    if (error.message === "Email already exists") {
      return res.status(400).json({ error: error.message });
    }

    // Return generic error for other failures
    // Could be file write errors or validation errors
    res.status(500).json({ error: "Failed to create user" });
  }
};

/**
 * Get all users
 * 
 * Retrieves complete list of all users in the system
 * Used by Admin dashboard to display user management table
 * Returns users without passwords for security
 * 
 * @route GET /api/users
 * @access Admin/SuperAdmin only
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Array<Object>} Array of user objects (without passwords)
 * 
 * @example
 * Response: [
 *   {
 *     id: 1,
 *     firstName: "John",
 *     lastName: "Doe",
 *     email: "john@example.com",
 *     role: "TeamMember",
 *     permissions: [],
 *     firebaseUid: "abc123",
 *     createdAt: "2026-01-16T10:00:00Z"
 *   }
 * ]
 */
const getAllUsers = async (req, res) => {
  try {
    // Log request for debugging
    // Helps track when admin views user list
    console.log("📝 getAllUsers called");

    // Fetch all users from JSON file via service layer
    // Service handles file reading and removes passwords from response
    const users = await UserService.getAllUsers();

    // Log success for debugging
    // Helps verify data was loaded correctly
    console.log("✅ Users fetched:", users.length);

    // Return users as JSON array
    // Frontend will display these in a table with edit/delete actions
    res.json(users);
  } catch (error) {
    // Log detailed error for debugging
    // Stack trace helps identify where error occurred
    console.error("❌ Error in getAllUsers:", error.message);
    console.error("Stack:", error.stack);

    // Return generic error to client
    // Don't expose internal file paths or system details
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

/**
 * Get user by ID
 * 
 * Retrieves a single user's details by their unique ID
 * Used when viewing/editing a specific user
 * Returns user without password for security
 * 
 * @route GET /api/users/:id
 * @access Admin/SuperAdmin only
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.id - User ID to fetch
 * @param {Object} res - Express response object
 * @returns {Object} User object (without password)
 * 
 * @throws {404} If user with given ID doesn't exist
 * @throws {500} If fetch operation fails
 */
const getUserById = async (req, res) => {
  try {
    // Fetch user by ID from JSON file via service layer
    // Service will search users array for matching ID
    const user = await UserService.getUserById(req.params.id);

    // Check if user exists
    // Service returns null if user not found
    if (user) {
      // Return user data (password excluded by service)
      res.json(user);
    } else {
      // Return 404 if user doesn't exist
      // This can happen if user was deleted or ID is invalid
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    // Log error for debugging (file read errors, invalid ID format)
    console.error("Error in getUserById:", error);

    // Return generic error to client
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

/**
 * Create user with Firebase authentication
 * 
 * Creates a new user linked to Firebase Auth account
 * Used when admin creates user through Firebase Auth UI
 * Requires Firebase UID from Firebase Auth system
 * No password stored (Firebase handles authentication)
 * 
 * @route POST /api/users
 * @access Admin/SuperAdmin only
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.body - User data
 * @param {string} req.body.firstName - User's first name
 * @param {string} req.body.lastName - User's last name
 * @param {string} req.body.email - User's email (must match Firebase)
 * @param {string} req.body.role - User role (Admin/TeamMember/SuperAdmin)
 * @param {Array<string>} [req.body.permissions] - Optional permission array
 * @param {string} req.body.firebaseUid - Firebase Auth UID (required)
 * @param {Object} res - Express response object
 * @returns {Object} Created user object
 * 
 * @throws {400} If required fields are missing
 * @throws {400} If email already exists
 * @throws {500} If user creation fails
 * 
 * @example
 * Request body: {
 *   firstName: "John",
 *   lastName: "Doe",
 *   email: "john@example.com",
 *   role: "TeamMember",
 *   permissions: [],
 *   firebaseUid: "firebase-uid-abc123"
 * }
 */
const createUser = async (req, res) => {
  try {
    // Extract user data from request body
    const { firstName, lastName, email, role, permissions, firebaseUid } =
      req.body;

    // Validate required fields
    // firebaseUid is required to link with Firebase Auth account
    if (!firstName || !lastName || !email || !role || !firebaseUid) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Create user via service layer
    // Service will:
    // 1. Check if email already exists
    // 2. Generate unique ID
    // 3. Store user in JSON file with Firebase UID
    // 4. Return created user object
    const newUser = await UserService.createUser({
      firstName,
      lastName,
      email,
      role,
      permissions,
      firebaseUid,
    });

    // Return 201 Created with user data
    res.status(201).json(newUser);
  } catch (error) {
    // Log error for debugging
    console.error("Error in createUser:", error);

    // Handle duplicate email error
    // Service throws this error if email already exists
    if (error.message === "Email already exists") {
      return res.status(400).json({ error: error.message });
    }

    // Return generic error for other failures
    res.status(500).json({ error: "Failed to create user" });
  }
};

/**
 * Update user information
 * 
 * Updates existing user's details (name, role, permissions)
 * Used by Admin when editing user through user management UI
 * Cannot update email or firebaseUid (these are immutable)
 * SuperAdmin (ID 1) cannot be modified for security
 * 
 * @route PUT /api/users/:id
 * @access Admin/SuperAdmin only
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.id - User ID to update
 * @param {Object} req.body - Updated user data (partial update allowed)
 * @param {string} [req.body.firstName] - Updated first name
 * @param {string} [req.body.lastName] - Updated last name
 * @param {string} [req.body.role] - Updated role
 * @param {Array<string>} [req.body.permissions] - Updated permissions
 * @param {Object} res - Express response object
 * @returns {Object} Updated user object
 * 
 * @throws {404} If user with given ID doesn't exist
 * @throws {500} If update operation fails
 * 
 * @example
 * Request: PUT /api/users/5
 * Body: { firstName: "Jane", role: "Admin" }
 */
const updateUser = async (req, res) => {
  try {
    // Update user via service layer
    // Service will:
    // 1. Find user by ID
    // 2. Merge new data with existing data
    // 3. Validate changes (e.g., can't modify SuperAdmin)
    // 4. Save updated JSON file
    // 5. Return updated user object
    const updatedUser = await UserService.updateUser(req.params.id, req.body);

    // Return updated user data
    res.json(updatedUser);
  } catch (error) {
    // Log error for debugging
    console.error("Error in updateUser:", error);

    // Handle user not found error
    // Service throws this if ID doesn't exist
    if (error.message === "User not found") {
      return res.status(404).json({ error: error.message });
    }

    // Return generic error for other failures
    // Could be validation errors or file write errors
    res.status(500).json({ error: "Failed to update user" });
  }
};

/**
 * Delete user
 * 
 * Removes user from both Firebase Auth and local database
 * Used by Admin when removing user through user management UI
 * SuperAdmin (ID 1) cannot be deleted for security
 * Deletion is permanent and cannot be undone
 * 
 * @route DELETE /api/users/:id
 * @access Admin/SuperAdmin only
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.id - User ID to delete
 * @param {Object} res - Express response object
 * @returns {Object} Deleted user object (confirmation)
 * 
 * @throws {404} If user with given ID doesn't exist
 * @throws {403} If attempting to delete SuperAdmin
 * @throws {500} If deletion fails
 * 
 * @example
 * Request: DELETE /api/users/5
 * Response: { id: 5, email: "user@example.com", deleted: true }
 */
const deleteUser = async (req, res) => {
  try {
    // Step 1: Get user first to retrieve Firebase UID
    // We need the UID to delete from Firebase Auth
    const user = await UserService.getUserById(req.params.id);

    // Check if user exists
    // If not found, throw error to be caught below
    if (!user) {
      throw new Error("User not found");
    }

    // Step 2: Delete from Firebase Auth if UID exists
    // User might not have Firebase UID if created with simple auth
    if (user.firebaseUid) {
      try {
        // Call Firebase Admin SDK to delete user
        // This removes user from Firebase Auth system
        await UserService.deleteUserFromFirebase(user.firebaseUid);
        console.log("✅ Deleted user from Firebase:", user.email);
      } catch (firebaseError) {
        // Log Firebase error but continue with database deletion
        // Firebase deletion might fail if:
        // - User was already deleted from Firebase
        // - Firebase Admin SDK has issues
        // - Network connectivity problems
        console.error(
          "❌ Error deleting from Firebase:",
          firebaseError.message
        );
        // Continue with database deletion even if Firebase fails
        // This prevents orphaned records in our database
      }
    }

    // Step 3: Delete from our local database (JSON file)
    // Service will:
    // 1. Check if user is SuperAdmin (cannot delete)
    // 2. Remove user from users array
    // 3. Save updated JSON file
    // 4. Return deleted user object
    const deletedUser = await UserService.deleteUser(req.params.id);

    // Return deleted user data as confirmation
    res.json(deletedUser);
  } catch (error) {
    // Log error for debugging
    console.error("Error in deleteUser:", error);

    // Handle user not found error
    if (error.message === "User not found") {
      return res.status(404).json({ error: error.message });
    }

    // Handle SuperAdmin deletion attempt
    // Service throws this error to prevent deleting SuperAdmin
    if (error.message === "Cannot delete Super Admin") {
      return res.status(403).json({ error: error.message });
    }

    // Return generic error for other failures
    res.status(500).json({ error: "Failed to delete user" });
  }
};

/**
 * Simple login function (no Firebase)
 * 
 * Authenticates user with email and password
 * Used for testing or when Firebase is not available
 * Compares plain text password (NOT secure for production)
 * Creates login log entry for security tracking
 * 
 * @route POST /api/users/login
 * @access Public
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.body - Login credentials
 * @param {string} req.body.email - User's email
 * @param {string} req.body.password - User's password (plain text)
 * @param {string} [req.body.ipAddress] - Client IP address for logging
 * @param {Object} res - Express response object
 * @returns {Object} User object with login log ID
 * 
 * @throws {400} If email or password is missing
 * @throws {401} If credentials are invalid
 * @throws {500} If login process fails
 * 
 * @example
 * Request body: {
 *   email: "user@example.com",
 *   password: "password123",
 *   ipAddress: "192.168.1.100"
 * }
 * 
 * Response: {
 *   user: {
 *     id: 5,
 *     email: "user@example.com",
 *     firstName: "John",
 *     lastName: "Doe",
 *     role: "TeamMember",
 *     lastLoginId: 123
 *   }
 * }
 */
const login = async (req, res) => {
  try {
    // Extract login credentials from request body
    const { email, password, ipAddress } = req.body;

    // Validate required fields
    // Both email and password are required for authentication
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Authenticate user via service layer
    // Service will:
    // 1. Find user by email
    // 2. Compare password (plain text comparison)
    // 3. Return user object if match, null if no match
    const user = await UserService.authenticateUser(email, password);

    // Check if authentication succeeded
    // Service returns null if email not found or password doesn't match
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Create login log entry for security tracking
    // This records successful login with timestamp and IP
    const LoginLogService = require("../services/loginLogService");
    const loginLog = await LoginLogService.addLog({
      email: user.email,
      role: user.role,
      status: "success",
      ipAddress: ipAddress || "127.0.0.1", // Default to localhost if not provided
    });

    // Add login log ID to user object
    // Frontend stores this ID to update logout time when user logs out
    user.lastLoginId = loginLog.id;

    // Return user data (password excluded by service)
    // Frontend stores this in localStorage/context for session management
    res.json({ user });
  } catch (error) {
    // Log error for debugging
    console.error("Error in login:", error);

    // Return generic error to client
    // Don't expose details about why login failed (security)
    res.status(500).json({ error: "Login failed" });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  adminCreateUser,
  updateUser,
  deleteUser,
  login,
};
