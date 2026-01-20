// Natural Gas Forecast Service - 3-Tier prediction system for monthly data
const cache = require('../utils/cache');

// Cache TTL for forecasts (1 hour)
const FORECAST_CACHE_TTL = 60 * 60 * 1000;

// Forecast constants
const MONTHS_PER_YEAR = 12;
const MIN_MONTHS_TIER_1 = 24; // 2 years
const MIN_MONTHS_TIER_2 = 6;
const MIN_MONTHS_TIER_3 = 3;

// Confidence and accuracy levels
const CONFIDENCE = {
    TIER_1_SEASONAL: 75,
    TIER_2_TREND: 60,
    TIER_3_MOVING_AVG: 45,
    INSUFFICIENT: 0
};

const ACCURACY = {
    TIER_1: '★★★★☆',
    TIER_2: '★★★☆☆',
    TIER_3: '★★☆☆☆',
    INSUFFICIENT: 'Cannot Predict'
};

const ALGORITHM_NAMES = {
    SEASONAL_WEIGHTED: 'Seasonal Weighted Prediction',
    TREND_BASED: 'Trend-Based Prediction',
    MOVING_AVERAGE: 'Moving Average',
    INSUFFICIENT_DATA: 'Insufficient Data'
};

const STRATEGY = {
    SEASONAL_WEIGHTED: 'SEASONAL_WEIGHTED',
    TREND_BASED: 'TREND_BASED',
    MOVING_AVERAGE: 'MOVING_AVERAGE',
    INSUFFICIENT_DATA: 'INSUFFICIENT_DATA'
};

// Tier 1 seasonal weights
const SEASONAL_WEIGHTS = {
    LAST_YEAR: 0.4,
    TWO_YEARS_AGO: 0.4,
    RECENT_AVERAGE: 0.2
};

const WARNINGS = {
    TIER_2: 'Limited historical data, using trend-based prediction',
    TIER_3: 'Minimal historical data, using basic moving average with low accuracy',
    INSUFFICIENT: 'Insufficient historical data (less than 3 months), cannot generate reliable prediction'
};

