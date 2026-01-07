// Weather Controller - Handle weather data requests
const WeatherService = require('../services/weatherService');
const { sendError } = require('../utils/responseHelper');
const { HTTP_STATUS } = require('../utils/constants');
const { asyncHandler } = require('../utils/controllerHelper');

/**
 * Get outdoor temperature data for date range
 * Returns hourly temperature data aggregated to daily averages
 * 
 * Query params:
 * - dateFrom: Start date (YYYY-MM-DD)
 * - dateTo: End date (YYYY-MM-DD)
 * - type: Data type (default: 'thermal')
 */
const getOutdoorTemperature = asyncHandler(async (req, res) => {
    const { dateFrom, dateTo, type = 'thermal' } = req.query;

    // Validate required parameters
    if (!dateFrom || !dateTo) {
        return sendError(
            res,
            HTTP_STATUS.BAD_REQUEST,
            'Missing required parameters: dateFrom and dateTo'
        );
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateFrom) || !dateRegex.test(dateTo)) {
        return sendError(
            res,
            HTTP_STATUS.BAD_REQUEST,
            'Invalid date format. Use YYYY-MM-DD'
        );
    }

    // Fetch weather data
    const weatherData = await WeatherService.getWeatherData(dateFrom, dateTo, type);

    // Aggregate to daily
    const dailyWeather = WeatherService.aggregateToDaily(weatherData, type);

    // Extract temperature data with high, low, avg
    const temperatureData = Object.keys(dailyWeather).sort().map(date => ({
        date,
        temperature: dailyWeather[date].avg_temperature,
        avg: dailyWeather[date].avg_temperature,
        high: dailyWeather[date].max_temperature,
        low: dailyWeather[date].min_temperature
    }));

    res.json({
        success: true,
        dateFrom,
        dateTo,
        data: temperatureData
    });
});

module.exports = {
    getOutdoorTemperature
};
