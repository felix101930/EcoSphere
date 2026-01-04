// Water Routes - API endpoints for water data
const express = require('express');
const router = express.Router();
const WaterController = require('../controllers/waterController');

// Get available date range
router.get('/date-range', WaterController.getAvailableDateRange);

// Get rainwater level data
router.get('/rainwater/:dateFrom/:dateTo', WaterController.getRainwaterLevelData);

// Get hot water consumption data
router.get('/hot-water/:dateFrom/:dateTo', WaterController.getHotWaterConsumptionData);

module.exports = router;
