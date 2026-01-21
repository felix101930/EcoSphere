// Natural Gas Controller - Handle natural gas API requests
const NaturalGasService = require('../services/naturalGasService');
const NaturalGasForecastService = require('../services/naturalGasForecastService');
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

/**
 * Get all historical data
 * GET /api/natural-gas/all-data
 */
const getAllData = asyncHandler(async (req, res) => {
    const allData = await NaturalGasService.getAllData();
    sendSuccess(res, allData);
});

/**
 * Get forecast
 * GET /api/natural-gas/forecast?targetDate=YYYY-MM-DD&forecastMonths=6
 */
const getForecast = asyncHandler(async (req, res) => {
    const { targetDate, forecastMonths = 6 } = req.query;

    // Validate target date
    if (!targetDate) {
        return sendError(res, 400, 'Target date is required');
    }

    // Validate forecast months
    const months = parseInt(forecastMonths);
    if (isNaN(months) || months < 1 || months > 12) {
        return sendError(res, 400, 'Forecast months must be between 1 and 12');
    }

    // Get historical data (all available data for training)
    const allData = await NaturalGasService.getAllData();

    // Generate forecast
    const forecast = await NaturalGasForecastService.generateForecast(
        targetDate,
        months,
        allData
    );

    sendSuccess(res, forecast);
});

module.exports = {
    getConsumption,
    getDateRange,
    getAllData,
    getForecast
};
