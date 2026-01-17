// Natural Gas Routes - API endpoints for natural gas data
const express = require('express');
const router = express.Router();
const naturalGasController = require('../controllers/naturalGasController');
const { forecastLimiter } = require('../middleware/rateLimiter');

// Consumption endpoint
router.get('/consumption', naturalGasController.getConsumption);

// Date range endpoint
router.get('/date-range', naturalGasController.getDateRange);

// All data endpoint
router.get('/all-data', naturalGasController.getAllData);

// Forecast endpoint (with rate limiting)
router.get('/forecast', forecastLimiter.middleware(), naturalGasController.getForecast);

module.exports = router;