class NaturalGasForecastService {
    /**
     * Main forecast function - intelligently selects best algorithm
     */
    static async generateForecast(targetDate, forecastMonths, historicalData) {
        // Check cache first
        const cacheKey = cache.constructor.generateKey('ng-forecast', targetDate, forecastMonths, historicalData.length);
        const cached = cache.get(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            // 1. Assess data availability
            const dataAvailability = this.assessDataAvailability(targetDate, historicalData, forecastMonths);

            // 2. Select best prediction strategy
            const strategy = this.selectPredictionStrategy(dataAvailability);

            // 3. Execute prediction based on strategy
            let prediction;
            switch (strategy.strategy) {
                case STRATEGY.SEASONAL_WEIGHTED:
                    prediction = this.seasonalWeightedForecast(historicalData, forecastMonths, targetDate);
                    break;

                case STRATEGY.TREND_BASED:
                    prediction = this.trendBasedForecast(historicalData, forecastMonths, targetDate);
                    break;

                case STRATEGY.MOVING_AVERAGE:
                    prediction = this.movingAverageForecast(historicalData, forecastMonths, targetDate);
                    break;

                default:
                    throw new Error('Insufficient data for reliable prediction');
            }

            // 4. Return result with metadata
            const result = {
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

            // Cache the result (1 hour TTL for forecasts)
            cache.set(cacheKey, result, FORECAST_CACHE_TTL);

            return result;
        } catch (error) {
            console.error('Natural gas forecast generation error:', error);
            throw error;
        }
    }

    /**
     * Assess data availability for prediction
     */
    static assessDataAvailability(targetDate, historicalData, forecastMonths) {
        const dataPoints = historicalData.length;

        // Check for 2 years of data (24 months)
        const hasTwoYears = dataPoints >= MIN_MONTHS_TIER_1;

        // Check for 6 months of data
        const hasSixMonths = dataPoints >= MIN_MONTHS_TIER_2;

        // Check for 3 months of data
        const hasThreeMonths = dataPoints >= MIN_MONTHS_TIER_3;

        // Check if we have last year same month data
        const hasLastYearData = this.checkLastYearData(historicalData, targetDate);

        // Check if we have two years ago same month data
        const hasTwoYearsAgoData = this.checkTwoYearsAgoData(historicalData, targetDate);

        return {
            hasTwoYears,
            hasSixMonths,
            hasThreeMonths,
            hasLastYearData,
            hasTwoYearsAgoData,
            totalDataPoints: dataPoints
        };
    }

    /**
     * Check if we have last year's data
     */
    static checkLastYearData(data, targetDate) {
        const target = new Date(targetDate);
        const lastYear = new Date(target);
        lastYear.setFullYear(lastYear.getFullYear() - 1);

        const lastYearMonth = lastYear.getMonth() + 1;
        const lastYearYear = lastYear.getFullYear();

        return data.some(d => {
            const dataDate = new Date(d.month);
            return dataDate.getMonth() + 1 === lastYearMonth &&
                dataDate.getFullYear() === lastYearYear;
        });
    }

    /**
     * Check if we have two years ago data
     */
    static checkTwoYearsAgoData(data, targetDate) {
        const target = new Date(targetDate);
        const twoYearsAgo = new Date(target);
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

        const twoYearsAgoMonth = twoYearsAgo.getMonth() + 1;
        const twoYearsAgoYear = twoYearsAgo.getFullYear();

        return data.some(d => {
            const dataDate = new Date(d.month);
            return dataDate.getMonth() + 1 === twoYearsAgoMonth &&
                dataDate.getFullYear() === twoYearsAgoYear;
        });
    }

    /**
     * Select best prediction strategy based on data availability
     */
    static selectPredictionStrategy(dataAvailability) {
        // Tier 1: Seasonal Weighted (Best)
        if (dataAvailability.hasTwoYears) {
            return {
                strategy: STRATEGY.SEASONAL_WEIGHTED,
                name: ALGORITHM_NAMES.SEASONAL_WEIGHTED,
                confidence: CONFIDENCE.TIER_1_SEASONAL,
                accuracy: ACCURACY.TIER_1,
                warning: null
            };
        }

        // Tier 2: Trend Based (Good)
        if (dataAvailability.hasSixMonths) {
            return {
                strategy: STRATEGY.TREND_BASED,
                name: ALGORITHM_NAMES.TREND_BASED,
                confidence: CONFIDENCE.TIER_2_TREND,
                accuracy: ACCURACY.TIER_2,
                warning: WARNINGS.TIER_2
            };
        }

        // Tier 3: Moving Average (Basic)
        if (dataAvailability.hasThreeMonths) {
            return {
                strategy: STRATEGY.MOVING_AVERAGE,
                name: ALGORITHM_NAMES.MOVING_AVERAGE,
                confidence: CONFIDENCE.TIER_3_MOVING_AVG,
                accuracy: ACCURACY.TIER_3,
                warning: WARNINGS.TIER_3
            };
        }

        // Insufficient data
        return {
            strategy: STRATEGY.INSUFFICIENT_DATA,
            name: ALGORITHM_NAMES.INSUFFICIENT_DATA,
            confidence: CONFIDENCE.INSUFFICIENT,
            accuracy: ACCURACY.INSUFFICIENT,
            warning: WARNINGS.INSUFFICIENT
        };
    }

    /**
     * Tier 1: Seasonal Weighted Forecast
     * Uses historical seasonal patterns to predict future consumption
     * Formula: 0.4 × LastYear + 0.4 × TwoYearsAgo + 0.2 × Recent3MonthAvg
     * 
     * @param {Array} data - Historical monthly data
     * @param {number} forecastMonths - Number of months to forecast
     * @param {Date} targetDate - Base date for forecast calculation
     * @returns {Array} Array of prediction objects with month, label, value, and components
     */
    static seasonalWeightedForecast(data, forecastMonths, targetDate) {
        const predictions = [];
        const target = new Date(targetDate);

        // Extract year and month from target date
        // Month is converted to 1-12 range (JavaScript uses 0-11)
        const targetYear = target.getFullYear();
        const targetMonth = target.getMonth() + 1;

        console.log(`Target: ${targetYear}-${targetMonth}`);

        // Loop through each month we need to forecast
        // Start from i=1 because we forecast the NEXT month after target
        for (let i = 1; i <= forecastMonths; i++) {
            // Calculate forecast month using pure math (avoids Date object timezone issues)
            let forecastMonth = targetMonth + i;
            let forecastYear = targetYear;

            // Handle year boundary crossing (e.g., Dec + 1 = Jan of next year)
            while (forecastMonth > 12) {
                forecastMonth -= 12;
                forecastYear += 1;
            }

            console.log(`Iteration ${i}: Forecast ${forecastYear}-${forecastMonth}`);

            // Get historical data for the same month in previous years
            const lastYearValue = this.getMonthValue(data, forecastMonth, forecastYear - 1);
            const twoYearsAgoValue = this.getMonthValue(data, forecastMonth, forecastYear - 2);

            // Get recent trend by averaging last 3 months
            const recentAvg = this.getRecentAverage(data, 3);

            // Apply weighted formula: 40% last year + 40% two years ago + 20% recent trend
            const prediction =
                SEASONAL_WEIGHTS.LAST_YEAR * lastYearValue +
                SEASONAL_WEIGHTS.TWO_YEARS_AGO * twoYearsAgoValue +
                SEASONAL_WEIGHTS.RECENT_AVERAGE * recentAvg;

            // Create Date object for month label formatting
            const forecastDate = new Date(forecastYear, forecastMonth - 1, 1);

            // Build prediction object with all components for transparency
            predictions.push({
                month: `${forecastYear}-${String(forecastMonth).padStart(2, '0')}`,
                monthLabel: this.getMonthLabel(forecastDate),
                value: Math.max(0, prediction), // Ensure non-negative
                components: {
                    lastYear: lastYearValue,
                    twoYearsAgo: twoYearsAgoValue,
                    recentAvg: recentAvg
                }
            });
        }

        return predictions;
    }

    /**
     * Tier 2: Trend Based Forecast
     */
    static trendBasedForecast(data, forecastMonths, targetDate) {
        // Use last 6 months to calculate trend
        const recentData = data.slice(-6);

        if (recentData.length < 2) {
            // Fallback to last month's value
            const lastValue = data[data.length - 1].value;
            return this.createConstantForecast(lastValue, forecastMonths, targetDate);
        }

        // Calculate linear trend
        const n = recentData.length;
        const xValues = Array.from({ length: n }, (_, i) => i);
        const yValues = recentData.map(d => d.value);

        const { slope, intercept } = this.calculateLinearRegression(xValues, yValues);

        const predictions = [];
        const target = new Date(targetDate);

        // Get target year and month (1-12)
        const targetYear = target.getFullYear();
        const targetMonth = target.getMonth() + 1;

        for (let i = 1; i <= forecastMonths; i++) {
            // Calculate forecast month directly using math
            let forecastMonth = targetMonth + i;
            let forecastYear = targetYear;

            // Handle year overflow
            while (forecastMonth > 12) {
                forecastMonth -= 12;
                forecastYear += 1;
            }

            // Predict using trend
            const prediction = intercept + slope * (n + i - 1);

            // Create date for label
            const forecastDate = new Date(forecastYear, forecastMonth - 1, 1);

            predictions.push({
                month: `${forecastYear}-${String(forecastMonth).padStart(2, '0')}`,
                monthLabel: this.getMonthLabel(forecastDate),
                value: Math.max(0, prediction)
            });
        }

        return predictions;
    }

    /**
     * Tier 3: Moving Average Forecast
     */
    static movingAverageForecast(data, forecastMonths, targetDate) {
        // Use last 3 months average
        const recentAvg = this.getRecentAverage(data, 3);

        return this.createConstantForecast(recentAvg, forecastMonths, targetDate);
    }

    /**
     * Helper: Get value for specific month and year
     */
    static getMonthValue(data, month, year) {
        const found = data.find(d => {
            const dataDate = new Date(d.month);
            return dataDate.getMonth() + 1 === month && dataDate.getFullYear() === year;
        });

        if (found) {
            return found.value;
        }

        // Fallback: use average of all data for that month across years
        const sameMonthData = data.filter(d => {
            const dataDate = new Date(d.month);
            return dataDate.getMonth() + 1 === month;
        });

        if (sameMonthData.length > 0) {
            return sameMonthData.reduce((sum, d) => sum + d.value, 0) / sameMonthData.length;
        }

        // Final fallback: overall average
        return this.getRecentAverage(data, data.length);
    }

    /**
     * Helper: Get recent N months average
     */
    static getRecentAverage(data, months) {
        const recentData = data.slice(-months);
        if (recentData.length === 0) return 0;

        const sum = recentData.reduce((acc, d) => acc + d.value, 0);
        return sum / recentData.length;
    }

    /**
     * Helper: Calculate linear regression
     */
    static calculateLinearRegression(xValues, yValues) {
        const n = xValues.length;
        const sumX = xValues.reduce((a, b) => a + b, 0);
        const sumY = yValues.reduce((a, b) => a + b, 0);
        const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
        const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        return { slope, intercept };
    }

    /**
     * Helper: Create constant forecast
     */
    static createConstantForecast(value, forecastMonths, targetDate) {
        const predictions = [];
        const target = new Date(targetDate);

        // Get target year and month (1-12)
        const targetYear = target.getFullYear();
        const targetMonth = target.getMonth() + 1;

        for (let i = 1; i <= forecastMonths; i++) {
            // Calculate forecast month directly using math
            let forecastMonth = targetMonth + i;
            let forecastYear = targetYear;

            // Handle year overflow
            while (forecastMonth > 12) {
                forecastMonth -= 12;
                forecastYear += 1;
            }

            // Create date for label
            const forecastDate = new Date(forecastYear, forecastMonth - 1, 1);

            predictions.push({
                month: `${forecastYear}-${String(forecastMonth).padStart(2, '0')}`,
                monthLabel: this.getMonthLabel(forecastDate),
                value: Math.max(0, value)
            });
        }

        return predictions;
    }

    /**
     * Helper: Get month label (e.g., "Jan 2026")
     */
    static getMonthLabel(date) {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    }
}

module.exports = NaturalGasForecastService;
