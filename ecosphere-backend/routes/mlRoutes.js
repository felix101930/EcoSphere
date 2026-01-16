const express = require("express");
const router = express.Router();
const mlController = require("../controllers/MLController");

/**
 * @route   GET /api/ml/solar-forecast
 * @desc    Get solar generation forecast from ML model
 * @access  Public
 * @query   dateFrom - Start date (YYYY-MM-DD)
 * @query   dateTo - End date (YYYY-MM-DD)
 * @query   useCache - Whether to use cache (default: true)
 */
router.get("/solar-forecast", mlController.getSolarForecast);

/**
 * @route   GET /api/ml/model-info
 * @desc    Get ML model information and metrics
 * @access  Public
 */
router.get("/model-info", mlController.getModelInfo);

/**
 * @route   GET /api/ml/test
 * @desc    Test ML service connectivity
 * @access  Public
 */
router.get("/test", mlController.testMLService);

/**
 * @route   GET /api/ml/health
 * @desc    Health check for ML service
 * @access  Public
 */
router.get("/health", mlController.getHealth);

module.exports = router;
