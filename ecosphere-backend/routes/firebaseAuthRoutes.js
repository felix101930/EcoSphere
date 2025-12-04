// ecosphere-backend/routes/firebaseAuthRoutes.js
const express = require("express");
const router = express.Router();
const {
  verifyToken,
  firebaseLogin,
  firebaseSignup,
  getProfile,
} = require("../controllers/firebaseAuthController");

// Public routes
router.post("/firebase-login", firebaseLogin);
router.post("/firebase-signup", firebaseSignup);

// Protected routes (require Firebase token)
router.get("/profile", verifyToken, getProfile);

module.exports = router;
