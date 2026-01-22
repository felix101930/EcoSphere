// Path: ecosphere-backend/routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// POST /api/analytics/custom
router.post('/custom', analyticsController.getCustomAnalytics);

module.exports = router;