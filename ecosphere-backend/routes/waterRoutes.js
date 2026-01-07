// Water Routes - API endpoints for water data
const express = require('express');
const router = express.Router();
const WaterController = require('../controllers/waterController');

// Get available date range
router.get('/date-range', WaterController.getAvailableDateRange);

// Forecast routes (must come before generic data routes)
router.get('/hot-water/forecast/:targetDate/:forecastDays', WaterController.getHotWaterForecast);
router.get('/rainwater/forecast/:targetDate/:forecastDays', WaterController.getRainwaterForecast);

// Data routes
router.get('/rainwater/:dateFrom/:dateTo', WaterController.getRainwaterLevelData);
router.get('/hot-water/:dateFrom/:dateTo', WaterController.getHotWaterConsumptionData);

module.exports = router;
