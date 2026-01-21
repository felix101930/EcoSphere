// ML Controller - Handle ML prediction requests
const MLForecastService = require("../services/MLForecastService");
const { asyncHandler } = require("../utils/controllerHelper");
const { sendError, sendDataWithMetadata } = require("../utils/responseHelper");
const { HTTP_STATUS } = require("../utils/constants");

/**
 * Get solar generation forecast from ML model
 */
const getSolarForecast = asyncHandler(async (req, res) => {
  const {
    dateFrom,
    dateTo,
    useCache = "true",
    useWeather = "true",
    forceFresh = "false",
    lat,
    lon,
  } = req.query;

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

  // Validate and limit to 48 hours max
  const startDate = new Date(dateFrom);
  const endDate = new Date(dateTo);
  const now = new Date();

  const hoursDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60));

  if (hoursDiff > 48) {
    return sendError(
      res,
      HTTP_STATUS.BAD_REQUEST,
      "Forecast limited to maximum 48 hours",
      { max_hours: 48, requested_hours: hoursDiff },
    );
  }

  // Don't allow forecasting too far into the future
  const maxEndDate = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  if (endDate > maxEndDate) {
    return sendError(
      res,
      HTTP_STATUS.BAD_REQUEST,
      "Cannot forecast more than 48 hours into the future",
    );
  }

  try {
    // Get forecast from enhanced service
    const forecast = await MLForecastService.getSolarForecast(
      dateFrom,
      dateTo,
      {
        useCache: useCache !== "false",
        useWeather: useWeather !== "false",
        forceFresh: forceFresh === "true",
        coordinates:
          lat && lon ? { lat: parseFloat(lat), lon: parseFloat(lon) } : null,
      },
    );

    // Add API stats
    const apiStats = await MLForecastService.getApiStats();

    const response = {
      ...forecast,
      api_stats: apiStats.success
        ? apiStats
        : {
            calls_today: 0,
            max_calls_per_day: 950,
            remaining_calls: 950,
            last_reset: new Date().toISOString(),
            today: new Date().toISOString().split("T")[0],
          },
    };

    sendDataWithMetadata(res, response);
  } catch (error) {
    console.error("Enhanced forecast controller error:", error);

    // Try to return fallback data
    try {
      const fallback = MLForecastService.getFallbackForecast(dateFrom, dateTo);
      fallback.metadata = {
        ...fallback.metadata,
        error: error.message,
        dateFrom,
        dateTo,
        is_fallback: true,
      };

      // Add API stats even for fallback
      try {
        const apiStats = await MLForecastService.getApiStats();
        fallback.api_stats = apiStats.success
          ? apiStats
          : {
              calls_today: 0,
              max_calls_per_day: 950,
              remaining_calls: 950,
            };
      } catch (statsError) {
        fallback.api_stats = {
          calls_today: 0,
          max_calls_per_day: 950,
          remaining_calls: 950,
        };
      }

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

// For backward compatibility - legacy endpoint
const getLegacySolarForecast = asyncHandler(async (req, res) => {
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
      {
        useCache: useCacheBool,
        useWeather: false, // Legacy doesn't use weather
        forceFresh: false,
      },
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
    console.error("Legacy forecast controller error:", error);

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
 * Get API usage statistics
 */
const getApiStats = asyncHandler(async (req, res) => {
  try {
    const stats = await MLForecastService.getApiStats();
    res.json(stats);
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      calls_today: 0,
      max_calls_per_day: 950,
      remaining_calls: 950,
      last_reset: new Date().toISOString(),
      today: new Date().toISOString().split("T")[0],
    });
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
        enhancedForecast:
          "/api/ml/enhanced-forecast?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD&useWeather=true",
        modelInfo: "/api/ml/model-info",
        apiStats: "/api/ml/api-stats",
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
      {
        useCache: false,
        useWeather: true,
        forceFresh: false,
      },
    );
    health.checks.prediction = {
      status: forecast.success ? "healthy" : "unhealthy",
      predictions: forecast.summary.prediction_count,
      isFallback: forecast.model_info.is_fallback || false,
      weatherIntegrated: forecast.model_info.weather_integrated || false,
    };

    // Test API stats
    const apiStats = await MLForecastService.getApiStats();
    health.checks.api = {
      status: apiStats.success ? "healthy" : "degraded",
      calls_today: apiStats.calls_today || 0,
      max_calls_per_day: apiStats.max_calls_per_day || 950,
      remaining_calls: apiStats.remaining_calls || 950,
    };

    // Determine overall status
    const allHealthy = Object.values(health.checks).every(
      (c) => c.status === "healthy",
    );
    const anyUnhealthy = Object.values(health.checks).some(
      (c) => c.status === "unhealthy",
    );

    if (anyUnhealthy) {
      health.status = "unhealthy";
    } else if (!allHealthy) {
      health.status = "degraded";
    } else {
      health.status = "healthy";
    }

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
  getLegacySolarForecast,
  getModelInfo,
  testMLService,
  getHealth,
  getApiStats,
};
