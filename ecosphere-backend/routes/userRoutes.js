// backend/routes/userRoutes.js
const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  createUser,
  adminCreateUser,
  updateUser,
  deleteUser,
} = require("../controllers/userController"); // Fix import

const { verifyToken } = require("../controllers/firebaseAuthController");

// Public routes (for auto-creation when users login)
router.post("/users", createUser);

// Protected admin routes
router.get("/users", verifyToken, getAllUsers);
router.get("/users/:id", verifyToken, getUserById);
router.post("/users/admin-create", verifyToken, adminCreateUser); // New route for admin-created users
router.put("/users/:id", verifyToken, updateUser);
router.delete("/users/:id", verifyToken, deleteUser);

module.exports = router;
