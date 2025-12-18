// Thermal Routes
const express = require('express');
const router = express.Router();
const {
  getAvailableDates,
  getLastCompleteDate,
  getDailyData,
  getMultipleSensorsDailyData
} = require('../controllers/thermalController');

// Get available dates
router.get('/available-dates', getAvailableDates);

// Get last complete date
router.get('/last-complete-date', getLastCompleteDate);

// Get daily data for a single sensor
router.get('/daily/:sensorId/:date', getDailyData);

// Get daily data for multiple sensors
router.get('/daily-multiple/:date', getMultipleSensorsDailyData);

module.exports = router;
