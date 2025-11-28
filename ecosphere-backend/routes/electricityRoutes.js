// Electricity Routes
const express = require('express');
const router = express.Router();
const electricityController = require('../controllers/electricityController');

// GET /api/electricity/all - Get all records
router.get('/all', electricityController.getAllRecords.bind(electricityController));

// GET /api/electricity/range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get('/range', electricityController.getRecordsByDateRange.bind(electricityController));

// GET /api/electricity/realtime - Get today's data
router.get('/realtime', electricityController.getRealTimeData.bind(electricityController));

// GET /api/electricity/daily?days=10 - Get last N days
router.get('/daily', electricityController.getDailyData.bind(electricityController));

// GET /api/electricity/longterm - Get last 12 months
router.get('/longterm', electricityController.getLongTermData.bind(electricityController));

// GET /api/electricity/metadata - Get metadata
router.get('/metadata', electricityController.getMetadata.bind(electricityController));

module.exports = router;
