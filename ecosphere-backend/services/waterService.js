// Water Service - Handle water data queries from SQL Server
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const cache = require('../utils/cache');

const {
    buildSqlcmdCommand,
    filterOutputLines,
    QUERY_CONSTANTS,
    TABLE_NAMES
} = require('../config/database');

// Cache TTL constants
const CACHE_TTL = {
    DATE_RANGE: 24 * 60 * 60 * 1000,
    HISTORICAL_DATA: Infinity,
    RECENT_DATA: 5 * 60 * 1000
};

class WaterService {
    /**
     * Get available date range for a table
     */
    static async getAvailableDateRange(tableName) {
        const cacheKey = cache.constructor.generateKey('waterDateRange', tableName);
        const cached = cache.get(cacheKey);
        if (cached) return cached;

        const query = `SELECT MIN(CONVERT(varchar, ts, 23)) as minDate, MAX(CONVERT(varchar, ts, 23)) as maxDate FROM [${tableName}]`;
        const command = buildSqlcmdCommand(query);

        try {
            const { stdout } = await execPromise(command);
            const lines = filterOutputLines(stdout);

            if (lines.length > 0) {
                const parts = lines[0].split(QUERY_CONSTANTS.CSV_DELIMITER).map(p => p.trim());
                const result = {
                    minDate: parts[0],
                    maxDate: parts[1]
                };
                cache.set(cacheKey, result, CACHE_TTL.DATE_RANGE);
                return result;
            }

            return null;
        } catch (error) {
            console.error(`Error getting date range for ${tableName}:`, error.message);
            throw error;
        }
    }

    /**
     * Get rainwater level data (TL93)
     * Interval: 10 minutes (raw data from database)
     * Date range: 2018-10-13 to 2020-11-08
     * Unit: Percentage (%)
     */
    static async getRainwaterLevelData(dateFrom, dateTo) {
        const cacheKey = cache.constructor.generateKey('rainwaterLevel', dateFrom, dateTo);
        const cached = cache.get(cacheKey);
        if (cached) return cached;

        const tableName = TABLE_NAMES.RAINWATER_LEVEL;

        // Query raw 10-minute interval data
        const query = `SELECT CONVERT(varchar, ts, 120) as ts, value FROM [${tableName}] WHERE ts >= '${dateFrom}' AND ts < DATEADD(day, 1, '${dateTo}') ORDER BY ts`;
        const command = buildSqlcmdCommand(query);

        try {
            const { stdout } = await execPromise(command);
            const lines = filterOutputLines(stdout);

            const results = lines.map(line => {
                const parts = line.split(QUERY_CONSTANTS.CSV_DELIMITER).map(p => p.trim());
                if (parts.length >= QUERY_CONSTANTS.MIN_PARTS_BASIC) {
                    return {
                        ts: parts[0],
                        value: parseFloat(parts[1])
                    };
                }
                return null;
            }).filter(item => item !== null);

            // Use appropriate TTL based on data recency
            const ttl = this.isRecentData(dateTo) ? CACHE_TTL.RECENT_DATA : CACHE_TTL.HISTORICAL_DATA;
            cache.set(cacheKey, results, ttl);

            return results;
        } catch (error) {
            console.error('Error getting rainwater level data:', error.message);
            throw error;
        }
    }

    /**
     * Get hot water consumption data (TL210)
     * Interval: 1 minute (raw data from database)
     * Date range: 2018-09-11 to 2019-11-14
     * Unit: Liters per hour (L/h)
     */
    static async getHotWaterConsumptionData(dateFrom, dateTo) {
        const cacheKey = cache.constructor.generateKey('hotWaterConsumption', dateFrom, dateTo);
        const cached = cache.get(cacheKey);
        if (cached) return cached;

        const tableName = TABLE_NAMES.HOT_WATER_CONSUMPTION;

        // Query raw 1-minute interval data
        const query = `SELECT CONVERT(varchar, ts, 120) as ts, value FROM [${tableName}] WHERE ts >= '${dateFrom}' AND ts < DATEADD(day, 1, '${dateTo}') ORDER BY ts`;
        const command = buildSqlcmdCommand(query);

        try {
            const { stdout } = await execPromise(command);
            const lines = filterOutputLines(stdout);

            const results = lines.map(line => {
                const parts = line.split(QUERY_CONSTANTS.CSV_DELIMITER).map(p => p.trim());
                if (parts.length >= QUERY_CONSTANTS.MIN_PARTS_BASIC) {
                    return {
                        ts: parts[0],
                        value: parseFloat(parts[1])
                    };
                }
                return null;
            }).filter(item => item !== null);

            // Use appropriate TTL based on data recency
            const ttl = this.isRecentData(dateTo) ? CACHE_TTL.RECENT_DATA : CACHE_TTL.HISTORICAL_DATA;
            cache.set(cacheKey, results, ttl);

            return results;
        } catch (error) {
            console.error('Error getting hot water consumption data:', error.message);
            throw error;
        }
    }

    /**
     * Calculate metrics for water data
     * @param {Array} data - Array of {ts, value} objects
     * @returns {Object} Metrics object with total, average, peak, min
     */
    static calculateMetrics(data) {
        if (!data || data.length === 0) {
            return {
                total: 0,
                average: 0,
                peak: 0,
                min: 0
            };
        }

        const values = data.map(d => d.value);
        const total = values.reduce((sum, val) => sum + val, 0);
        const average = total / values.length;
        const peak = Math.max(...values);
        const min = Math.min(...values);

        return {
            total,
            average,
            peak,
            min
        };
    }

    /**
     * Check if data is recent (within last 7 days)
     * @param {string} dateTo - End date in YYYY-MM-DD format
     * @returns {boolean}
     */
    static isRecentData(dateTo) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const dateToCheck = new Date(dateTo);
        return dateToCheck >= sevenDaysAgo;
    }
}

module.exports = WaterService;
