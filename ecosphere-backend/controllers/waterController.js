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
    RAINWATER: 'TL93 (Rain_Water_Level_POLL) - 10-minute intervals',
    HOT_WATER: 'TL210 (GBT Domestic Hot Water flow rate) - 1-minute intervals'
};

const WATER_UNITS = {
    RAINWATER: '%',
    HOT_WATER: 'L/h (flow rate)'
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

    // Return response
    res.json({
        success: true,
        data: data,
        metrics: metrics,
        count: data.length,
        dateFrom: dateFrom,
        dateTo: dateTo,
        dataSource: WATER_DATA_SOURCES.RAINWATER,
        unit: WATER_UNITS.RAINWATER
    });
});

/**
 * Get hot water consumption data
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

    // Return response
    res.json({
        success: true,
        data: data,
        metrics: metrics,
        count: data.length,
        dateFrom: dateFrom,
        dateTo: dateTo,
        dataSource: WATER_DATA_SOURCES.HOT_WATER,
        unit: WATER_UNITS.HOT_WATER
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

    // Calculate start date (2 years before target date for Tier 1 Holt-Winters)
    const target = new Date(targetDate + 'T12:00:00');
    const startDate = new Date(target);
    startDate.setDate(startDate.getDate() - (2 * 365)); // 2 years for complete seasonal cycles

    const startDateStr = formatDate(startDate);
    const targetDateStr = targetDate;

    console.log(`📊 Fetching hot water data: ${startDateStr} to ${targetDateStr} (2 years)`);

    // Fetch historical hot water consumption data (1-minute interval)
    const rawData = await WaterService.getHotWaterConsumptionData(
        startDateStr,
        targetDateStr
    );

    if (!rawData || rawData.length === 0) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
            success: false,
            error: 'No historical data available for the specified period'
        });
    }

    console.log(`✅ Received ${rawData.length} raw data points (1-minute interval)`);

    // Aggregate 1-minute data to hourly for forecast analysis
    const historicalData = aggregateToHourly(rawData);
    console.log(`✅ Aggregated to ${historicalData.length} hourly data points`);

    // Generate forecast
    const forecastResult = await ForecastService.generateForecast(
        targetDate,
        days,
        historicalData
    );

    console.log(`📈 Forecast generated using: ${forecastResult.metadata.strategyName}`);
    console.log(`   Confidence: ${forecastResult.metadata.confidence}%`);

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
 * Aggregate 1-minute flow rate data to hourly total consumption
 * 
 * Data interpretation:
 * - Database values are instantaneous flow rates in L/h
 * - Each minute's actual consumption = (flow rate in L/h) × (1/60 hour) = liters consumed
 * - Hourly total = sum of all minute consumptions in that hour
 * 
 * Example:
 * - Flow rate: 60 L/h → Consumption per minute: 60 × (1/60) = 1 L
 * - Flow rate: 4,104 L/h → Consumption per minute: 4,104 × (1/60) = 68.4 L
 * 
 * @param {Array} data - Array of {ts, value} objects where value is in L/h (instantaneous flow rate)
 * @returns {Array} Array of {ts, value} objects where value is total liters consumed per hour
 */
function aggregateToHourly(data) {
    const hourlyMap = new Map();

    data.forEach(point => {
        // Extract hour (YYYY-MM-DD HH:00:00)
        const hourKey = point.ts.substring(0, 13) + ':00:00';

        if (!hourlyMap.has(hourKey)) {
            hourlyMap.set(hourKey, { sum: 0, count: 0 });
        }

        const hourData = hourlyMap.get(hourKey);
        // Convert flow rate (L/h) to actual consumption in 1 minute
        // Formula: L/h × (1/60) h = L consumed in that minute
        hourData.sum += point.value * (1 / 60);
        hourData.count += 1;
    });

    // Convert map to array with totals
    const hourlyData = [];
    for (const [ts, data] of hourlyMap.entries()) {
        hourlyData.push({
            ts: ts,
            value: data.sum  // Total liters consumed in that hour
        });
    }

    // Sort by timestamp
    hourlyData.sort((a, b) => a.ts.localeCompare(b.ts));

    return hourlyData;
}

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
