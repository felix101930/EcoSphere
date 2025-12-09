// ecosphere-backend/controllers/firebaseAuthController.js
const admin = require("../firebase/admin");
const UserService = require("../services/userService");
const LoginLogService = require("../services/loginLogService");
const FileHelper = require("../utils/fileHelper");
const config = require("../config/config");

// Convert static methods to regular functions

const verifyToken = async (req, res, next) => {
  try {
    // Get token from Authorization header OR request body
    const token = req.headers.authorization?.split(" ")[1] || req.body?.token;

    console.log("🔐 verifyToken - Token present:", !!token);
    console.log(
      "🔐 Headers authorization:",
      req.headers.authorization?.substring(0, 50)
    );

    if (!token) {
      console.log("❌ No token provided");
      return res.status(401).json({
        success: false,
        error: "No Firebase token provided",
      });
    }

    // Check if Firebase Admin is initialized
    if (!admin) {
      console.error("Firebase Admin not initialized");
      return res.status(500).json({
        success: false,
        error: "Authentication service not available",
      });
    }

    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log("✅ Token verified for:", decodedToken.email);

    // Get user by email from our database
    const user = await UserService.getUserByEmail(decodedToken.email);

    if (!user) {
      console.log("❌ User not found in system:", decodedToken.email);
      return res.status(404).json({
        success: false,
        error: "User not found in system",
      });
    }

    console.log("✅ User found:", user.email, "Role:", user.role);

    // Attach user to request
    req.user = user;
    req.firebaseUser = decodedToken;

    next();
  } catch (error) {
    console.error("❌ Token verification error:", error.message);

    res.status(401).json({
      success: false,
      error: "Invalid or expired token",
    });
  }
};

const firebaseLogin = async (req, res) => {
  try {
    const { email, uid, token } = req.body;

    console.log("📥 Firebase login attempt for:", email);

    if (!email || !token) {
      return res.status(400).json({
        success: false,
        error: "Email and token are required",
      });
    }

    // Verify the Firebase token
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
      console.log("✅ Token verified for:", decodedToken.email);
    } catch (tokenError) {
      console.error("❌ Token verification failed:", tokenError.message);
      return res.status(401).json({
        success: false,
        error: "Invalid Firebase token",
      });
    }

    // Get or create user
    let user = await UserService.getUserByEmail(email);

    if (!user) {
      console.log("🆕 Creating new user for:", email);

      // Determine role based on email
      let role = "TeamMember";
      let isSuperAdmin = false;
      let isAdmin = false;

      if (email === "superadmin@ecosphere.com") {
        role = "SuperAdmin";
        isSuperAdmin = true;
      } else if (email === "admin@ecosphere.com") {
        role = "Admin";
        isAdmin = true;
      }

      // If superadmin, ensure ID is 1
      if (isSuperAdmin) {
        // Read current data
        const data = await FileHelper.readJSON(config.usersFile);

        // Check if there's already a user with ID 1
        const existingUserWithId1 = data.users.find((u) => u.id === 1);
        if (existingUserWithId1) {
          // If ID 1 exists but email doesn't match, we need to handle it
          if (existingUserWithId1.email !== email) {
            // Reassign ID for the existing user
            const maxId = Math.max(...data.users.map((u) => u.id), 0);
            existingUserWithId1.id = maxId + 1;
          }
        }

        // Create superadmin with ID 1
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

        // Add to users array (remove any existing superadmin with same email)
        data.users = data.users.filter((u) => u.email !== email);
        data.users.unshift(superAdminUser); // Add at beginning

        // Ensure nextId is at least 2
        if (data.nextId <= 1) {
          data.nextId = 2;
        }

        await FileHelper.writeJSON(config.usersFile, data);
        user = superAdminUser;

        console.log(`✅ Created Super Admin with ID: 1`);
      } else {
        // For admin and regular users, use normal creation
        user = await UserService.createUser({
          email,
          firstName: isAdmin ? "System" : email.split("@")[0],
          lastName: isAdmin ? "Admin" : "",
          role,
          firebaseUid: uid,
        });
        console.log(`✅ Created ${role}: ${email}`);
      }
    } else {
      console.log(
        "✅ Found existing user:",
        email,
        "Role:",
        user.role,
        "ID:",
        user.id
      );
    }

    // Log the login
    let lastLoginId = null;
    try {
      const ipAddress =
        req.ip ||
        req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress ||
        "127.0.0.1";

      const loginLog = await LoginLogService.addLog({
        email,
        role: user.role,
        status: "success",
        ipAddress,
      });
      lastLoginId = loginLog.id;
      console.log("📝 Login logged with ID:", lastLoginId);
    } catch (logError) {
      console.error("Failed to create login log:", logError.message);
    }

    // Return user data
    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      role: user.role,
      permissions: user.permissions || [],
      lastLoginId,
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
    console.error("🔥 Firebase login error:", error.message);

    // Log failed login attempt
    if (req.body.email) {
      try {
        const ipAddress =
          req.ip ||
          req.headers["x-forwarded-for"] ||
          req.connection.remoteAddress ||
          "127.0.0.1";

        await LoginLogService.addLog({
          email: req.body.email,
          role: "Unknown",
          status: "failed",
          failureReason: error.message,
          ipAddress,
        });
      } catch (logError) {
        console.error("Failed to log failed login:", logError);
      }
    }

    res.status(500).json({
      success: false,
      error: "Login failed: " + error.message,
    });
  }
};

const firebaseSignup = async (req, res) => {
  try {
    const {
      email,
      firstName,
      lastName,
      role = "TeamMember",
      uid,
      token,
    } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    if (!token) {
      return res.status(400).json({
        success: false,
        error: "Firebase token is required",
      });
    }

    // Verify token first
    try {
      await admin.auth().verifyIdToken(token);
    } catch (tokenError) {
      return res.status(401).json({
        success: false,
        error: "Invalid Firebase token",
      });
    }

    // Check if user already exists
    const existingUser = await UserService.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "User already exists",
      });
    }

    // Create user in our database
    const user = await UserService.createUser({
      email,
      firstName: firstName || email.split("@")[0],
      lastName: lastName || "",
      role,
      firebaseUid: uid,
    });

    // Return user data
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
    console.error("Firebase signup error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Signup failed",
    });
  }
};

const getProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get profile",
    });
  }
};

// Export as regular functions
module.exports = {
  verifyToken,
  firebaseLogin,
  firebaseSignup,
  getProfile,
};
