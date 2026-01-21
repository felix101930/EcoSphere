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
  login,
} = require("../controllers/userController");

// Public routes
router.post("/auth/login", login); // Simple login route

// Admin routes (no auth middleware for now - simplified)
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.post("/users", createUser);
router.post("/users/admin-create", adminCreateUser);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

module.exports = router;
