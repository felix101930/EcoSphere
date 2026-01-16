// Natural Gas Routes - API endpoints for natural gas data
const express = require('express');
const router = express.Router();
const naturalGasController = require('../controllers/naturalGasController');

// Consumption endpoint
router.get('/consumption', naturalGasController.getConsumption);

// Date range endpoint
router.get('/date-range', naturalGasController.getDateRange);

// Forecast endpoint
router.get('/forecast', naturalGasController.getForecast);

module.exports = router;
