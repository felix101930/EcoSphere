// Configuration file
const path = require('path');

// Mock data directory (temporary - will be replaced with SQL Server)
const MOCK_DATA_DIR = path.join(__dirname, '../../mock-data');

module.exports = {
  port: process.env.PORT || 3001,
  usersFile: path.join(MOCK_DATA_DIR, 'users.json'),
  electricityFile: path.join(MOCK_DATA_DIR, 'electricity.json'),
  carbonFootprintFile: path.join(MOCK_DATA_DIR, 'carbonFootprint.json'),
  env: process.env.NODE_ENV || 'development',
  
  // Electricity Maps API
  electricityMapsApiKey: process.env.ELECTRICITY_MAPS_API_KEY,
  electricityMapsZone: process.env.ELECTRICITY_MAPS_ZONE || 'CA-AB',
  electricityMapsApiUrl: process.env.ELECTRICITY_MAPS_API_URL || 'https://api.electricitymaps.com/v3',
  fallbackCarbonIntensity: parseFloat(process.env.FALLBACK_CARBON_INTENSITY) || 0.65
};
