// Thermal Routes
const express = require('express');
const router = express.Router();
const {
  getAvailableDates,
  getLastCompleteDate,
  getDailyData,
  getMultipleSensorsDailyData,
  getMultipleSensorsAggregatedData,
  getThermalForecast
} = require('../controllers/thermalController');

// Forecast routes (must come before generic data routes)
router.get('/forecast/:floor/:targetDate/:forecastDays', getThermalForecast);

// Get available dates
router.get('/available-dates', getAvailableDates);

// Get last complete date
router.get('/last-complete-date', getLastCompleteDate);

// Get daily data for a single sensor
router.get('/daily/:sensorId/:date', getDailyData);

// Get daily data for multiple sensors
router.get('/daily-multiple/:date', getMultipleSensorsDailyData);

// Get aggregated data for multiple sensors (date range)
router.get('/aggregated/:dateFrom/:dateTo', getMultipleSensorsAggregatedData);

module.exports = router;
