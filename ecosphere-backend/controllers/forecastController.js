// Forecast Controller - Handle forecast requests
const ForecastService = require('../services/forecastService');
const ElectricityService = require('../services/electricityService');

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
        const historicalData = await ElectricityService.getConsumptionData(
            startDateStr,
            targetDateStr
        );

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

module.exports = {
    getElectricityForecast
};
