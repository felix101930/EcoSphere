// ML Controller - Handle ML prediction requests
const MLForecastService = require("../services/MLForecastService");
const { asyncHandler } = require("../utils/controllerHelper");
const { sendError, sendDataWithMetadata } = require("../utils/responseHelper");
const { HTTP_STATUS } = require("../utils/constants");

/**
 * Get solar generation forecast from ML model
 */
const getSolarForecast = asyncHandler(async (req, res) => {
  const { dateFrom, dateTo, useCache = "true" } = req.query;

  // Validate required parameters
  if (!dateFrom || !dateTo) {
    return sendError(
      res,
      HTTP_STATUS.BAD_REQUEST,
      "Missing required parameters: dateFrom and dateTo",
    );
  }

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateFrom) || !dateRegex.test(dateTo)) {
    return sendError(
      res,
      HTTP_STATUS.BAD_REQUEST,
      "Invalid date format. Use YYYY-MM-DD",
    );
  }

  // Validate date range
  const startDate = new Date(dateFrom);
  const endDate = new Date(dateTo);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return sendError(res, HTTP_STATUS.BAD_REQUEST, "Invalid date values");
  }

  if (endDate < startDate) {
    return sendError(
      res,
      HTTP_STATUS.BAD_REQUEST,
      "End date must be after start date",
    );
  }

  // Calculate days difference
  const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

  // Limit to reasonable range
  if (daysDiff > 365) {
    return sendError(
      res,
      HTTP_STATUS.BAD_REQUEST,
      "Date range too large. Maximum 365 days",
    );
  }

  try {
    // Get forecast from ML service
    const useCacheBool = useCache !== "false";
    const forecast = await MLForecastService.getSolarForecast(
      dateFrom,
      dateTo,
      useCacheBool,
    );

    // Prepare response
    const response = {
      success: forecast.success,
      data: forecast.data,
      summary: forecast.summary,
      modelInfo: forecast.model_info,
      metadata: {
        ...forecast.metadata,
        dateFrom,
        dateTo,
        days: daysDiff + 1,
        hours: forecast.summary.prediction_count,
        generatedAt: new Date().toISOString(),
        cacheUsed: useCacheBool,
      },
    };

    // Add warning if using fallback
    if (forecast.warning) {
      response.warning = forecast.warning;
    }

    sendDataWithMetadata(res, response);
  } catch (error) {
    console.error("Forecast controller error:", error);

    // Try to return fallback data
    try {
      const fallback = MLForecastService.getFallbackForecast(dateFrom, dateTo);
      fallback.metadata = {
        ...fallback.metadata,
        error: error.message,
        dateFrom,
        dateTo,
      };

      sendDataWithMetadata(res, fallback);
    } catch (fallbackError) {
      sendError(
        res,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        `Failed to generate forecast: ${error.message}`,
      );
    }
  }
});

/**
 * Get ML model information
 */
const getModelInfo = asyncHandler(async (req, res) => {
  try {
    const modelInfo = await MLForecastService.getModelInfo();

    res.json({
      success: true,
      ...modelInfo,
      service: {
        ...modelInfo.service,
        mlServicePath: MLForecastService.mlServicePath,
        cacheEnabled: true,
        cacheTTL: `${MLForecastService.CACHE_TTL / 1000 / 60} minutes`,
      },
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      service: "ML service not available",
    });
  }
});

/**
 * Test ML service connectivity
 */
const testMLService = asyncHandler(async (req, res) => {
  try {
    const testResult = await MLForecastService.testConnection();

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...testResult,
      endpoints: {
        forecast:
          "/api/ml/solar-forecast?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD",
        modelInfo: "/api/ml/model-info",
        health: "/api/ml/health",
      },
    });
  } catch (error) {
    res.json({
      success: false,
      timestamp: new Date().toISOString(),
      error: error.message,
      status: "Service unavailable",
    });
  }
});

/**
 * Health check endpoint
 */
const getHealth = asyncHandler(async (req, res) => {
  const health = {
    status: "unknown",
    timestamp: new Date().toISOString(),
    checks: {},
  };

  try {
    // Test Python detection
    const python = await MLForecastService.getPythonWithVenv().catch(
      () => null,
    );
    health.checks.python = {
      status: python ? "healthy" : "unhealthy",
      executable: python || "Not found",
    };

    // Test model loading
    const modelInfo = await MLForecastService.getModelInfo();
    health.checks.model = {
      status: modelInfo.success ? "healthy" : "unhealthy",
      loaded: modelInfo.success,
      type: modelInfo.success ? modelInfo.model.type : "Unknown",
    };

    // Test prediction
    const testDate = new Date().toISOString().split("T")[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const forecast = await MLForecastService.getSolarForecast(
      testDate,
      tomorrowStr,
      false,
    );
    health.checks.prediction = {
      status: forecast.success ? "healthy" : "unhealthy",
      predictions: forecast.summary.prediction_count,
      isFallback: forecast.model_info.is_fallback || false,
    };

    // Determine overall status
    const allHealthy = Object.values(health.checks).every(
      (c) => c.status === "healthy",
    );
    health.status = allHealthy ? "healthy" : "degraded";

    if (health.checks.prediction.isFallback) {
      health.status = "degraded";
      health.warning = "Using fallback predictions";
    }
  } catch (error) {
    health.status = "unhealthy";
    health.error = error.message;
  }

  res.json(health);
});

module.exports = {
  getSolarForecast,
  getModelInfo,
  testMLService,
  getHealth,
};
