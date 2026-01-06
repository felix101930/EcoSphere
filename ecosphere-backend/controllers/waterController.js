// Water Controller - Handle water data requests
const WaterService = require('../services/waterService');
const { TABLE_NAMES } = require('../config/database');
const { sendError } = require('../utils/responseHelper');
const { HTTP_STATUS } = require('../utils/constants');
const { asyncHandler, createDataFetcher } = require('../utils/controllerHelper');

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

module.exports = {
    getAvailableDateRange,
    getRainwaterLevelData,
    getHotWaterConsumptionData
};
