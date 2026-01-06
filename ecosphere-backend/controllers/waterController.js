// Water Controller - Handle water data requests
const WaterService = require('../services/waterService');
const { TABLE_NAMES } = require('../config/database');
const { sendSuccess, sendError, sendDataWithMetadata } = require('../utils/responseHelper');
const { validateDateRange } = require('../utils/validationHelper');
const { HTTP_STATUS } = require('../utils/constants');

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
const getAvailableDateRange = async (req, res) => {
    try {
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
    } catch (error) {
        console.error('Error in getAvailableDateRange:', error);
        sendError(res, HTTP_STATUS.SERVER_ERROR, 'Failed to fetch available date range');
    }
};

/**
 * Get rainwater level data
 */
const getRainwaterLevelData = async (req, res) => {
    try {
        const { dateFrom, dateTo } = req.params;

        // Validate date range
        const validation = validateDateRange(dateFrom, dateTo);
        if (!validation.isValid) {
            return sendError(res, HTTP_STATUS.BAD_REQUEST, validation.error);
        }

        const data = await WaterService.getRainwaterLevelData(dateFrom, dateTo);
        const metrics = WaterService.calculateMetrics(data);

        sendDataWithMetadata(res, {
            data,
            metadata: {
                dateFrom,
                dateTo,
                dataSource: WATER_DATA_SOURCES.RAINWATER,
                count: data.length,
                unit: WATER_UNITS.RAINWATER,
                aggregation: WATER_AGGREGATION.RAINWATER,
                metrics
            }
        });
    } catch (error) {
        console.error('Error in getRainwaterLevelData:', error);
        sendError(res, HTTP_STATUS.SERVER_ERROR, 'Failed to fetch rainwater level data');
    }
};

/**
 * Get hot water consumption data
 */
const getHotWaterConsumptionData = async (req, res) => {
    try {
        const { dateFrom, dateTo } = req.params;

        // Validate date range
        const validation = validateDateRange(dateFrom, dateTo);
        if (!validation.isValid) {
            return sendError(res, HTTP_STATUS.BAD_REQUEST, validation.error);
        }

        const data = await WaterService.getHotWaterConsumptionData(dateFrom, dateTo);
        const metrics = WaterService.calculateMetrics(data);

        sendDataWithMetadata(res, {
            data,
            metadata: {
                dateFrom,
                dateTo,
                dataSource: WATER_DATA_SOURCES.HOT_WATER,
                count: data.length,
                unit: WATER_UNITS.HOT_WATER,
                aggregation: WATER_AGGREGATION.HOT_WATER,
                metrics
            }
        });
    } catch (error) {
        console.error('Error in getHotWaterConsumptionData:', error);
        sendError(res, HTTP_STATUS.SERVER_ERROR, 'Failed to fetch hot water consumption data');
    }
};

module.exports = {
    getAvailableDateRange,
    getRainwaterLevelData,
    getHotWaterConsumptionData
};
