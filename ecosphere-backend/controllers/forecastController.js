// Forecast Controller - Handle forecast requests
const ForecastService = require('../services/forecastService');
const ElectricityService = require('../services/electricityService');
const WeatherService = require('../services/weatherService');
const { TRAINING_PERIOD } = require('../utils/weatherConstants');

/**
 * Generate electricity consumption forecast
 */
const getElectricityForecast = async (req, res) => {
    try {
        const { targetDate, forecastDays } = req.params;

        // Validate inputs
        if (!targetDate || !forecastDays) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters: targetDate, forecastDays'
            });
        }

        const days = parseInt(forecastDays);
        if (isNaN(days) || days < 1 || days > 30) {
            return res.status(400).json({
                success: false,
                error: 'forecastDays must be between 1 and 30'
            });
        }

        // Get historical data (need at least 60 days before target date for training)
        const target = new Date(targetDate + 'T12:00:00');
        const startDate = new Date(target);
        startDate.setDate(startDate.getDate() - 365); // Get 1 year of history

        const startDateStr = formatDate(startDate);
        const targetDateStr = targetDate;

        // Fetch historical consumption data
        const consumptionResponse = await ElectricityService.getConsumptionData(
            startDateStr,
            targetDateStr
        );

        // Extract data array from response object
        const historicalData = consumptionResponse.data || consumptionResponse;

        if (!historicalData || historicalData.length === 0) {
            return res.status(404).json({
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

        // Return response (no actual data comparison for real predictions)
        res.json({
            success: true,
            targetDate: targetDate,
            forecastDays: days,
            predictions: forecastResult.predictions,
            metadata: forecastResult.metadata
        });

    } catch (error) {
        console.error('Error generating forecast:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to generate forecast'
        });
    }
};

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
 * Generate solar generation forecast using weather data
 */
const getGenerationForecast = async (req, res) => {
    try {
        const { targetDate, forecastDays } = req.params;

        // Validate inputs
        if (!targetDate || !forecastDays) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters: targetDate, forecastDays'
            });
        }

        const days = parseInt(forecastDays);
        if (isNaN(days) || days < 1 || days > 30) {
            return res.status(400).json({
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

        // 1. Fetch historical generation data for training
        console.log(`Fetching generation data: ${trainingStartStr} to ${trainingEndStr}`);
        const historicalGeneration = await ElectricityService.getGenerationData(
            trainingStartStr,
            trainingEndStr
        );

        if (!historicalGeneration || historicalGeneration.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No historical generation data available for training'
            });
        }

        // 2. Fetch historical weather data for training
        console.log(`Fetching historical weather: ${trainingStartStr} to ${trainingEndStr}`);
        const historicalWeatherRaw = await WeatherService.getHistoricalWeather(
            trainingStartStr,
            trainingEndStr
        );
        const historicalWeather = WeatherService.aggregateToDaily(historicalWeatherRaw);

        // 3. Fetch forecast weather data
        console.log(`Fetching forecast weather: ${forecastStartStr} to ${forecastEndStr}`);
        const forecastWeatherRaw = await WeatherService.getWeatherData(
            forecastStartStr,
            forecastEndStr
        );
        const forecastWeather = WeatherService.aggregateToDaily(forecastWeatherRaw);

        // 4. Generate forecast
        const forecastResult = await ForecastService.generateGenerationForecast(
            targetDate,
            days,
            historicalGeneration,
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

    } catch (error) {
        console.error('Error generating generation forecast:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to generate generation forecast'
        });
    }
};

module.exports = {
    getElectricityForecast,
    getGenerationForecast
};
