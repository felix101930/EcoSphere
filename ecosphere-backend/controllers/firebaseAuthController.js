// ecosphere-backend/controllers/firebaseAuthController.js

/**
 * Firebase Authentication Controller
 * 
 * Handles Firebase-based authentication and user management
 * Integrates Firebase Auth with local user database (JSON file)
 * Supports token verification, login, signup, and profile retrieval
 * 
 * Key Features:
 * - Verifies Firebase ID tokens for secure authentication
 * - Auto-creates users on first login (SuperAdmin gets ID 1)
 * - Logs all login attempts (success and failure) for security
 * - Syncs Firebase Auth with local user database
 */

const admin = require("../firebase/admin");
const UserService = require("../services/userService");
const LoginLogService = require("../services/loginLogService");
const FileHelper = require("../utils/fileHelper");
const config = require("../config/config");

/**
 * Verify Firebase ID token middleware
 * 
 * Validates Firebase authentication token and loads user data
 * Used as middleware to protect routes requiring authentication
 * Token can be in Authorization header or request body
 * 
 * @middleware
 * @route Any protected route
 * @access Public (but validates token)
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.headers - HTTP headers
 * @param {string} [req.headers.authorization] - Bearer token (format: "Bearer <token>")
 * @param {Object} [req.body] - Request body
 * @param {string} [req.body.token] - Firebase ID token (alternative to header)
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * 
 * @throws {401} If token is missing, invalid, or expired
 * @throws {404} If user exists in Firebase but not in local database
 * @throws {500} If Firebase Admin is not initialized
 * 
 * @example
 * // Usage in routes:
 * router.get('/protected', verifyToken, (req, res) => {
 *   // req.user contains user data from database
 *   // req.firebaseUser contains decoded Firebase token
 * });
 */
const verifyToken = async (req, res, next) => {
  try {
    // Extract token from Authorization header (preferred) or request body (fallback)
    // Header format: "Bearer <token>"
    // Body format: { token: "<token>" }
    const token = req.headers.authorization?.split(" ")[1] || req.body?.token;

    // Log token presence for debugging (don't log actual token for security)
    console.log("🔐 verifyToken - Token present:", !!token);
    console.log(
      "🔐 Headers authorization:",
      req.headers.authorization?.substring(0, 50)
    );

    // Validate token exists
    // Token is required for all protected routes
    if (!token) {
      console.log("❌ No token provided");
      return res.status(401).json({
        success: false,
        error: "No Firebase token provided",
      });
    }

    // Check if Firebase Admin SDK is initialized
    // This should never fail unless firebase/admin.js has issues
    if (!admin) {
      console.error("Firebase Admin not initialized");
      return res.status(500).json({
        success: false,
        error: "Authentication service not available",
      });
    }

    // Verify token with Firebase Admin SDK
    // This checks:
    // 1. Token signature is valid
    // 2. Token is not expired
    // 3. Token was issued by our Firebase project
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log("✅ Token verified for:", decodedToken.email);

    // Load user data from local database
    // We store additional user info (role, permissions) locally
    // Firebase only handles authentication, not authorization
    const user = await UserService.getUserByEmail(decodedToken.email);

    // Handle case where user exists in Firebase but not in local database
    // This can happen if:
    // - User was deleted from database but not Firebase
    // - Database was reset but Firebase wasn't
    if (!user) {
      console.log("❌ User not found in system:", decodedToken.email);
      return res.status(404).json({
        success: false,
        error: "User not found in system",
      });
    }

    console.log("✅ User found:", user.email, "Role:", user.role);

    // Attach user data to request object
    // Downstream middleware and controllers can access:
    // - req.user: Local database user data (role, permissions, etc.)
    // - req.firebaseUser: Decoded Firebase token (uid, email, etc.)
    req.user = user;
    req.firebaseUser = decodedToken;

    // Continue to next middleware/controller
    next();
  } catch (error) {
    // Log error for debugging
    // Common errors:
    // - Token expired (user needs to re-login)
    // - Token signature invalid (tampered token)
    // - Token from wrong Firebase project
    console.error("❌ Token verification error:", error.message);

    // Return generic error to client
    // Don't expose specific error details for security
    res.status(401).json({
      success: false,
      error: "Invalid or expired token",
    });
  }
};

/**
 * Firebase login endpoint
 * 
 * Authenticates user with Firebase token and creates/updates local user record
 * Called by frontend after successful Firebase authentication
 * Auto-creates user on first login with appropriate role
 * SuperAdmin (superadmin@ecosphere.com) always gets ID 1
 * 
 * @route POST /api/auth/firebase/login
 * @access Public
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.body - Login data
 * @param {string} req.body.email - User's email from Firebase Auth
 * @param {string} req.body.uid - Firebase user UID
 * @param {string} req.body.token - Firebase ID token for verification
 * @param {Object} res - Express response object
 * @returns {Object} User data with login log ID
 * 
 * @throws {400} If email or token is missing
 * @throws {401} If token verification fails
 * @throws {500} If user creation or login logging fails
 * 
 * @example
 * Request body: {
 *   email: "user@example.com",
 *   uid: "firebase-uid-abc123",
 *   token: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 * 
 * Response: {
 *   success: true,
 *   user: {
 *     id: 5,
 *     email: "user@example.com",
 *     firstName: "John",
 *     lastName: "Doe",
 *     role: "TeamMember",
 *     permissions: [],
 *     lastLoginId: 123
 *   }
 * }
 */
