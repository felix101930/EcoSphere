// Forecast Service - Multi-tier prediction with graceful degradation
const t = require('timeseries-analysis');
const cache = require('../utils/cache');
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

// Cache TTL for forecasts (1 hour)
const FORECAST_CACHE_TTL = 60 * 60 * 1000;

class ForecastService {
    /**
     * Main forecast function - intelligently selects best algorithm
     */
    static async generateForecast(targetDate, forecastDays, historicalData) {
        // Check cache first
        const cacheKey = cache.constructor.generateKey('forecast', targetDate, forecastDays, historicalData.length);
        const cached = cache.get(cacheKey);
        if (cached) {
            return cached;
        }

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

            // Cache the result
            cache.set(cacheKey, result, FORECAST_CACHE_TTL);

            return result;
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

        // Check for 2 years of data (Holt-Winters standard requirement)
        // Instead of requiring full 17,520 points, check:
        // 1. Time span covers 2 years
        // 2. Completeness is acceptable (≥70%)
        let hasTwoYearCycle = false;
        if (dataPoints > 0) {
            const firstDate = new Date(historicalData[0].ts);
            const lastDate = new Date(historicalData[historicalData.length - 1].ts);
            const timeSpanDays = (lastDate - firstDate) / MS_PER_DAY;

            // Check if time span is at least 2 years (730 days)
            // AND we have reasonable data completeness
            const completenessScore = this.calculateDataCompleteness(historicalData);
            hasTwoYearCycle = timeSpanDays >= (2 * DAYS_PER_YEAR) && completenessScore >= MIN_COMPLETENESS_SCORE;

            console.log(`📊 Data span: ${timeSpanDays.toFixed(0)} days (need ≥730 days)`);
            console.log(`📊 Completeness: ${completenessScore}% (need ≥${MIN_COMPLETENESS_SCORE}%)`);
            console.log(`📊 Has 2-Year Cycle: ${hasTwoYearCycle ? '✅' : '❌'}`);
        }

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

        // Calculate completeness score for the ACTUAL data provided
        // This should match what the controller fetched (2 years)
        const completenessScore = this.calculateDataCompleteness(historicalData);

        // Identify missing periods
        const missingPeriods = this.identifyMissingPeriods(historicalData);

        return {
            hasTwoYearCycle,
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
     * Calculate completeness for the ACTUAL data provided
     * This checks the data that was actually fetched, not a subset
     * 
     * @param {Array} data - Historical data array
     * @returns {number} Completeness score (0-100)
     */
    static calculateDataCompleteness(data) {
        if (data.length === 0) return 0;
        if (data.length < 2) return 100;

        // Calculate expected points based on actual date range in the data
        const firstDate = new Date(data[0].ts);
        const lastDate = new Date(data[data.length - 1].ts);
        const totalHours = (lastDate - firstDate) / MS_PER_HOUR;
        const expectedPoints = Math.floor(totalHours);

        if (expectedPoints === 0) return 100;

        // Calculate completeness
        const actualPoints = data.length;
        const completeness = (actualPoints / expectedPoints) * 100;

        return Math.min(100, Math.round(completeness));
    }

    /**
     * Calculate data completeness score (0-100)
     * Uses entire data range - kept for backward compatibility
     */
    static calculateCompleteness(data) {
        return this.calculateDataCompleteness(data);
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
        // Tier 1: Holt-Winters (Best) - Requires 2 years of data with good completeness
        if (dataAvailability.hasTwoYearCycle &&
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
     * Simplified implementation using historical seasonal patterns
     */
    static holtWintersForecast(data, forecastDays) {
        // Use last week's pattern as seasonal baseline
        const period = DAYS_PER_WEEK * HOURS_PER_DAY;  // 168 hours
        const recentData = data.slice(-period);

        // Calculate average level and trend
        const avgLevel = recentData.reduce((sum, d) => sum + Math.abs(d.value), 0) / recentData.length;
        const trend = calculateLinearTrend(recentData);

        // Extract seasonal pattern from last week
        const seasonalPattern = recentData.map(d => Math.abs(d.value) / avgLevel);

        // Generate hourly forecasts
        const forecastHours = forecastDays * HOURS_PER_DAY;
        const lastTimestamp = new Date(data[data.length - 1].ts).getTime();
        const hourlyForecasts = [];

        for (let h = 0; h < forecastHours; h++) {
            const timestamp = lastTimestamp + (h + 1) * MS_PER_HOUR;
            // Use seasonal pattern (repeat weekly pattern)
            const seasonalIndex = h % period;
            const seasonalFactor = seasonalPattern[seasonalIndex];
            // Apply: (level + trend * time) * seasonal_factor
            const forecastValue = (avgLevel + trend * (h + 1)) * seasonalFactor;
            hourlyForecasts.push([timestamp, Math.max(0, forecastValue)]);
        }

        // Aggregate to daily totals
        return aggregateHourlyToDaily(hourlyForecasts, forecastDays);
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
        // Check cache first
        const cacheKey = cache.constructor.generateKey(
            'genForecast',
            targetDate,
            forecastDays,
            historicalGeneration.length,
            Object.keys(forecastWeather).length
        );
        const cached = cache.get(cacheKey);
        if (cached) {
            return cached;
        }

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
            const result = {
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

            // Cache the result
            cache.set(cacheKey, result, FORECAST_CACHE_TTL);

            return result;
        } catch (error) {
            console.error('Generation forecast error:', error);
            throw error;
        }
    }

    /**
     * Train linear regression model: generation = f(weather)
     * Model: generation = a*direct_radiation + b
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
                    direct_radiation: historicalWeather[date].total_direct_radiation
                });
            }
        });

        if (trainingData.length < 7) {
            throw new Error('Insufficient training data (minimum 7 days required)');
        }

        // Simple linear regression: Y = a*X + b
        const n = trainingData.length;
        const Y = trainingData.map(d => d.generation);
        const X = trainingData.map(d => d.direct_radiation);

        // Calculate means
        const meanY = Y.reduce((a, b) => a + b, 0) / n;
        const meanX = X.reduce((a, b) => a + b, 0) / n;

        // Calculate slope (a) and intercept (b)
        let numerator = 0;
        let denominator = 0;

        for (let i = 0; i < n; i++) {
            numerator += (X[i] - meanX) * (Y[i] - meanY);
            denominator += (X[i] - meanX) * (X[i] - meanX);
        }

        const a = denominator > 0 ? numerator / denominator : 0;
        const b = meanY - (a * meanX);

        // Calculate R-squared
        let ssTotal = 0, ssResidual = 0;
        for (let i = 0; i < n; i++) {
            const predicted = a * X[i] + b;
            ssTotal += Math.pow(Y[i] - meanY, 2);
            ssResidual += Math.pow(Y[i] - predicted, 2);
        }
        const rSquared = ssTotal > 0 ? 1 - (ssResidual / ssTotal) : 0;

        return {
            coefficients: {
                direct_radiation: a
            },
            intercept: b,
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

                // Apply model: generation = a*direct_radiation + b
                const predictedGeneration =
                    model.coefficients.direct_radiation * weather.total_direct_radiation +
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

    /**
     * ========================================================================
     * RAINWATER FORECAST (Weather-based)
     * ========================================================================
     */

    /**
     * Generate rainwater level forecast using weather data (precipitation)
     * @param {string} targetDate - Base date for forecast (YYYY-MM-DD)
     * @param {number} forecastDays - Number of days to forecast
     * @param {Array} historicalRainwater - Historical rainwater level data
     * @param {Object} historicalWeather - Historical weather data (daily aggregated)
     * @param {Object} forecastWeather - Forecast weather data (daily aggregated)
     * @returns {Object} Forecast result with predictions and metadata
     */
    static async generateRainwaterForecast(
        targetDate,
        forecastDays,
        historicalRainwater,
        historicalWeather,
        forecastWeather
    ) {
        try {
            // 1. Train linear regression model using historical data
            const model = this.trainRainwaterModel(historicalRainwater, historicalWeather);

            // 2. Generate predictions using forecast weather
            const predictions = this.predictWithRainwaterModel(
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
            console.error('Rainwater forecast error:', error);
            throw error;
        }
    }

    /**
     * Train linear regression model: rainwater_level = f(precipitation)
     * Model: rainwater_level = a*precipitation + b
     */
    static trainRainwaterModel(historicalRainwater, historicalWeather) {
        // Aggregate rainwater to daily average
        const dailyRainwater = {};
        historicalRainwater.forEach(item => {
            const date = item.ts.split(' ')[0]; // Extract date part (YYYY-MM-DD)
            if (!dailyRainwater[date]) {
                dailyRainwater[date] = {
                    values: [],
                    count: 0
                };
            }
            dailyRainwater[date].values.push(item.value);
            dailyRainwater[date].count++;
        });

        // Calculate daily average rainwater level
        Object.keys(dailyRainwater).forEach(date => {
            const data = dailyRainwater[date];
            dailyRainwater[date] = data.values.reduce((a, b) => a + b, 0) / data.count;
        });

        // Prepare training data
        const dates = Object.keys(dailyRainwater).sort();
        const trainingData = [];

        dates.forEach(date => {
            if (historicalWeather[date]) {
                trainingData.push({
                    date: date,
                    rainwater_level: dailyRainwater[date],
                    precipitation: historicalWeather[date].total_precipitation
                });
            }
        });

        if (trainingData.length < 7) {
            throw new Error('Insufficient training data (minimum 7 days required)');
        }

        // Simple linear regression: Y = a*X + b
        const n = trainingData.length;
        const Y = trainingData.map(d => d.rainwater_level);
        const X = trainingData.map(d => d.precipitation);

        // Calculate means
        const meanY = Y.reduce((a, b) => a + b, 0) / n;
        const meanX = X.reduce((a, b) => a + b, 0) / n;

        // Calculate slope (a) and intercept (b)
        let numerator = 0;
        let denominator = 0;

        for (let i = 0; i < n; i++) {
            numerator += (X[i] - meanX) * (Y[i] - meanY);
            denominator += (X[i] - meanX) * (X[i] - meanX);
        }

        const a = denominator > 0 ? numerator / denominator : 0;
        const b = meanY - (a * meanX);

        // Calculate R-squared
        let ssTotal = 0, ssResidual = 0;
        for (let i = 0; i < n; i++) {
            const predicted = a * X[i] + b;
            ssTotal += Math.pow(Y[i] - meanY, 2);
            ssResidual += Math.pow(Y[i] - predicted, 2);
        }
        const rSquared = ssTotal > 0 ? 1 - (ssResidual / ssTotal) : 0;

        return {
            coefficients: {
                precipitation: a
            },
            intercept: b,
            r_squared: Math.max(0, Math.min(1, rSquared)),
            confidence: rSquared > 0.7 ? CONFIDENCE.HIGH :
                rSquared > 0.5 ? CONFIDENCE.MEDIUM :
                    CONFIDENCE.LOW,
            trainingDays: n
        };
    }

    /**
     * Predict rainwater level using trained weather model
     */
    static predictWithRainwaterModel(targetDate, forecastDays, model, forecastWeather) {
        const predictions = [];
        const target = new Date(targetDate + 'T12:00:00');

        for (let i = 1; i <= forecastDays; i++) {
            const forecastDate = addDays(target, i);
            const dateStr = formatDate(forecastDate);

            if (forecastWeather[dateStr]) {
                const weather = forecastWeather[dateStr];

                // Apply model: rainwater_level = a*precipitation + b
                const predictedLevel =
                    model.coefficients.precipitation * weather.total_precipitation +
                    model.intercept;

                // Ensure level is between 0 and 100 (percentage)
                const finalPrediction = Math.max(0, Math.min(100, predictedLevel));

                predictions.push({
                    date: dateStr,
                    value: finalPrediction,
                    weather: {
                        precipitation: weather.total_precipitation,
                        rain: weather.total_rain,
                        temperature: weather.avg_temperature
                    }
                });
            } else {
                // Fallback: use intercept if weather data not available
                console.warn(`No weather data for ${dateStr}, using fallback`);
                predictions.push({
                    date: dateStr,
                    value: Math.max(0, Math.min(100, model.intercept)),
                    warning: 'No weather data available'
                });
            }
        }

        return predictions;
    }

    /**
     * ========================================================================
     * THERMAL FORECAST (Hybrid: Historical + Weather)
     * ========================================================================
     */

    /**
     * Generate thermal (indoor temperature) forecast using hybrid model
     * Combines historical patterns (80%) with weather adjustment (20%)
     * @param {string} targetDate - Base date for forecast (YYYY-MM-DD)
     * @param {number} forecastDays - Number of days to forecast
     * @param {Array} historicalThermal - Historical thermal data
     * @param {Object} historicalWeather - Historical weather data (daily aggregated)
     * @param {Object} forecastWeather - Forecast weather data (daily aggregated)
     * @returns {Object} Forecast result with predictions and metadata
     */
    static async generateThermalForecast(
        targetDate,
        forecastDays,
        historicalThermal,
        historicalWeather,
        forecastWeather
    ) {
        try {
            // 1. Calculate historical baseline (moving average)
            const baseline = this.calculateThermalBaseline(historicalThermal);

            // 2. Train weather adjustment model
            const weatherModel = this.trainThermalWeatherModel(
                historicalThermal,
                historicalWeather
            );

            // 3. Generate predictions using hybrid model
            const predictions = this.predictWithThermalModel(
                targetDate,
                forecastDays,
                baseline,
                weatherModel,
                forecastWeather
            );

            // 4. Extract outdoor temperature for comparison
            const outdoorTemperature = predictions.map(p => ({
                date: p.date,
                value: p.weather?.outdoor_temp || null
            }));

            // 5. Return result with metadata
            return {
                success: true,
                predictions: predictions,
                outdoorTemperature: outdoorTemperature,
                metadata: {
                    strategy: 'HYBRID_HISTORICAL_WEATHER',
                    strategyName: 'Hybrid Model (Historical + Weather)',
                    confidence: CONFIDENCE.MEDIUM,
                    accuracy: 'Historical baseline with weather adjustment',
                    model: {
                        baseline_temp: baseline.avg_temp,
                        weather_coefficient: weatherModel.coefficient,
                        comfortable_temp: weatherModel.comfortable_temp
                    },
                    trainingDays: baseline.days,
                    warning: baseline.days < 30
                        ? 'Limited training data may affect accuracy'
                        : null
                }
            };
        } catch (error) {
            console.error('Thermal forecast error:', error);
            throw error;
        }
    }

    /**
     * Calculate thermal baseline from historical data
     * Returns average temperature and daily range
     */
    static calculateThermalBaseline(historicalThermal) {
        // Aggregate to daily average
        const dailyData = {};

        historicalThermal.forEach(item => {
            const date = item.ts.split(' ')[0];
            if (!dailyData[date]) {
                dailyData[date] = {
                    values: [],
                    count: 0
                };
            }
            dailyData[date].values.push(item.value);
            dailyData[date].count++;
        });

        // Calculate daily averages
        const dailyAverages = [];
        Object.keys(dailyData).forEach(date => {
            const data = dailyData[date];
            const avg = data.values.reduce((a, b) => a + b, 0) / data.count;
            const high = Math.max(...data.values);
            const low = Math.min(...data.values);
            dailyAverages.push({
                date,
                avg,
                high,
                low,
                range: high - low
            });
        });

        if (dailyAverages.length === 0) {
            throw new Error('Insufficient thermal data for baseline calculation');
        }

        // Calculate overall statistics
        const avgTemp = dailyAverages.reduce((sum, d) => sum + d.avg, 0) / dailyAverages.length;
        const avgRange = dailyAverages.reduce((sum, d) => sum + d.range, 0) / dailyAverages.length;

        return {
            avg_temp: avgTemp,
            avg_range: avgRange,
            days: dailyAverages.length
        };
    }

    /**
     * Train weather adjustment model for thermal forecast
     * Model: indoor_temp_adjustment = k × (outdoor_temp - comfortable_temp)
     */
    static trainThermalWeatherModel(historicalThermal, historicalWeather) {
        // Aggregate thermal to daily average
        const dailyThermal = {};
        historicalThermal.forEach(item => {
            const date = item.ts.split(' ')[0];
            if (!dailyThermal[date]) {
                dailyThermal[date] = {
                    values: [],
                    count: 0
                };
            }
            dailyThermal[date].values.push(item.value);
            dailyThermal[date].count++;
        });

        // Calculate daily average indoor temperature
        Object.keys(dailyThermal).forEach(date => {
            const data = dailyThermal[date];
            dailyThermal[date] = data.values.reduce((a, b) => a + b, 0) / data.count;
        });

        // Prepare training data
        const dates = Object.keys(dailyThermal).sort();
        const trainingData = [];

        dates.forEach(date => {
            if (historicalWeather[date]) {
                trainingData.push({
                    date: date,
                    indoor_temp: dailyThermal[date],
                    outdoor_temp: historicalWeather[date].avg_temperature
                });
            }
        });

        if (trainingData.length < 7) {
            // Fallback: use default coefficient
            return {
                coefficient: 0.05,
                comfortable_temp: 22,
                trainingDays: 0
            };
        }

        // Calculate comfortable temperature (average indoor temp)
        const comfortableTemp = trainingData.reduce((sum, d) => sum + d.indoor_temp, 0) / trainingData.length;

        // Simple linear regression to find weather influence coefficient
        // indoor_temp = comfortable_temp + k × (outdoor_temp - comfortable_temp)
        const n = trainingData.length;
        const Y = trainingData.map(d => d.indoor_temp - comfortableTemp);
        const X = trainingData.map(d => d.outdoor_temp - comfortableTemp);

        // Calculate coefficient k
        let numerator = 0;
        let denominator = 0;

        for (let i = 0; i < n; i++) {
            numerator += X[i] * Y[i];
            denominator += X[i] * X[i];
        }

        const k = denominator > 0 ? numerator / denominator : 0.05;

        // Use absolute value and apply reasonable limits
        // If coefficient is too small (< 0.02), use a default value for more visible impact
        let finalK = Math.abs(k);
        if (finalK < 0.02) {
            // HVAC systems maintain very stable temperatures
            // Use a small but visible coefficient for demonstration
            finalK = 0.05;
        } else {
            // Limit to reasonable range
            finalK = Math.min(0.2, finalK);
        }

        return {
            coefficient: finalK,
            comfortable_temp: comfortableTemp,
            trainingDays: n
        };
    }

    /**
     * Predict indoor temperature using hybrid model
     * Combines historical baseline (80%) with weather adjustment (20%)
     */
    static predictWithThermalModel(
        targetDate,
        forecastDays,
        baseline,
        weatherModel,
        forecastWeather
    ) {
        const predictions = [];
        const target = new Date(targetDate + 'T12:00:00');

        for (let i = 1; i <= forecastDays; i++) {
            const forecastDate = addDays(target, i);
            const dateStr = formatDate(forecastDate);

            if (forecastWeather[dateStr]) {
                const weather = forecastWeather[dateStr];

                // Historical baseline (80% weight)
                const historicalComponent = baseline.avg_temp * 0.8;

                // Weather adjustment (20% weight)
                const outdoorTemp = weather.avg_temperature;
                const tempDiff = outdoorTemp - weatherModel.comfortable_temp;
                const weatherAdjustment = weatherModel.coefficient * tempDiff;
                const weatherComponent = (baseline.avg_temp + weatherAdjustment) * 0.2;

                // Combined prediction
                const predictedTemp = historicalComponent + weatherComponent;

                // Ensure reasonable range (15°C to 30°C for indoor temperature)
                const finalPrediction = Math.max(15, Math.min(30, predictedTemp));

                predictions.push({
                    date: dateStr,
                    value: finalPrediction,
                    weather: {
                        outdoor_temp: outdoorTemp,
                        solar_radiation: weather.avg_shortwave_radiation || 0
                    }
                });
            } else {
                // Fallback: use baseline if weather data not available
                console.warn(`No weather data for ${dateStr}, using baseline`);
                predictions.push({
                    date: dateStr,
                    value: baseline.avg_temp,
                    warning: 'No weather data available, using historical baseline'
                });
            }
        }

        return predictions;
    }
}

module.exports = ForecastService;
