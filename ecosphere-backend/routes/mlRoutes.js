const express = require("express");
const router = express.Router();
const mlController = require("../controllers/MLController");

/**
 * @route   GET /api/ml/solar-forecast
 * @desc    Get enhanced solar generation forecast with weather data
 * @access  Public
 */
router.get("/solar-forecast", mlController.getSolarForecast);

/**
 * @route   GET /api/ml/legacy-forecast
 * @desc    Get legacy solar forecast (backward compatibility)
 * @access  Public
 */
router.get("/legacy-forecast", mlController.getLegacySolarForecast);

/**
 * @route   GET /api/ml/model-info
 * @desc    Get ML model information and metrics
 * @access  Public
 */
router.get("/model-info", mlController.getModelInfo);

/**
 * @route   GET /api/ml/api-stats
 * @desc    Get API usage statistics
 * @access  Public
 */
router.get("/api-stats", mlController.getApiStats);

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