const firebaseLogin = async (req, res) => {
  try {
    // Extract login data from request body
    const { email, uid, token } = req.body;

    // Log login attempt for debugging
    console.log("📥 Firebase login attempt for:", email);

    // Validate required fields
    // Email and token are required for authentication
    // UID is optional but recommended for user creation
    if (!email || !token) {
      return res.status(400).json({
        success: false,
        error: "Email and token are required",
      });
    }

    // Step 1: Verify the Firebase token
    // This ensures the token is valid and not tampered with
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
      console.log("✅ Token verified for:", decodedToken.email);
    } catch (tokenError) {
      // Token verification failed
      // Common reasons: expired, invalid signature, wrong project
      console.error("❌ Token verification failed:", tokenError.message);
      return res.status(401).json({
        success: false,
        error: "Invalid Firebase token",
      });
    }

    // Step 2: Get or create user in local database
    // Check if user already exists
    let user = await UserService.getUserByEmail(email);

    // If user doesn't exist, create new user with appropriate role
    if (!user) {
      console.log("🆕 Creating new user for:", email);

      // Determine role based on email address
      // This allows automatic role assignment on first login
      let role = "TeamMember"; // Default role for regular users
      let isSuperAdmin = false;
      let isAdmin = false;

      // Check for special admin emails
      if (email === "superadmin@ecosphere.com") {
        role = "SuperAdmin";
        isSuperAdmin = true;
      } else if (email === "admin@ecosphere.com") {
        role = "Admin";
        isAdmin = true;
      }

      // Special handling for SuperAdmin: ensure ID is always 1
      // This is critical for system security and consistency
      if (isSuperAdmin) {
        // Read current user data from JSON file
        const data = await FileHelper.readJSON(config.usersFile);

        // Check if there's already a user with ID 1
        const existingUserWithId1 = data.users.find((u) => u.id === 1);

        // If ID 1 exists but email doesn't match, reassign that user's ID
        // This handles edge case where ID 1 was taken by another user
        if (existingUserWithId1) {
          if (existingUserWithId1.email !== email) {
            // Find highest existing ID and assign next ID to existing user
            const maxId = Math.max(...data.users.map((u) => u.id), 0);
            existingUserWithId1.id = maxId + 1;
          }
        }

        // Create SuperAdmin user with ID 1
        const superAdminUser = {
          id: 1,
          firstName: "Super",
          lastName: "Admin",
          email: email,
          role: role,
          permissions: [],
          firebaseUid: uid,
          createdAt: new Date().toISOString(),
        };

        // Remove any existing user with same email (shouldn't happen, but safety check)
        data.users = data.users.filter((u) => u.email !== email);

        // Add SuperAdmin at beginning of array
        data.users.unshift(superAdminUser);

        // Ensure nextId is at least 2 (ID 1 is reserved for SuperAdmin)
        if (data.nextId <= 1) {
          data.nextId = 2;
        }

        // Save updated user data to JSON file
        await FileHelper.writeJSON(config.usersFile, data);
        user = superAdminUser;

        console.log(`✅ Created Super Admin with ID: 1`);
      } else {
        // For Admin and regular users, use normal creation process
        // Service will auto-generate next available ID
        user = await UserService.createUser({
          email,
          firstName: isAdmin ? "System" : email.split("@")[0], // Extract name from email
          lastName: isAdmin ? "Admin" : "",
          role,
          firebaseUid: uid,
        });
        console.log(`✅ Created ${role}: ${email}`);
      }
    } else {
      // User already exists in database
      console.log(
        "✅ Found existing user:",
        email,
        "Role:",
        user.role,
        "ID:",
        user.id
      );
    }

    // Step 3: Log the successful login
    // This creates audit trail for security monitoring
    let lastLoginId = null;
    try {
      // Extract client IP address for security tracking
      // Try multiple sources as IP can be in different places depending on proxy setup
      const ipAddress =
        req.ip ||
        req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress ||
        "127.0.0.1"; // Fallback to localhost

      // Create login log entry
      const loginLog = await LoginLogService.addLog({
        email,
        role: user.role,
        status: "success",
        ipAddress,
      });
      lastLoginId = loginLog.id;
      console.log("📝 Login logged with ID:", lastLoginId);
    } catch (logError) {
      // Log error but don't fail the login
      // Login logging is important but not critical
      console.error("Failed to create login log:", logError.message);
    }

    // Step 4: Return user data to frontend
    // Frontend stores this in context/localStorage for session management
    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      role: user.role,
      permissions: user.permissions || [],
      lastLoginId, // Used to update logout time when user logs out
    };

    console.log(
      "✅ Login successful for:",
      email,
      "Role:",
      user.role,
      "ID:",
      user.id
    );

    res.json({
      success: true,
      user: userResponse,
    });
  } catch (error) {
    // Log error for debugging
    console.error("🔥 Firebase login error:", error.message);

    // Log failed login attempt for security monitoring
    // This helps detect brute force attacks or authentication issues
    if (req.body.email) {
      try {
        // Extract client IP address
        const ipAddress =
          req.ip ||
          req.headers["x-forwarded-for"] ||
          req.connection.remoteAddress ||
          "127.0.0.1";

        // Create failed login log entry
        await LoginLogService.addLog({
          email: req.body.email,
          role: "Unknown", // Role unknown for failed logins
          status: "failed",
          failureReason: error.message,
          ipAddress,
        });
      } catch (logError) {
        // Log error but don't fail the response
        console.error("Failed to log failed login:", logError);
      }
    }

    // Return generic error to client
    // Include error message for debugging (remove in production if too detailed)
    res.status(500).json({
      success: false,
      error: "Login failed: " + error.message,
    });
  }
};

