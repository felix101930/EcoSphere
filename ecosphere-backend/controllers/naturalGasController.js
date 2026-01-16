// Natural Gas Controller - Handle natural gas API requests
const NaturalGasService = require('../services/naturalGasService');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { asyncHandler } = require('../utils/controllerHelper');
const { validateDateRange } = require('../utils/validationHelper');

/**
 * Get consumption data
 * GET /api/natural-gas/consumption?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD
 */
const getConsumption = asyncHandler(async (req, res) => {
    const { dateFrom, dateTo } = req.query;

    // Validate date range
    const validation = validateDateRange(dateFrom, dateTo);
    if (!validation.isValid) {
        return sendError(res, 400, validation.error);
    }

    // Get data
    const data = await NaturalGasService.getConsumptionData(dateFrom, dateTo);

    sendSuccess(res, data);
});

/**
 * Get available date range
 * GET /api/natural-gas/date-range
 */
const getDateRange = asyncHandler(async (req, res) => {
    const dateRange = await NaturalGasService.getDateRange();
    sendSuccess(res, dateRange);
});

module.exports = {
    getConsumption,
    getDateRange
};
