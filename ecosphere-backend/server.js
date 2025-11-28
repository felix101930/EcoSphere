// EcoSphere Backend Server
// Modular Express server for user management
// This will be replaced with SQL Server in production

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const config = require('./config/config');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// API Routes
app.use('/api', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'EcoSphere Backend is running',
    environment: config.env,
    version: '1.0.0'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(config.port, () => {
  console.log(`🚀 EcoSphere Backend running on http://localhost:${config.port}`);
  console.log(`📁 Users file: ${config.usersFile}`);
  console.log(`🌍 Environment: ${config.env}`);
});
