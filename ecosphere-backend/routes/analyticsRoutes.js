// Path: ecosphere-backend/routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// GET /api/analytics/date-range
router.get('/date-range', analyticsController.getAnalyticsDateRange);

// POST /api/analytics/custom
router.post('/custom', analyticsController.getCustomAnalytics);

module.exports = router;