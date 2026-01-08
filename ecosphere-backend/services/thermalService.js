// Thermal Service - Handle thermal sensor data queries
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const cache = require('../utils/cache');

const {
  buildSqlcmdCommand,
  getFullTableName,
  filterOutputLines,
  QUERY_CONSTANTS,
  TIME_CONSTANTS,
  FALLBACK_VALUES,
  TABLE_NAMES
} = require('../config/database');

// Cache TTL constants
const CACHE_TTL = {
  DATE_RANGE: 24 * 60 * 60 * 1000,      // 24 hours for date ranges
  HISTORICAL_DATA: Infinity,             // Never expire historical data
  RECENT_DATA: 5 * 60 * 1000            // 5 minutes for recent data
};

class ThermalService {
  /**
   * Get available dates with data for a sensor
   */
  static async getAvailableDates(sensorId = TABLE_NAMES.THERMAL_DEFAULT) {
    const cacheKey = cache.constructor.generateKey('thermalDates', sensorId);
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const fullTableName = getFullTableName(sensorId);

    const query = `SELECT DISTINCT CONVERT(varchar, ts, 23) as date FROM [${fullTableName}] ORDER BY date`;
    const command = buildSqlcmdCommand(query);

    try {
      const { stdout } = await execPromise(command);
      const lines = filterOutputLines(stdout);
      const result = lines.map(line => line.trim());

      cache.set(cacheKey, result, CACHE_TTL.DATE_RANGE);
      return result;
    } catch (error) {
      console.error('Error getting available dates:', error.message);
      throw error;
    }
  }

  /**
   * Get daily data for a specific sensor and date
   */
  static async getDailyData(sensorId, date) {
    const cacheKey = cache.constructor.generateKey('thermalDaily', sensorId, date);
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const fullTableName = getFullTableName(sensorId);

    const query = `SELECT seq, CONVERT(varchar, ts, 120) as ts, value FROM [${fullTableName}] WHERE CONVERT(varchar, ts, 23) = '${date}' ORDER BY ts`;
    const command = buildSqlcmdCommand(query);

    try {
      const { stdout } = await execPromise(command);
      const lines = filterOutputLines(stdout);

      const results = lines.map(line => {
        const parts = line.split(QUERY_CONSTANTS.CSV_DELIMITER).map(p => p.trim());
        if (parts.length >= QUERY_CONSTANTS.MIN_PARTS_WITH_SEQ) {
          return {
            seq: parseInt(parts[0]),
            ts: parts[1],
            value: parseFloat(parts[2])
          };
        }
        return null;
      }).filter(item => item !== null);

      // Use appropriate TTL based on data recency
      const ttl = this.isRecentData(date) ? CACHE_TTL.RECENT_DATA : CACHE_TTL.HISTORICAL_DATA;
      cache.set(cacheKey, results, ttl);

      return results;
    } catch (error) {
      console.error('Error getting daily data:', error.message);
      throw error;
    }
  }

