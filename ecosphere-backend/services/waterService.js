// Water Service - Handle water data queries from SQL Server
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const {
    buildSqlcmdCommand,
    filterOutputLines,
    QUERY_CONSTANTS,
    TABLE_NAMES
} = require('../config/database');

class WaterService {
    /**
     * Get available date range for a table
     */
    static async getAvailableDateRange(tableName) {
        const query = `SELECT MIN(CONVERT(varchar, ts, 23)) as minDate, MAX(CONVERT(varchar, ts, 23)) as maxDate FROM [${tableName}]`;
        const command = buildSqlcmdCommand(query);

        try {
            const { stdout } = await execPromise(command);
            const lines = filterOutputLines(stdout);

            if (lines.length > 0) {
                const parts = lines[0].split(QUERY_CONSTANTS.CSV_DELIMITER).map(p => p.trim());
                return {
                    minDate: parts[0],
                    maxDate: parts[1]
                };
            }

            return null;
        } catch (error) {
            console.error(`Error getting date range for ${tableName}:`, error.message);
            throw error;
        }
    }

    /**
     * Get rainwater level data (TL93)
     * Aggregated to hourly averages
     * Original interval: 10 minutes
     * Date range: 2018-10-13 to 2020-11-08 (758 days)
     * Unit: Percentage (%)
     */
    static async getRainwaterLevelData(dateFrom, dateTo) {
        const tableName = TABLE_NAMES.RAINWATER_LEVEL;

        // Aggregate 10-minute data to hourly averages using DATEPART
        const query = `SELECT CONVERT(varchar, CAST(ts AS DATE), 23) + ' ' + RIGHT('0' + CAST(DATEPART(HOUR, ts) AS VARCHAR), 2) + ':00:00' as ts, AVG(value) as value FROM [${tableName}] WHERE ts >= '${dateFrom}' AND ts < DATEADD(day, 1, '${dateTo}') GROUP BY CAST(ts AS DATE), DATEPART(HOUR, ts) ORDER BY CAST(ts AS DATE), DATEPART(HOUR, ts)`;
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

            return results;
        } catch (error) {
            console.error('Error getting rainwater level data:', error.message);
            throw error;
        }
    }

    /**
     * Get hot water consumption data (TL210)
     * Aggregated to hourly sums
     * Original interval: 1 minute
     * Date range: 2018-09-11 to 2019-11-14 (430 days)
     * Unit: Liters per hour (L/h)
     */
    static async getHotWaterConsumptionData(dateFrom, dateTo) {
        const tableName = TABLE_NAMES.HOT_WATER_CONSUMPTION;

        // Aggregate 1-minute data to hourly sums using DATEPART
        const query = `SELECT CONVERT(varchar, CAST(ts AS DATE), 23) + ' ' + RIGHT('0' + CAST(DATEPART(HOUR, ts) AS VARCHAR), 2) + ':00:00' as ts, SUM(value) as value FROM [${tableName}] WHERE ts >= '${dateFrom}' AND ts < DATEADD(day, 1, '${dateTo}') GROUP BY CAST(ts AS DATE), DATEPART(HOUR, ts) ORDER BY CAST(ts AS DATE), DATEPART(HOUR, ts)`;
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
}

module.exports = WaterService;
