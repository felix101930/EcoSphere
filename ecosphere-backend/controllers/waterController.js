// Water Controller - Handle water data requests
const WaterService = require('../services/waterService');
const ForecastService = require('../services/forecastService');
const { TABLE_NAMES } = require('../config/database');
const { sendError } = require('../utils/responseHelper');
const { HTTP_STATUS } = require('../utils/constants');
const { asyncHandler, createDataFetcher, validateParams } = require('../utils/controllerHelper');

// Water-specific constants
const WATER_DATA_SOURCES = {
    RAINWATER: 'TL93 (Rain_Water_Level_POLL)',
    HOT_WATER: 'TL210 (GBT Domestic Hot Water consumption)'
};

const WATER_UNITS = {
    RAINWATER: '%',
    HOT_WATER: 'L/h'
};

const WATER_AGGREGATION = {
    RAINWATER: 'hourly_average',
    HOT_WATER: 'hourly_sum'
};

/**
 * Get available date range for water data
 */
const getAvailableDateRange = asyncHandler(async (req, res) => {
    // Get date ranges for both water tables
    const rainwaterRange = await WaterService.getAvailableDateRange(TABLE_NAMES.RAINWATER_LEVEL);
    const hotWaterRange = await WaterService.getAvailableDateRange(TABLE_NAMES.HOT_WATER_CONSUMPTION);

    // Keep backward compatible response format
    res.json({
        success: true,
        dateRanges: {
            rainwater: rainwaterRange,
            hotWater: hotWaterRange
        }
    });
});

/**
 * Get rainwater level data
 * Uses createDataFetcher to eliminate boilerplate code
 */
const getRainwaterLevelData = createDataFetcher({
    fetchDataFn: WaterService.getRainwaterLevelData.bind(WaterService),
    calculateMetricsFn: WaterService.calculateMetrics.bind(WaterService),
    dataSource: WATER_DATA_SOURCES.RAINWATER,
    additionalMetadata: {
        unit: WATER_UNITS.RAINWATER,
        aggregation: WATER_AGGREGATION.RAINWATER
    }
});

/**
 * Get hot water consumption data
 * Uses createDataFetcher to eliminate boilerplate code
 */
const getHotWaterConsumptionData = createDataFetcher({
    fetchDataFn: WaterService.getHotWaterConsumptionData.bind(WaterService),
    calculateMetricsFn: WaterService.calculateMetrics.bind(WaterService),
    dataSource: WATER_DATA_SOURCES.HOT_WATER,
    additionalMetadata: {
        unit: WATER_UNITS.HOT_WATER,
        aggregation: WATER_AGGREGATION.HOT_WATER
    }
});

/**
 * Get hot water consumption forecast
 */
const getHotWaterForecast = asyncHandler(async (req, res) => {
    const { targetDate, forecastDays } = req.params;

    // Validate parameters
    validateParams({ targetDate, forecastDays });

    const days = parseInt(forecastDays);
    if (isNaN(days) || days < 1 || days > 30) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            error: 'forecastDays must be between 1 and 30'
        });
    }

    // Calculate start date (1 year before target date for training)
    const target = new Date(targetDate + 'T12:00:00');
    const startDate = new Date(target);
    startDate.setDate(startDate.getDate() - 365);

    const startDateStr = formatDate(startDate);
    const targetDateStr = targetDate;

    // Fetch historical hot water consumption data
    const historicalData = await WaterService.getHotWaterConsumptionData(
        startDateStr,
        targetDateStr
    );

    if (!historicalData || historicalData.length === 0) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
            success: false,
            error: 'No historical data available for the specified period'
        });
    }

    // Generate forecast
    const forecastResult = await ForecastService.generateForecast(
        targetDate,
        days,
        historicalData
    );

    // Return response
    res.json({
        success: true,
        targetDate: targetDate,
        forecastDays: days,
        predictions: forecastResult.predictions,
        metadata: forecastResult.metadata
    });
});

/**
 * Helper: Format date to YYYY-MM-DD
 */
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

module.exports = {
    getAvailableDateRange,
    getRainwaterLevelData,
    getHotWaterConsumptionData,
    getHotWaterForecast
};
