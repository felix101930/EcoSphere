// EcoSphere Backend Server
// Modular Express server for user management
// This will be replaced with SQL Server in production
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const config = require("./config/config");
const cache = require("./utils/cache");
const connectionManager = require("./db/connectionManager");
const userRoutes = require("./routes/userRoutes");
const electricityRoutes = require("./routes/electricityRoutes");
const waterRoutes = require("./routes/waterRoutes");
const naturalGasRoutes = require("./routes/naturalGasRoutes");
const analyticsRoutes = require('./routes/analyticsRoutes'); 

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
  }),
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
      water: "/api/water/*",
      ml: {
        forecast: "/api/ml/solar-forecast",
        legacy: "/api/ml/legacy-forecast",
        model: "/api/ml/model-info",
        stats: "/api/ml/api-stats",
        test: "/api/ml/test",
        health: "/api/ml/health",
      },
    },
    documentation: "Visit /api/health for system status",
  });
});

// Import login log routes
const loginLogRoutes = require("./routes/loginLogRoutes");
const databaseTestRoutes = require("./routes/databaseTestRoutes");
const thermalRoutes = require("./routes/thermalRoutes");
const aiRoutes = require('./routes/aiRoutes');
const forecastRoutes = require("./routes/forecastRoutes");
const weatherRoutes = require("./routes/weatherRoutes");
const { forecastLimiter } = require("./middleware/rateLimiter");
const mlRoutes = require("./routes/mlRoutes");

// API Routes
app.use("/api", userRoutes); // This includes /api/auth/login
app.use("/api/electricity", electricityRoutes);
app.use("/api/water", waterRoutes);
app.use("/api/natural-gas", naturalGasRoutes);
app.use("/api/login-logs", loginLogRoutes);
app.use("/api/db", databaseTestRoutes);
app.use("/api/thermal", thermalRoutes);
app.use("/api/forecast", forecastLimiter.middleware(), forecastRoutes); // Rate limited
app.use("/api/weather", weatherRoutes);
app.use("/api/ml", mlRoutes);
app.use('/api/ai', aiRoutes); 
app.use('/api/analytics', analyticsRoutes); 

// Health check
app.get("/api/health", async (req, res) => {
  // Make it async
  const cacheStats = cache.getStats();
  const rateLimiterStats = forecastLimiter.getStats();
  const dbStatus = connectionManager.getStatus();

  // Add ML service status
  let mlStatus = { status: "unknown" };
  try {
    const MLForecastService = require("./services/MLForecastService");
    const testResult = await MLForecastService.testConnection();
    mlStatus = {
      status: testResult.success ? "healthy" : "unhealthy",
      python: testResult.python,
      model: testResult.model,
      isFallback: testResult.is_fallback || false,
    };
  } catch (error) {
    mlStatus = {
      status: "unhealthy",
      error: error.message,
    };
  }

  res.json({
    status: "ok",
    message: "EcoSphere Backend is running",
    environment: config.env,
    version: "1.0.0",
    routes: {
      users: "loaded",
      electricity: "loaded",
      water: "loaded",
      ml: "loaded",
    },
    services: {
      ml: mlStatus,
      database: dbStatus,
      cache: cacheStats.status,
      rateLimiter: rateLimiterStats.status,
    },
    cache: cacheStats,
    rateLimiter: rateLimiterStats,
    database: dbStatus,
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
  // Initialize database connection
  connectionManager
    .initialize()
    .then(() => {
      console.log("✅ Database connection initialized");
    })
    .catch((error) => {
      console.error("⚠️  Database initialization warning:", error.message);
      console.log("Server will continue with available connection method");
    });

  app.listen(config.port, () => {
    console.log(
      `🚀 EcoSphere Backend running on http://localhost:${config.port}`,
    );
    console.log(`📁 Users file: ${config.usersFile}`);
    console.log(`🌍 Environment: ${config.env}`);
    console.log(`🔧 Thermal routes loaded: /api/thermal/*`);
  });
}

// Export for Vercel serverless deployment
module.exports = app;
