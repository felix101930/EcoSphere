// Weather Routes - Handle weather data requests
const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');

// Get outdoor temperature data for date range (daily aggregated)
router.get('/outdoor-temperature', weatherController.getOutdoorTemperature);

// Get outdoor temperature data for single day (hourly)
router.get('/outdoor-temperature-hourly', weatherController.getOutdoorTemperatureHourly);

module.exports = router;
