// EcoSphere Backend Server
// Modular Express server for user management
// This will be replaced with SQL Server in production
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const config = require("./config/config");
const userRoutes = require("./routes/userRoutes");
const electricityRoutes = require("./routes/electricityRoutes");
const firebaseAuthRoutes = require("./routes/firebaseAuthRoutes");

const app = express();

// Middleware
// CORS configuration for Vercel deployment
app.use(
  cors({
    origin: [
      "http://localhost:5174", // Local development
      "http://localhost:5173", // Alternative local port
      "https://ecosphere-frontend-pied.vercel.app", // Your production frontend
      "https://ecosphere-frontend.vercel.app", // Alternative frontend URL
      // Add your custom domain here if you have one
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  })
);
app.use(bodyParser.json({ limit: "10mb" }));

// Root route - Welcome message
app.get("/", (req, res) => {
  res.json({
    name: "EcoSphere Backend API",
    version: "1.0.0",
    status: "running",
    environment: config.env,
    message: "Welcome to EcoSphere Backend API",
    endpoints: {
      health: "/api/health",
      users: "/api/users",
      auth: "/api/auth/login",
      electricity: "/api/electricity/*",
    },
    documentation: "Visit /api/health for system status",
  });
});

// Import login log routes
const loginLogRoutes = require("./routes/loginLogRoutes");
const carbonFootprintReportRoutes = require("./routes/carbonFootprintReportRoutes");

// API Routes
app.use("/api", userRoutes);
app.use("/api/electricity", electricityRoutes);
app.use("/api/login-logs", loginLogRoutes);
app.use("/api/carbon-footprint-reports", carbonFootprintReportRoutes);
app.use("/api/auth", firebaseAuthRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "EcoSphere Backend is running",
    environment: config.env,
    version: "1.0.0",
    routes: {
      users: "loaded",
      electricity: "loaded",
    },
  });
});

// Test electricity endpoint
app.get("/api/electricity/test", (req, res) => {
  res.json({ message: "Electricity routes working!" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Start server (only in development, not on Vercel)
if (process.env.NODE_ENV !== "production") {
  app.listen(config.port, () => {
    console.log(
      `🚀 EcoSphere Backend running on http://localhost:${config.port}`
    );
    console.log(`📁 Users file: ${config.usersFile}`);
    console.log(`🌍 Environment: ${config.env}`);
  });
}

// Export for Vercel serverless deployment
module.exports = app;