  /**
   * Get data for multiple sensors on a specific date
   */
  static async getMultipleSensorsDailyData(sensorIds, date) {
    const cacheKey = cache.constructor.generateKey('thermalMultiDaily', sensorIds.join(','), date);
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const dataPromises = sensorIds.map(sensorId =>
        this.getDailyData(sensorId, date)
      );

      const results = await Promise.all(dataPromises);

      // Create a map with sensor IDs as keys
      const dataMap = {};
      sensorIds.forEach((sensorId, index) => {
        dataMap[sensorId] = results[index];
      });

      // Use appropriate TTL based on data recency
      const ttl = this.isRecentData(date) ? CACHE_TTL.RECENT_DATA : CACHE_TTL.HISTORICAL_DATA;
      cache.set(cacheKey, dataMap, ttl);

      return dataMap;
    } catch (error) {
      console.error('Error getting multiple sensors data:', error.message);
      throw error;
    }
  }

  /**
   * Get aggregated data for multiple days (High/Low/Avg/Open/Close per day)
   */
  static async getAggregatedData(sensorId, dateFrom, dateTo) {
    const cacheKey = cache.constructor.generateKey('thermalAggregated', sensorId, dateFrom, dateTo);
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const fullTableName = getFullTableName(sensorId);

    // Get aggregated data with open (00:00) and close (23:45)
    const query = `SELECT CONVERT(varchar, ts, 23) as date, MAX(value) as high, MIN(value) as low, AVG(value) as avg, MIN(CASE WHEN DATEPART(hour, ts) = ${TIME_CONSTANTS.HOUR_START} AND DATEPART(minute, ts) = ${TIME_CONSTANTS.MINUTE_START} THEN value END) as [open], MAX(CASE WHEN DATEPART(hour, ts) = ${TIME_CONSTANTS.HOUR_END} AND DATEPART(minute, ts) = ${TIME_CONSTANTS.MINUTE_END} THEN value END) as [close] FROM [${fullTableName}] WHERE CONVERT(varchar, ts, 23) >= '${dateFrom}' AND CONVERT(varchar, ts, 23) <= '${dateTo}' GROUP BY CONVERT(varchar, ts, 23) ORDER BY date`;

    const command = buildSqlcmdCommand(query);

    try {
      const { stdout } = await execPromise(command);
      const lines = filterOutputLines(stdout);

      const results = lines.map(line => {
        const parts = line.split(QUERY_CONSTANTS.CSV_DELIMITER).map(p => p.trim());
        if (parts.length >= QUERY_CONSTANTS.MIN_PARTS_AGGREGATED) {
          const open = parts[4] === QUERY_CONSTANTS.NULL_VALUE ? null : parseFloat(parts[4]);
          const close = parts[5] === QUERY_CONSTANTS.NULL_VALUE ? null : parseFloat(parts[5]);
          return {
            date: parts[0],
            high: parseFloat(parts[1]),
            low: parseFloat(parts[2]),
            avg: parseFloat(parts[3]),
            open: open !== null ? open : parseFloat(parts[2]), // fallback to low if no 00:00 reading
            close: close !== null ? close : parseFloat(parts[1]) // fallback to high if no 23:45 reading
          };
        }
        return null;
      }).filter(item => item !== null);

      // Use appropriate TTL based on data recency
      const ttl = this.isRecentData(dateTo) ? CACHE_TTL.RECENT_DATA : CACHE_TTL.HISTORICAL_DATA;
      cache.set(cacheKey, results, ttl);

      return results;
    } catch (error) {
      console.error('Error getting aggregated data:', error.message);
      throw error;
    }
  }

  /**
   * Get aggregated data for multiple sensors
   */
  static async getMultipleSensorsAggregatedData(sensorIds, dateFrom, dateTo) {
    const cacheKey = cache.constructor.generateKey('thermalMultiAggregated', sensorIds.join(','), dateFrom, dateTo);
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const dataPromises = sensorIds.map(sensorId =>
        this.getAggregatedData(sensorId, dateFrom, dateTo).catch(err => {
          console.error(`Error for sensor ${sensorId}:`, err.message);
          return [];
        })
      );

      const results = await Promise.all(dataPromises);

      // Organize data by date
      const dataByDate = {};

      sensorIds.forEach((sensorId, index) => {
        results[index].forEach(dayData => {
          if (!dataByDate[dayData.date]) {
            dataByDate[dayData.date] = {};
          }
          dataByDate[dayData.date][sensorId] = {
            high: dayData.high,
            low: dayData.low,
            avg: dayData.avg,
            open: dayData.open,
            close: dayData.close
          };
        });
      });

      // Use appropriate TTL based on data recency
      const ttl = this.isRecentData(dateTo) ? CACHE_TTL.RECENT_DATA : CACHE_TTL.HISTORICAL_DATA;
      cache.set(cacheKey, dataByDate, ttl);

      return dataByDate;
    } catch (error) {
      console.error('Error getting multiple sensors aggregated data:', error.message);
      throw error;
    }
  }

  /**
   * Get the last available date with complete data
   */
  static async getLastCompleteDate(sensorId = TABLE_NAMES.THERMAL_DEFAULT) {
    const cacheKey = cache.constructor.generateKey('thermalLastComplete', sensorId);
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const fullTableName = getFullTableName(sensorId);

    // Get dates with 96 records (complete day)
    const query = `
      SELECT TOP 1 CONVERT(varchar, ts, 23) as date, COUNT(*) as count 
      FROM [${fullTableName}] 
      GROUP BY CONVERT(varchar, ts, 23) 
      HAVING COUNT(*) = ${TIME_CONSTANTS.RECORDS_PER_COMPLETE_DAY}
      ORDER BY date DESC
    `;

    const command = buildSqlcmdCommand(query);

    try {
      const { stdout } = await execPromise(command);
      const lines = filterOutputLines(stdout);

      if (lines.length > 0) {
        const parts = lines[0].split(QUERY_CONSTANTS.CSV_DELIMITER).map(p => p.trim());
        const result = parts[0]; // Return the date
        cache.set(cacheKey, result, CACHE_TTL.DATE_RANGE);
        return result;
      }

      return FALLBACK_VALUES.DEFAULT_DATE;
    } catch (error) {
      console.error('Error getting last complete date:', error.message);
      return FALLBACK_VALUES.DEFAULT_DATE;
    }
  }

  /**
   * Check if data is recent (within last 7 days)
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {boolean}
   */
  static isRecentData(date) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateToCheck = new Date(date);
    return dateToCheck >= sevenDaysAgo;
  }
}

module.exports = ThermalService;
