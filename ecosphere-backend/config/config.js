// Configuration file
const path = require('path');

// Mock data directory (temporary - will be replaced with SQL Server)
const MOCK_DATA_DIR = path.join(__dirname, '../../mock-data');

module.exports = {
  port: process.env.PORT || 3001,
  usersFile: path.join(MOCK_DATA_DIR, 'users.json'),
  electricityFile: path.join(MOCK_DATA_DIR, 'electricity.json'),
  carbonFootprintFile: path.join(MOCK_DATA_DIR, 'carbonFootprint.json'),
  env: process.env.NODE_ENV || 'development'
};
