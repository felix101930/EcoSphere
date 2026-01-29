// Water Controller - Handle water data requests
const WaterService = require('../services/waterService');
const ForecastService = require('../services/forecastService');
const WeatherService = require('../services/weatherService');
const { TABLE_NAMES } = require('../config/database');
const { sendError } = require('../utils/responseHelper');
const { HTTP_STATUS } = require('../utils/constants');
const { TRAINING_PERIOD } = require('../utils/weatherConstants');
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
const getRainwaterLevelData = asyncHandler(async (req, res) => {
    const { dateFrom, dateTo } = req.params;

    // Validate parameters
    validateParams({ dateFrom, dateTo });

    // Fetch data
    const data = await WaterService.getRainwaterLevelData(dateFrom, dateTo);

    if (!data || data.length === 0) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
            success: false,
            error: 'No data found for the specified date range'
        });
    }

    // Calculate metrics
    const metrics = WaterService.calculateMetrics(data);

    // Return response with aggregation info
    res.json({
        success: true,
        data: data,
        metrics: metrics,
        count: data.length,
        dateFrom: dateFrom,
        dateTo: dateTo,
        dataSource: WATER_DATA_SOURCES.RAINWATER,
        unit: WATER_UNITS.RAINWATER,
        aggregation: data.aggregation || WATER_AGGREGATION.RAINWATER,
        granularity: data.granularity || 'hourly'
    });
});

/**
 * Get hot water consumption data
 * Uses createDataFetcher to eliminate boilerplate code
 */
const getHotWaterConsumptionData = asyncHandler(async (req, res) => {
    const { dateFrom, dateTo } = req.params;

    // Validate parameters
    validateParams({ dateFrom, dateTo });

    // Fetch data
    const data = await WaterService.getHotWaterConsumptionData(dateFrom, dateTo);

    if (!data || data.length === 0) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
            success: false,
            error: 'No data found for the specified date range'
        });
    }

    // Calculate metrics
    const metrics = WaterService.calculateMetrics(data);

    // Return response with aggregation info
    res.json({
        success: true,
        data: data,
        metrics: metrics,
        count: data.length,
        dateFrom: dateFrom,
        dateTo: dateTo,
        dataSource: WATER_DATA_SOURCES.HOT_WATER,
        unit: WATER_UNITS.HOT_WATER,
        aggregation: data.aggregation || WATER_AGGREGATION.HOT_WATER,
        granularity: data.granularity || 'hourly'
    });
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

/**
 * Get rainwater level forecast using weather data
 */
const getRainwaterForecast = asyncHandler(async (req, res) => {
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

    // Calculate date ranges
    const target = new Date(targetDate + 'T12:00:00');

    // Training period: last 60 days before target date
    const trainingEndDate = new Date(target);
    trainingEndDate.setDate(trainingEndDate.getDate() - 1); // Day before target
    const trainingStartDate = new Date(trainingEndDate);
    trainingStartDate.setDate(trainingStartDate.getDate() - TRAINING_PERIOD.DAYS);

    const trainingStartStr = formatDate(trainingStartDate);
    const trainingEndStr = formatDate(trainingEndDate);

    // Forecast period: days after target date
    const forecastStartDate = new Date(target);
    forecastStartDate.setDate(forecastStartDate.getDate() + 1); // Day after target
    const forecastEndDate = new Date(forecastStartDate);
    forecastEndDate.setDate(forecastEndDate.getDate() + days - 1);

    const forecastStartStr = formatDate(forecastStartDate);
    const forecastEndStr = formatDate(forecastEndDate);

    // 1. Fetch historical rainwater data for training
    console.log(`Fetching rainwater data: ${trainingStartStr} to ${trainingEndStr}`);
    const historicalRainwater = await WaterService.getRainwaterLevelData(
        trainingStartStr,
        trainingEndStr
    );

    if (!historicalRainwater || historicalRainwater.length === 0) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
            success: false,
            error: 'No historical rainwater data available for training'
        });
    }

    // 2. Fetch historical weather data for training
    console.log(`Fetching historical weather: ${trainingStartStr} to ${trainingEndStr}`);
    const historicalWeatherRaw = await WeatherService.getHistoricalWeather(
        trainingStartStr,
        trainingEndStr,
        'rain'
    );
    const historicalWeather = WeatherService.aggregateToDaily(historicalWeatherRaw, 'rain');

    // 3. Fetch forecast weather data
    console.log(`Fetching forecast weather: ${forecastStartStr} to ${forecastEndStr}`);
    const forecastWeatherRaw = await WeatherService.getWeatherData(
        forecastStartStr,
        forecastEndStr,
        'rain'
    );
    const forecastWeather = WeatherService.aggregateToDaily(forecastWeatherRaw, 'rain');

    // 4. Generate forecast
    const forecastResult = await ForecastService.generateRainwaterForecast(
        targetDate,
        days,
        historicalRainwater,
        historicalWeather,
        forecastWeather
    );

    // 5. Return response
    res.json({
        success: true,
        targetDate: targetDate,
        forecastDays: days,
        predictions: forecastResult.predictions,
        metadata: forecastResult.metadata
    });
});

module.exports = {
    getAvailableDateRange,
    getRainwaterLevelData,
    getHotWaterConsumptionData,
    getHotWaterForecast,
    getRainwaterForecast
};
