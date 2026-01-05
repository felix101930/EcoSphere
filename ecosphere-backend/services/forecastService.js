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
}

module.exports = ForecastService;
