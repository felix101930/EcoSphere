// backend/controllers/userController.js
const UserService = require("../services/userService");
const admin = require("../firebase/admin");

// Admin creates user with Firebase
const adminCreateUser = async (req, res) => {
  try {
    console.log("🔐 adminCreateUser - Checking user:", req.user);

    // Verify admin OR superadmin role
    if (req.user.role !== "Admin" && req.user.role !== "SuperAdmin") {
      console.log("❌ User is not admin or superadmin:", req.user.role);
      return res.status(403).json({ error: "Admin access required" });
    }

    console.log("✅ User has admin privileges:", req.user.role);

    const { firstName, lastName, email, password, role, permissions } =
      req.body;

    // Validation
    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if current user can create the specified role
    if (req.user.role === "Admin") {
      // Admin can only create TeamMembers
      if (role === "SuperAdmin") {
        return res
          .status(403)
          .json({ error: "Admin cannot create Super Admin" });
      }
      if (role === "Admin") {
        return res
          .status(403)
          .json({ error: "Admin cannot create other Admins" });
      }
    }

    const newUser = await UserService.addUserWithFirebase({
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

    if (error.message.includes("Firebase")) {
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

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  adminCreateUser,
  updateUser,
  deleteUser,
};
