// Forecast Service - Multi-tier prediction with graceful degradation
const t = require('timeseries-analysis');
const {
    formatDate,
    addDays,
    calculateAverage,
    calculateLinearTrend,
    aggregateHourlyToDaily
} = require('../utils/forecastHelpers');

class ForecastService {
    /**
     * Main forecast function - intelligently selects best algorithm
     */
    static async generateForecast(targetDate, forecastDays, historicalData) {
        try {
            // 1. Assess data availability
            const dataAvailability = this.assessDataAvailability(targetDate, historicalData, forecastDays);

            // 2. Select best prediction strategy
            const strategy = this.selectPredictionStrategy(dataAvailability);

            // 3. Execute prediction based on strategy
            let prediction;
            switch (strategy.strategy) {
                case 'HOLT_WINTERS':
                    prediction = this.holtWintersForecast(historicalData, forecastDays);
                    break;

                case 'SEASONAL_WEIGHTED':
                    prediction = this.seasonalWeightedForecast(historicalData, forecastDays, targetDate);
                    break;

                case 'TREND_BASED':
                    prediction = this.trendBasedForecast(historicalData, forecastDays);
                    break;

                case 'MOVING_AVERAGE':
                    prediction = this.movingAverageForecast(historicalData, forecastDays);
                    break;

                default:
                    throw new Error('Insufficient data for reliable prediction');
            }

            // 4. Return result with metadata
            return {
                success: true,
                predictions: prediction,
                metadata: {
                    strategy: strategy.strategy,
                    strategyName: strategy.name,
                    confidence: strategy.confidence,
                    accuracy: strategy.accuracy,
                    warning: strategy.warning,
                    dataAvailability: dataAvailability
                }
            };
        } catch (error) {
            console.error('Forecast generation error:', error);
            throw error;
        }
    }

    /**
     * Assess data availability for prediction
     */
    static assessDataAvailability(targetDate, historicalData, forecastDays) {
        const target = new Date(targetDate + 'T12:00:00');
        const dataPoints = historicalData.length;

        // Check for 1 year of data (365 days)
        const hasOneYearCycle = dataPoints >= 365 * 24; // Hourly data

        // Check for last year same period
        const lastYearStart = new Date(target);
        lastYearStart.setFullYear(lastYearStart.getFullYear() - 1);
        const lastYearEnd = new Date(lastYearStart);
        lastYearEnd.setDate(lastYearEnd.getDate() + forecastDays);

        const hasLastYearData = this.checkDataInRange(
            historicalData,
            lastYearStart,
            lastYearEnd
        );

        // Check for recent 30 days
        const recent30Start = new Date(target);
        recent30Start.setDate(recent30Start.getDate() - 30);
        const hasRecent30Days = this.checkDataInRange(
            historicalData,
            recent30Start,
            target
        );

        // Check for recent 7 days
        const recent7Start = new Date(target);
        recent7Start.setDate(recent7Start.getDate() - 7);
        const hasRecent7Days = this.checkDataInRange(
            historicalData,
            recent7Start,
            target
        );

        // Calculate completeness score
        const completenessScore = this.calculateCompleteness(historicalData);

        // Identify missing periods
        const missingPeriods = this.identifyMissingPeriods(historicalData);

        return {
            hasOneYearCycle,
            hasLastYearData,
            hasRecent30Days,
            hasRecent7Days,
            completenessScore,
            missingPeriods,
            totalDataPoints: dataPoints
        };
    }

    /**
     * Check if data exists in a date range
     */
    static checkDataInRange(data, startDate, endDate) {
        const startStr = formatDate(startDate);
        const endStr = formatDate(endDate);

        const dataInRange = data.filter(d => {
            const dateStr = d.ts.substring(0, 10);
            return dateStr >= startStr && dateStr <= endStr;
        });

        // Consider data available if we have at least 50% of expected points
        const expectedDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        const expectedPoints = expectedDays * 24; // Hourly data

        return dataInRange.length >= expectedPoints * 0.5;
    }

    /**
     * Calculate data completeness score (0-100)
     */
    static calculateCompleteness(data) {
        if (data.length === 0) return 0;

        // Calculate expected data points based on date range
        if (data.length < 2) return 100;

        const firstDate = new Date(data[0].ts);
        const lastDate = new Date(data[data.length - 1].ts);
        const totalHours = (lastDate - firstDate) / (1000 * 60 * 60);
        const expectedPoints = Math.floor(totalHours);

        if (expectedPoints === 0) return 100;

        // Calculate actual completeness
        const actualPoints = data.length;
        const completeness = (actualPoints / expectedPoints) * 100;

        return Math.min(100, Math.round(completeness));
    }

    /**
     * Identify missing periods in data
     */
    static identifyMissingPeriods(data) {
        const missingPeriods = [];

        for (let i = 1; i < data.length; i++) {
            const prev = new Date(data[i - 1].ts);
            const curr = new Date(data[i].ts);
            const hoursDiff = (curr - prev) / (1000 * 60 * 60);

            // If gap is more than 24 hours, record it
            if (hoursDiff > 24) {
                missingPeriods.push({
                    start: formatDate(prev),
                    end: formatDate(curr),
                    days: Math.floor(hoursDiff / 24)
                });
            }
        }

        return missingPeriods.slice(0, 5); // Return top 5 gaps
    }

