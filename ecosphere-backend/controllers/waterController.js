// Water Controller - Handle water data requests
const WaterService = require('../services/waterService');
const { TABLE_NAMES } = require('../config/database');

/**
 * Get available date range for water data
 */
const getAvailableDateRange = async (req, res) => {
    try {
        // Get date ranges for both water tables
        const rainwaterRange = await WaterService.getAvailableDateRange(TABLE_NAMES.RAINWATER_LEVEL);
        const hotWaterRange = await WaterService.getAvailableDateRange(TABLE_NAMES.HOT_WATER_CONSUMPTION);

        res.json({
            success: true,
            dateRanges: {
                rainwater: rainwaterRange,
                hotWater: hotWaterRange
            }
        });
    } catch (error) {
        console.error('Error in getAvailableDateRange:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch available date range'
        });
    }
};

/**
 * Get rainwater level data
 */
const getRainwaterLevelData = async (req, res) => {
    try {
        const { dateFrom, dateTo } = req.params;

        if (!dateFrom || !dateTo) {
            return res.status(400).json({
                success: false,
                error: 'Missing dateFrom or dateTo parameter'
            });
        }

        const data = await WaterService.getRainwaterLevelData(dateFrom, dateTo);
        const metrics = WaterService.calculateMetrics(data);

        res.json({
            success: true,
            dateFrom,
            dateTo,
            dataSource: 'TL93 (Rain_Water_Level_POLL)',
            count: data.length,
            unit: '%',
            aggregation: 'hourly_average',
            data,
            metrics
        });
    } catch (error) {
        console.error('Error in getRainwaterLevelData:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch rainwater level data'
        });
    }
};

/**
 * Get hot water consumption data
 */
const getHotWaterConsumptionData = async (req, res) => {
    try {
        const { dateFrom, dateTo } = req.params;

        if (!dateFrom || !dateTo) {
            return res.status(400).json({
                success: false,
                error: 'Missing dateFrom or dateTo parameter'
            });
        }

        const data = await WaterService.getHotWaterConsumptionData(dateFrom, dateTo);
        const metrics = WaterService.calculateMetrics(data);

        res.json({
            success: true,
            dateFrom,
            dateTo,
            dataSource: 'TL210 (GBT Domestic Hot Water consumption)',
            count: data.length,
            unit: 'L/h',
            aggregation: 'hourly_sum',
            data,
            metrics
        });
    } catch (error) {
        console.error('Error in getHotWaterConsumptionData:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch hot water consumption data'
        });
    }
};

module.exports = {
    getAvailableDateRange,
    getRainwaterLevelData,
    getHotWaterConsumptionData
};
