// backend/controllers/userController.js
const UserService = require("../services/userService");
const admin = require("../firebase/admin");

// Admin creates user (simple version without Firebase)
const adminCreateUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, permissions } =
      req.body;

    // Validation
    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newUser = await UserService.addUserSimple({
      firstName,
      lastName,
      email,
      password,
      role,
      permissions,
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error in adminCreateUser:", error);

    if (error.message === "Email already exists") {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: "Failed to create user" });
  }
};

const getAllUsers = async (req, res) => {
  try {
    console.log("📝 getAllUsers called");
    const users = await UserService.getAllUsers();
    console.log("✅ Users fetched:", users.length);
    res.json(users);
  } catch (error) {
    console.error("❌ Error in getAllUsers:", error.message);
    console.error("Stack:", error.stack);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await UserService.getUserById(req.params.id);

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Error in getUserById:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

const createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, role, permissions, firebaseUid } =
      req.body;

    // Validation
    if (!firstName || !lastName || !email || !role || !firebaseUid) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newUser = await UserService.createUser({
      firstName,
      lastName,
      email,
      role,
      permissions,
      firebaseUid,
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error in createUser:", error);

    if (error.message === "Email already exists") {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: "Failed to create user" });
  }
};

const updateUser = async (req, res) => {
  try {
    const updatedUser = await UserService.updateUser(req.params.id, req.body);
    res.json(updatedUser);
  } catch (error) {
    console.error("Error in updateUser:", error);

    if (error.message === "User not found") {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({ error: "Failed to update user" });
  }
};

const deleteUser = async (req, res) => {
  try {
    // Get user first to get Firebase UID
    const user = await UserService.getUserById(req.params.id);
    if (!user) {
      throw new Error("User not found");
    }

    // Delete from Firebase if UID exists
    if (user.firebaseUid) {
      try {
        await UserService.deleteUserFromFirebase(user.firebaseUid);
        console.log("✅ Deleted user from Firebase:", user.email);
      } catch (firebaseError) {
        console.error(
          "❌ Error deleting from Firebase:",
          firebaseError.message
        );
        // Continue with database deletion even if Firebase fails
      }
    }

    // Delete from our database
    const deletedUser = await UserService.deleteUser(req.params.id);
    res.json(deletedUser);
  } catch (error) {
    console.error("Error in deleteUser:", error);

    if (error.message === "User not found") {
      return res.status(404).json({ error: error.message });
    }

    if (error.message === "Cannot delete Super Admin") {
      return res.status(403).json({ error: error.message });
    }

    res.status(500).json({ error: "Failed to delete user" });
  }
};

// Simple login function (no Firebase)
const login = async (req, res) => {
  try {
    const { email, password, ipAddress } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Authenticate user
    const user = await UserService.authenticateUser(email, password);

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Create login log
    const LoginLogService = require("../services/loginLogService");
    const loginLog = await LoginLogService.addLog({
      email: user.email,
      role: user.role,
      status: "success",
      ipAddress: ipAddress || "127.0.0.1",
    });

    // Add login log ID to user object
    user.lastLoginId = loginLog.id;

    res.json({ user });
  } catch (error) {
    console.error("Error in login:", error);
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
