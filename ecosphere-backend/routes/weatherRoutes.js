// Weather Routes - Handle weather data requests
const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');

// Get outdoor temperature data for date range
router.get('/outdoor-temperature', weatherController.getOutdoorTemperature);

module.exports = router;
