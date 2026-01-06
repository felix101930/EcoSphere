// Forecast Service - Multi-tier prediction with graceful degradation
const t = require('timeseries-analysis');
const {
    formatDate,
    addDays,
    calculateAverage,
    calculateLinearTrend,
    aggregateHourlyToDaily
} = require('../utils/forecastHelpers');
const {
    HOURS_PER_DAY,
    DAYS_PER_WEEK,
    DAYS_PER_MONTH,
    DAYS_PER_YEAR,
    MIN_HOURS_FOR_COMPLETE_DAY,
    MIN_COMPLETENESS_SCORE,
    MIN_DATA_AVAILABILITY,
    GAP_THRESHOLD_HOURS,
    MAX_MISSING_PERIODS,
    SHORT_TERM_DAYS,
    MEDIUM_TERM_DAYS,
    CONFIDENCE,
    ACCURACY,
    ALGORITHM_NAMES,
    STRATEGY,
    SEASONAL_WEIGHTS,
    HOLT_WINTERS,
    MS_PER_HOUR,
    MS_PER_DAY,
    WARNINGS
} = require('../utils/forecastConstants');

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

        // Check for 1 year of data
        const hasOneYearCycle = dataPoints >= DAYS_PER_YEAR * HOURS_PER_DAY;

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
        recent30Start.setDate(recent30Start.getDate() - DAYS_PER_MONTH);
        const hasRecent30Days = this.checkDataInRange(
            historicalData,
            recent30Start,
            target
        );

        // Check for recent 7 days
        const recent7Start = new Date(target);
        recent7Start.setDate(recent7Start.getDate() - SHORT_TERM_DAYS);
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

        // Consider data available if we have at least MIN_DATA_AVAILABILITY of expected points
        const expectedDays = Math.ceil((endDate - startDate) / MS_PER_DAY);
        const expectedPoints = expectedDays * HOURS_PER_DAY;

        return dataInRange.length >= expectedPoints * MIN_DATA_AVAILABILITY;
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
        const totalHours = (lastDate - firstDate) / MS_PER_HOUR;
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
            const hoursDiff = (curr - prev) / MS_PER_HOUR;

            // If gap is more than GAP_THRESHOLD_HOURS, record it
            if (hoursDiff > GAP_THRESHOLD_HOURS) {
                missingPeriods.push({
                    start: formatDate(prev),
                    end: formatDate(curr),
                    days: Math.floor(hoursDiff / HOURS_PER_DAY)
                });
            }
        }

        return missingPeriods.slice(0, MAX_MISSING_PERIODS);
    }

    /**
     * Select best prediction strategy based on data availability
     */
    static selectPredictionStrategy(dataAvailability) {
        // Tier 1: Holt-Winters (Best)
        if (dataAvailability.hasOneYearCycle &&
            dataAvailability.completenessScore >= MIN_COMPLETENESS_SCORE) {
            return {
                strategy: STRATEGY.HOLT_WINTERS,
                name: ALGORITHM_NAMES.HOLT_WINTERS,
                confidence: CONFIDENCE.TIER_1_HOLT_WINTERS,
                accuracy: ACCURACY.TIER_1,
                warning: null
            };
        }

        // Tier 2: Seasonal Weighted (Good)
        if (dataAvailability.hasLastYearData &&
            dataAvailability.hasRecent30Days) {
            return {
                strategy: STRATEGY.SEASONAL_WEIGHTED,
                name: ALGORITHM_NAMES.SEASONAL_WEIGHTED,
                confidence: CONFIDENCE.TIER_2_SEASONAL,
                accuracy: ACCURACY.TIER_2,
                warning: WARNINGS.TIER_2
            };
        }

        // Tier 3: Trend Based (Acceptable)
        if (dataAvailability.hasRecent30Days) {
            return {
                strategy: STRATEGY.TREND_BASED,
                name: ALGORITHM_NAMES.TREND_BASED,
                confidence: CONFIDENCE.TIER_3_TREND,
                accuracy: ACCURACY.TIER_3,
                warning: WARNINGS.TIER_3
            };
        }

        // Tier 4: Moving Average (Basic)
        if (dataAvailability.hasRecent7Days) {
            return {
                strategy: STRATEGY.MOVING_AVERAGE,
                name: ALGORITHM_NAMES.MOVING_AVERAGE,
                confidence: CONFIDENCE.TIER_4_MOVING_AVG,
                accuracy: ACCURACY.TIER_4,
                warning: WARNINGS.TIER_4
            };
        }

        // Tier 5: Insufficient
        return {
            strategy: STRATEGY.INSUFFICIENT_DATA,
            name: ALGORITHM_NAMES.INSUFFICIENT_DATA,
            confidence: CONFIDENCE.INSUFFICIENT,
            accuracy: ACCURACY.INSUFFICIENT,
            warning: WARNINGS.INSUFFICIENT
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
            period: DAYS_PER_WEEK * HOURS_PER_DAY,  // Weekly seasonality (hourly data)
            alpha: HOLT_WINTERS.ALPHA,              // Level smoothing
            beta: HOLT_WINTERS.BETA,                // Trend smoothing
            gamma: HOLT_WINTERS.GAMMA               // Seasonal smoothing
        }).forecast(forecastDays * HOURS_PER_DAY);  // Forecast hourly

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

            // Get last year same day (daily total)
            const lastYearDate = new Date(forecastDate);
            lastYearDate.setFullYear(lastYearDate.getFullYear() - 1);
            const lastYearValue = this.getDailyTotalForDate(data, lastYearDate);

            // Get last week same day (daily total)
            const lastWeekDate = new Date(forecastDate);
            lastWeekDate.setDate(lastWeekDate.getDate() - DAYS_PER_WEEK);
            const lastWeekValue = this.getDailyTotalForDate(data, lastWeekDate);

            // Get 30-day average daily total (excluding incomplete days)
            const avgDailyValue = this.getAverageDailyTotal(data, DAYS_PER_MONTH, target, true);

            // Weighted prediction (daily total)
            const prediction =
                SEASONAL_WEIGHTS.LAST_YEAR * lastYearValue +
                SEASONAL_WEIGHTS.LAST_WEEK * lastWeekValue +
                SEASONAL_WEIGHTS.RECENT_AVERAGE * avgDailyValue;

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
        // Calculate daily totals for last 30 days (excluding incomplete last day)
        const dailyTotals = this.calculateDailyTotals(data, DAYS_PER_MONTH, true);

        if (dailyTotals.length === 0) {
            // Fallback: use complete day's total
            const lastCompleteDayTotal = this.getLastCompleteDayTotal(data);
            const predictions = [];
            const lastDate = new Date(data[data.length - 1].ts);
            for (let i = 1; i <= forecastDays; i++) {
                predictions.push({
                    date: formatDate(addDays(lastDate, i)),
                    value: lastCompleteDayTotal
                });
            }
            return predictions;
        }

        // Calculate trend from daily totals
        const trend = calculateLinearTrend(dailyTotals.map((total, i) => ({ value: total })));
        const lastDayTotal = dailyTotals[dailyTotals.length - 1];

        const predictions = [];
        const lastDate = new Date(data[data.length - 1].ts);
        for (let i = 1; i <= forecastDays; i++) {
            predictions.push({
                date: formatDate(addDays(lastDate, i)),
                value: Math.max(0, lastDayTotal + trend * i)
            });
        }

        return predictions;
    }

    /**
     * Tier 4: Moving Average Forecast
     */
    static movingAverageForecast(data, forecastDays) {
        // Calculate average daily total from last 7 days (excluding incomplete last day)
        const avgDailyTotal = this.getAverageDailyTotal(
            data,
            SHORT_TERM_DAYS,
            new Date(data[data.length - 1].ts),
            true
        );

        const predictions = [];
        const lastDate = new Date(data[data.length - 1].ts);

        for (let i = 1; i <= forecastDays; i++) {
            predictions.push({
                date: formatDate(addDays(lastDate, i)),
                value: avgDailyTotal
            });
        }

        return predictions;
    }

    /**
     * Helper: Get daily total for specific date
     */
    static getDailyTotalForDate(data, date) {
        const dateStr = formatDate(date);
        const dayData = data.filter(d => d.ts.startsWith(dateStr));

        if (dayData.length === 0) {
            // Fallback to average daily total
            return this.getAverageDailyTotal(data, SHORT_TERM_DAYS, date);
        }

        // Sum all hourly values for the day
        return dayData.reduce((sum, d) => sum + Math.abs(d.value), 0);
    }

    /**
     * Helper: Get average daily total from last N days
     */
    static getAverageDailyTotal(data, days, beforeDate, excludeIncompleteLastDay = false) {
        const endDate = new Date(beforeDate);
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - days);

        const startStr = formatDate(startDate);
        const endStr = formatDate(endDate);

        // Group data by date and calculate daily totals
        const dailyTotals = {};
        const dailyCounts = {};

        data.forEach(d => {
            const dateStr = d.ts.substring(0, 10);
            if (dateStr >= startStr && dateStr < endStr) {
                if (!dailyTotals[dateStr]) {
                    dailyTotals[dateStr] = 0;
                    dailyCounts[dateStr] = 0;
                }
                dailyTotals[dateStr] += Math.abs(d.value);
                dailyCounts[dateStr]++;
            }
        });

        // Filter out incomplete days if requested
        let totals = Object.keys(dailyTotals).map(date => ({
            date,
            total: dailyTotals[date],
            count: dailyCounts[date]
        }));

        if (excludeIncompleteLastDay) {
            totals = totals.filter(d => d.count >= MIN_HOURS_FOR_COMPLETE_DAY);
        }

        if (totals.length === 0) return 0;

        // Return average of daily totals
        const sum = totals.reduce((acc, d) => acc + d.total, 0);
        return sum / totals.length;
    }

    /**
     * Helper: Calculate daily totals for last N days
     */
    static calculateDailyTotals(data, days, excludeIncompleteLastDay = false) {
        if (data.length === 0) return [];

        const endDate = new Date(data[data.length - 1].ts);
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - days);

        const startStr = formatDate(startDate);
        const endStr = formatDate(endDate);

        // Group data by date and calculate daily totals
        const dailyTotals = {};
        const dailyCounts = {};

        data.forEach(d => {
            const dateStr = d.ts.substring(0, 10);
            if (dateStr >= startStr && dateStr <= endStr) {
                if (!dailyTotals[dateStr]) {
                    dailyTotals[dateStr] = 0;
                    dailyCounts[dateStr] = 0;
                }
                dailyTotals[dateStr] += Math.abs(d.value);
                dailyCounts[dateStr]++;
            }
        });

        // Return array of daily totals in chronological order
        let dates = Object.keys(dailyTotals).sort();

        // Exclude incomplete last day if requested
        if (excludeIncompleteLastDay && dates.length > 0) {
            const lastDate = dates[dates.length - 1];
            if (dailyCounts[lastDate] < MIN_HOURS_FOR_COMPLETE_DAY) {
                dates = dates.slice(0, -1);
            }
        }

        return dates.map(date => dailyTotals[date]);
    }

    /**
     * Helper: Get last day's total
     */
    static getLastDayTotal(data) {
        if (data.length === 0) return 0;

        const lastDate = new Date(data[data.length - 1].ts);
        return this.getDailyTotalForDate(data, lastDate);
    }

    /**
     * Helper: Get last complete day's total
     */
    static getLastCompleteDayTotal(data) {
        if (data.length === 0) return 0;

        // Group data by date
        const dailyData = {};
        data.forEach(d => {
            const dateStr = d.ts.substring(0, 10);
            if (!dailyData[dateStr]) {
                dailyData[dateStr] = [];
            }
            dailyData[dateStr].push(d);
        });

        // Find last complete day
        const dates = Object.keys(dailyData).sort().reverse();
        for (const date of dates) {
            if (dailyData[date].length >= MIN_HOURS_FOR_COMPLETE_DAY) {
                return dailyData[date].reduce((sum, d) => sum + Math.abs(d.value), 0);
            }
        }

        // Fallback: return average of all available data
        return this.getAverageDailyTotal(data, SHORT_TERM_DAYS, new Date(data[data.length - 1].ts), true);
    }

    /**
     * ========================================================================
     * GENERATION FORECAST (Weather-based)
     * ========================================================================
     */

    /**
     * Generate solar generation forecast using weather data
     * @param {string} targetDate - Base date for forecast (YYYY-MM-DD)
     * @param {number} forecastDays - Number of days to forecast
     * @param {Array} historicalGeneration - Historical generation data
     * @param {Object} historicalWeather - Historical weather data (daily aggregated)
     * @param {Object} forecastWeather - Forecast weather data (daily aggregated)
     * @returns {Object} Forecast result with predictions and metadata
     */
    static async generateGenerationForecast(
        targetDate,
        forecastDays,
        historicalGeneration,
        historicalWeather,
        forecastWeather
    ) {
        try {
            // 1. Train linear regression model using historical data
            const model = this.trainWeatherModel(historicalGeneration, historicalWeather);

            // 2. Generate predictions using forecast weather
            const predictions = this.predictWithWeatherModel(
                targetDate,
                forecastDays,
                model,
                forecastWeather
            );

            // 3. Return result with metadata
            return {
                success: true,
                predictions: predictions,
                metadata: {
                    strategy: 'WEATHER_BASED_LINEAR_REGRESSION',
                    strategyName: 'Weather-Based Linear Regression',
                    confidence: model.confidence,
                    accuracy: model.r_squared,
                    model: {
                        coefficients: model.coefficients,
                        intercept: model.intercept,
                        r_squared: model.r_squared
                    },
                    trainingDays: model.trainingDays,
                    warning: model.trainingDays < 30
                        ? 'Limited training data may affect accuracy'
                        : null
                }
            };
        } catch (error) {
            console.error('Generation forecast error:', error);
            throw error;
        }
    }

    /**
     * Train linear regression model: generation = f(weather)
     * Model: generation = a*direct_radiation + b*temperature + c*(100-cloud_cover) + d
     */
    static trainWeatherModel(historicalGeneration, historicalWeather) {
        // Aggregate generation to daily
        const dailyGeneration = {};
        historicalGeneration.forEach(item => {
            const date = item.ts.split(' ')[0]; // Extract date part (YYYY-MM-DD)
            if (!dailyGeneration[date]) {
                dailyGeneration[date] = 0;
            }
            dailyGeneration[date] += item.value;
        });

        // Prepare training data
        const dates = Object.keys(dailyGeneration).sort();
        const trainingData = [];

        dates.forEach(date => {
            if (historicalWeather[date]) {
                trainingData.push({
                    date: date,
                    generation: dailyGeneration[date],
                    direct_radiation: historicalWeather[date].total_direct_radiation,
                    temperature: historicalWeather[date].avg_temperature,
                    cloud_cover: historicalWeather[date].avg_cloud_cover
                });
            }
        });

        if (trainingData.length < 7) {
            throw new Error('Insufficient training data (minimum 7 days required)');
        }

        // Perform multiple linear regression
        // Y = a*X1 + b*X2 + c*X3 + d
        const n = trainingData.length;
        const Y = trainingData.map(d => d.generation);
        const X1 = trainingData.map(d => d.direct_radiation);
        const X2 = trainingData.map(d => d.temperature);
        const X3 = trainingData.map(d => 100 - d.cloud_cover); // Inverted cloud cover

        // Calculate means
        const meanY = Y.reduce((a, b) => a + b, 0) / n;
        const meanX1 = X1.reduce((a, b) => a + b, 0) / n;
        const meanX2 = X2.reduce((a, b) => a + b, 0) / n;
        const meanX3 = X3.reduce((a, b) => a + b, 0) / n;

        // Build matrices for normal equations
        // Using simplified approach for 3 variables
        let sumX1Y = 0, sumX2Y = 0, sumX3Y = 0;
        let sumX1X1 = 0, sumX2X2 = 0, sumX3X3 = 0;
        let sumX1X2 = 0, sumX1X3 = 0, sumX2X3 = 0;

        for (let i = 0; i < n; i++) {
            const y = Y[i] - meanY;
            const x1 = X1[i] - meanX1;
            const x2 = X2[i] - meanX2;
            const x3 = X3[i] - meanX3;

            sumX1Y += x1 * y;
            sumX2Y += x2 * y;
            sumX3Y += x3 * y;

            sumX1X1 += x1 * x1;
            sumX2X2 += x2 * x2;
            sumX3X3 += x3 * x3;

            sumX1X2 += x1 * x2;
            sumX1X3 += x1 * x3;
            sumX2X3 += x2 * x3;
        }

        // Solve using simplified method (assuming variables are relatively independent)
        const a = sumX1X1 > 0 ? sumX1Y / sumX1X1 : 0;
        const b = sumX2X2 > 0 ? sumX2Y / sumX2X2 : 0;
        const c = sumX3X3 > 0 ? sumX3Y / sumX3X3 : 0;
        const d = meanY - (a * meanX1 + b * meanX2 + c * meanX3);

        // Calculate R-squared
        let ssTotal = 0, ssResidual = 0;
        for (let i = 0; i < n; i++) {
            const predicted = a * X1[i] + b * X2[i] + c * X3[i] + d;
            ssTotal += Math.pow(Y[i] - meanY, 2);
            ssResidual += Math.pow(Y[i] - predicted, 2);
        }
        const rSquared = ssTotal > 0 ? 1 - (ssResidual / ssTotal) : 0;

        return {
            coefficients: {
                direct_radiation: a,
                temperature: b,
                cloud_cover_inverted: c
            },
            intercept: d,
            r_squared: Math.max(0, Math.min(1, rSquared)),
            confidence: rSquared > 0.7 ? CONFIDENCE.HIGH :
                rSquared > 0.5 ? CONFIDENCE.MEDIUM :
                    CONFIDENCE.LOW,
            trainingDays: n
        };
    }

    /**
     * Predict generation using trained weather model
     */
    static predictWithWeatherModel(targetDate, forecastDays, model, forecastWeather) {
        const predictions = [];
        const target = new Date(targetDate + 'T12:00:00');

        for (let i = 1; i <= forecastDays; i++) {
            const forecastDate = addDays(target, i);
            const dateStr = formatDate(forecastDate);

            if (forecastWeather[dateStr]) {
                const weather = forecastWeather[dateStr];

                // Apply model: generation = a*X1 + b*X2 + c*X3 + d
                const predictedGeneration =
                    model.coefficients.direct_radiation * weather.total_direct_radiation +
                    model.coefficients.temperature * weather.avg_temperature +
                    model.coefficients.cloud_cover_inverted * (100 - weather.avg_cloud_cover) +
                    model.intercept;

                // Ensure non-negative
                const finalPrediction = Math.max(0, predictedGeneration);

                predictions.push({
                    date: dateStr,
                    value: finalPrediction,
                    weather: {
                        direct_radiation: weather.total_direct_radiation,
                        temperature: weather.avg_temperature,
                        cloud_cover: weather.avg_cloud_cover
                    }
                });
            } else {
                // Fallback: use average if weather data not available
                console.warn(`No weather data for ${dateStr}, using fallback`);
                predictions.push({
                    date: dateStr,
                    value: 0,
                    warning: 'No weather data available'
                });
            }
        }

        return predictions;
    }
}

module.exports = ForecastService;
