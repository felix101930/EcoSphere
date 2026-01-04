// Data aggregation utilities for Overview Dashboard

/**
 * Aggregate hourly data to daily data
 * @param {Array} data - Array of data points with ts and value
 * @returns {Array} - Aggregated daily data
 */
export function aggregateToDaily(data) {
    if (!data || !Array.isArray(data) || data.length === 0) {
        return [];
    }

    const dailyMap = new Map();

    data.forEach(item => {
        // Extract date from timestamp (YYYY-MM-DD)
        const ts = item.ts || item.timestamp;
        if (!ts) return;

        const dateStr = ts.split(' ')[0]; // Get YYYY-MM-DD part

        if (!dailyMap.has(dateStr)) {
            dailyMap.set(dateStr, {
                values: [],
                sum: 0,
                count: 0
            });
        }

        const entry = dailyMap.get(dateStr);
        entry.values.push(item.value);
        entry.sum += item.value;
        entry.count += 1;
    });

    // Convert map to array and calculate daily averages
    const result = Array.from(dailyMap.entries()).map(([date, entry]) => ({
        ts: date,
        value: entry.sum / entry.count, // Daily average
        sum: entry.sum,
        count: entry.count,
        min: Math.min(...entry.values),
        max: Math.max(...entry.values)
    }));

    // Sort by date
    result.sort((a, b) => a.ts.localeCompare(b.ts));

    return result;
}

/**
 * Calculate metrics from aggregated data
 * @param {Array} data - Aggregated data array
 * @returns {Object} - Metrics object
 */
export function calculateDailyMetrics(data) {
    if (!data || data.length === 0) {
        return {
            total: 0,
            average: 0,
            peak: 0,
            min: 0
        };
    }

    const values = data.map(item => item.value);
    const total = data.reduce((sum, item) => sum + (item.sum || item.value), 0);

    return {
        total: total,
        average: values.reduce((sum, val) => sum + val, 0) / values.length,
        peak: Math.max(...values),
        min: Math.min(...values)
    };
}