/**
 * Firebase signup endpoint
 * 
 * Creates new user account linked to Firebase Auth
 * Used when admin creates user through Firebase Auth UI
 * Requires valid Firebase token to prevent unauthorized signups
 * 
 * @route POST /api/auth/firebase/signup
 * @access Public (but requires valid Firebase token)
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.body - Signup data
 * @param {string} req.body.email - User's email (must match Firebase)
 * @param {string} [req.body.firstName] - User's first name (optional, defaults to email prefix)
 * @param {string} [req.body.lastName] - User's last name (optional)
 * @param {string} [req.body.role] - User role (defaults to "TeamMember")
 * @param {string} req.body.uid - Firebase user UID
 * @param {string} req.body.token - Firebase ID token for verification
 * @param {Object} res - Express response object
 * @returns {Object} Created user data
 * 
 * @throws {400} If email is missing or user already exists
 * @throws {401} If token is missing or invalid
 * @throws {500} If user creation fails
 * 
 * @example
 * Request body: {
 *   email: "newuser@example.com",
 *   firstName: "John",
 *   lastName: "Doe",
 *   role: "TeamMember",
 *   uid: "firebase-uid-xyz789",
 *   token: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 * 
 * Response: {
 *   success: true,
 *   user: {
 *     id: 6,
 *     email: "newuser@example.com",
 *     firstName: "John",
 *     lastName: "Doe",
 *     role: "TeamMember",
 *     permissions: []
 *   }
 * }
 */
const firebaseSignup = async (req, res) => {
  try {
    // Extract signup data from request body
    const {
      email,
      firstName,
      lastName,
      role = "TeamMember", // Default to TeamMember if not specified
      uid,
      token,
    } = req.body;

    // Validate email is provided
    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    // Validate token is provided
    // Token proves user was created in Firebase Auth
    if (!token) {
      return res.status(400).json({
        success: false,
        error: "Firebase token is required",
      });
    }

    // Verify token with Firebase Admin SDK
    // This ensures signup request is legitimate
    try {
      await admin.auth().verifyIdToken(token);
    } catch (tokenError) {
      // Token verification failed
      return res.status(401).json({
        success: false,
        error: "Invalid Firebase token",
      });
    }

    // Check if user already exists in local database
    // Prevent duplicate user creation
    const existingUser = await UserService.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "User already exists",
      });
    }

    // Create user in local database
    // Service will auto-generate ID and add timestamp
    const user = await UserService.createUser({
      email,
      firstName: firstName || email.split("@")[0], // Extract name from email if not provided
      lastName: lastName || "",
      role,
      firebaseUid: uid,
    });

    // Return created user data
    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      permissions: user.permissions || [],
    };

    res.json({
      success: true,
      user: userResponse,
    });
  } catch (error) {
    // Log error for debugging
    console.error("Firebase signup error:", error);

    // Return error to client
    res.status(500).json({
      success: false,
      error: error.message || "Signup failed",
    });
  }
};

/**
 * Get user profile
 * 
 * Returns current user's profile data
 * Used by frontend to display user info and check permissions
 * Requires valid authentication token (verifyToken middleware)
 * 
 * @route GET /api/auth/profile
 * @access Protected (requires verifyToken middleware)
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.user - User data (attached by verifyToken middleware)
 * @param {Object} res - Express response object
 * @returns {Object} User profile data
 * 
 * @throws {500} If profile retrieval fails
 * 
 * @example
 * Response: {
 *   success: true,
 *   user: {
 *     id: 5,
 *     email: "user@example.com",
 *     firstName: "John",
 *     lastName: "Doe",
 *     role: "TeamMember",
 *     permissions: []
 *   }
 * }
 */
const getProfile = async (req, res) => {
  try {
    // Return user data that was attached by verifyToken middleware
    // This data comes from local database and includes role/permissions
    res.json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    // Log error for debugging
    console.error("Get profile error:", error);

    // Return error to client
    res.status(500).json({
      success: false,
      error: "Failed to get profile",
    });
  }
};

// Export all functions
module.exports = {
  verifyToken,
  firebaseLogin,
  firebaseSignup,
  getProfile,
};