    /**
     * Select best prediction strategy based on data availability
     */
    static selectPredictionStrategy(dataAvailability) {
        // Tier 1: Holt-Winters (Best)
        if (dataAvailability.hasOneYearCycle &&
            dataAvailability.completenessScore >= 70) {
            return {
                strategy: 'HOLT_WINTERS',
                name: 'Holt-Winters Seasonal Smoothing',
                confidence: 90,
                accuracy: '★★★★★',
                warning: null
            };
        }

        // Tier 2: Seasonal Weighted (Good)
        if (dataAvailability.hasLastYearData &&
            dataAvailability.hasRecent30Days) {
            return {
                strategy: 'SEASONAL_WEIGHTED',
                name: 'Weighted Seasonal Prediction',
                confidence: 80,
                accuracy: '★★★★☆',
                warning: 'Some historical data missing, using simplified seasonal algorithm'
            };
        }

        // Tier 3: Trend Based (Acceptable)
        if (dataAvailability.hasRecent30Days) {
            return {
                strategy: 'TREND_BASED',
                name: 'Trend-Based Prediction',
                confidence: 65,
                accuracy: '★★★☆☆',
                warning: 'Missing last year data, prediction based on recent trend only'
            };
        }

        // Tier 4: Moving Average (Basic)
        if (dataAvailability.hasRecent7Days) {
            return {
                strategy: 'MOVING_AVERAGE',
                name: 'Moving Average',
                confidence: 50,
                accuracy: '★★☆☆☆',
                warning: 'Insufficient historical data, using basic moving average with low accuracy'
            };
        }

        // Tier 5: Insufficient
        return {
            strategy: 'INSUFFICIENT_DATA',
            name: 'Insufficient Data',
            confidence: 0,
            accuracy: 'Cannot Predict',
            warning: 'Insufficient historical data (less than 7 days), cannot generate reliable prediction'
        };
    }

    /**
     * Tier 1: Holt-Winters Forecast
     */
    static holtWintersForecast(data, forecastDays) {
        // Prepare data for timeseries-analysis
        const tsData = data.map(d => [new Date(d.ts).getTime(), Math.abs(d.value)]);

        // Create time series
        const ts = new t.main(t.adapter.fromArray(tsData));

        // Apply Holt-Winters smoothing
        ts.smoother({
            period: 7 * 24,  // Weekly seasonality (hourly data)
            alpha: 0.5,      // Level smoothing
            beta: 0.4,       // Trend smoothing
            gamma: 0.3       // Seasonal smoothing
        }).forecast(forecastDays * 24); // Forecast hourly

        // Get predictions and aggregate to daily
        const output = ts.output();
        return aggregateHourlyToDaily(output, forecastDays);
    }

    /**
     * Tier 2: Seasonal Weighted Forecast
     */
    static seasonalWeightedForecast(data, forecastDays, targetDate) {
        const predictions = [];
        const target = new Date(targetDate + 'T12:00:00');

        for (let i = 0; i < forecastDays; i++) {
            const forecastDate = new Date(target);
            forecastDate.setDate(forecastDate.getDate() + i);

            // Get last year same day
            const lastYearDate = new Date(forecastDate);
            lastYearDate.setFullYear(lastYearDate.getFullYear() - 1);
            const lastYearValue = this.getValueForDate(data, lastYearDate);

            // Get last week same day
            const lastWeekDate = new Date(forecastDate);
            lastWeekDate.setDate(lastWeekDate.getDate() - 7);
            const lastWeekValue = this.getValueForDate(data, lastWeekDate);

            // Get 30-day average
            const avgValue = this.getAverageValue(data, 30, target);

            // Weighted prediction
            const prediction =
                0.3 * lastYearValue +
                0.5 * lastWeekValue +
                0.2 * avgValue;

            predictions.push({
                date: formatDate(forecastDate),
                value: prediction
            });
        }

        return predictions;
    }

    /**
     * Tier 3: Trend Based Forecast
     */
    static trendBasedForecast(data, forecastDays) {
        // Calculate linear trend from last 30 days
        const recent30 = data.slice(-30 * 24); // Last 30 days hourly
        const trend = calculateLinearTrend(recent30);
        const lastValue = Math.abs(data[data.length - 1].value);

        const predictions = [];
        for (let i = 1; i <= forecastDays; i++) {
            predictions.push({
                date: formatDate(addDays(new Date(data[data.length - 1].ts), i)),
                value: Math.max(0, lastValue + trend * i * 24) // Daily trend
            });
        }

        return predictions;
    }

    /**
     * Tier 4: Moving Average Forecast
     */
    static movingAverageForecast(data, forecastDays) {
        // Calculate 7-day average
        const recent7Days = data.slice(-7 * 24);
        const avg = calculateAverage(recent7Days);

        const predictions = [];
        const lastDate = new Date(data[data.length - 1].ts);

        for (let i = 1; i <= forecastDays; i++) {
            predictions.push({
                date: formatDate(addDays(lastDate, i)),
                value: avg
            });
        }

        return predictions;
    }

    /**
     * Helper: Get value for specific date (daily average)
     */
    static getValueForDate(data, date) {
        const dateStr = formatDate(date);
        const dayData = data.filter(d => d.ts.startsWith(dateStr));

        if (dayData.length === 0) {
            // Fallback to overall average
            return calculateAverage(data);
        }

        return calculateAverage(dayData);
    }

    /**
     * Helper: Get average value from last N days
     */
    static getAverageValue(data, days, beforeDate) {
        const endDate = new Date(beforeDate);
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - days);

        const startStr = formatDate(startDate);
        const endStr = formatDate(endDate);

        const periodData = data.filter(d => {
            const dateStr = d.ts.substring(0, 10);
            return dateStr >= startStr && dateStr < endStr;
        });

        return calculateAverage(periodData);
    }
}

module.exports = ForecastService;
