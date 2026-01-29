/**
 * Thermal Service
 * 
 * Handles thermal sensor data queries from SQL Server database
 * Manages temperature readings from multiple sensors throughout the building
 * Provides both detailed (15-minute intervals) and aggregated (daily) data
 * 
 * Key Features:
 * - Query thermal sensor data by date and sensor ID
 * - Support multiple sensors simultaneously
 * - Aggregate data into daily high/low/avg/open/close
 * - Smart caching (historical data cached forever, recent data cached 5 min)
 * - Fallback values for missing data points
 * 
 * Data Format:
 * - Readings every 15 minutes (96 readings per complete day)
 * - Temperature in Celsius
 * - Timestamp format: YYYY-MM-DD HH:MM:SS
 */

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

/**
 * Cache TTL (Time To Live) constants
 * 
 * Different cache durations based on data type:
 * - Historical data: Never expires (data won't change)
 * - Recent data: 5 minutes (data might still be updating)
 * - Date ranges: 24 hours (new dates added daily)
 */
const CACHE_TTL = {
  DATE_RANGE: 24 * 60 * 60 * 1000,      // 24 hours for date ranges
  HISTORICAL_DATA: Infinity,             // Never expire historical data
  RECENT_DATA: 5 * 60 * 1000            // 5 minutes for recent data
};

class ThermalService {
  /**
   * Get date range for multiple sensors
   * 
   * Returns min and max dates for each sensor
   * Used to show sensor availability information
   * 
   * @param {Array<string>} sensorIds - Array of sensor IDs
   * @returns {Promise<Object>} Object with sensor IDs as keys, {minDate, maxDate} as values
   */
  static async getSensorsDateRange(sensorIds) {
    const cacheKey = cache.constructor.generateKey('thermalSensorsDateRange', sensorIds.join(','));
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const dateRangePromises = sensorIds.map(async (sensorId) => {
        const fullTableName = getFullTableName(sensorId);
        const query = `SELECT MIN(CONVERT(varchar, ts, 23)) as minDate, MAX(CONVERT(varchar, ts, 23)) as maxDate FROM [${fullTableName}]`;
        const command = buildSqlcmdCommand(query);

        try {
          const { stdout } = await execPromise(command);
          const lines = filterOutputLines(stdout);

          if (lines.length > 0) {
            const parts = lines[0].split(QUERY_CONSTANTS.CSV_DELIMITER).map(p => p.trim());
            return {
              sensorId,
              minDate: parts[0] || null,
              maxDate: parts[1] || null
            };
          }
          return { sensorId, minDate: null, maxDate: null };
        } catch (error) {
          console.error(`Error getting date range for ${sensorId}:`, error.message);
          return { sensorId, minDate: null, maxDate: null };
        }
      });

      const results = await Promise.all(dateRangePromises);

      // Convert array to object with sensorId as key
      const dateRangeMap = {};
      results.forEach(result => {
        dateRangeMap[result.sensorId] = {
          minDate: result.minDate,
          maxDate: result.maxDate
        };
      });

      // Cache for 24 hours
      cache.set(cacheKey, dateRangeMap, CACHE_TTL.DATE_RANGE);

      return dateRangeMap;
    } catch (error) {
      console.error('Error getting sensors date range:', error.message);
      throw error;
    }
  }

  /**
   * Get available dates with data for a sensor
   * 
   * Returns list of dates that have thermal data
   * Used by frontend to populate date picker and validate date ranges
   * Results are cached for 24 hours since new dates are only added daily
   * 
   * @param {string} [sensorId=TABLE_NAMES.THERMAL_DEFAULT] - Sensor table name
   * @returns {Promise<Array<string>>} Array of dates in YYYY-MM-DD format
   * 
   * @example
   * const dates = await ThermalService.getAvailableDates('TL1');
   * // Returns: ['2024-01-01', '2024-01-02', '2024-01-03', ...]
   */
  static async getAvailableDates(sensorId = TABLE_NAMES.THERMAL_DEFAULT) {
    // Check cache first to avoid expensive database query
    const cacheKey = cache.constructor.generateKey('thermalDates', sensorId);
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    // Get full table name with schema
    const fullTableName = getFullTableName(sensorId);

    // Query to get distinct dates from timestamp column
    // CONVERT(varchar, ts, 23) formats timestamp as YYYY-MM-DD
    const query = `SELECT DISTINCT CONVERT(varchar, ts, 23) as date FROM [${fullTableName}] ORDER BY date`;
    const command = buildSqlcmdCommand(query);

    try {
      // Execute SQL query via sqlcmd
      const { stdout } = await execPromise(command);

      // Filter out header/footer lines and extract dates
      const lines = filterOutputLines(stdout);
      const result = lines.map(line => line.trim());

      // Cache results for 24 hours
      // Date list only changes once per day when new data is added
      cache.set(cacheKey, result, CACHE_TTL.DATE_RANGE);

      return result;
    } catch (error) {
      // Log error for debugging (database connection issues, query errors)
      console.error('Error getting available dates:', error.message);

      // Re-throw error so controller can handle it
      throw error;
    }
  }

  /**
   * Get daily data for a specific sensor and date
   * 
   * Returns all temperature readings for a single day (96 readings at 15-min intervals)
   * Used by frontend to display detailed temperature charts
   * Historical data is cached forever, recent data cached for 5 minutes
   * 
   * @param {string} sensorId - Sensor table name (e.g., 'TL1', 'TL2')
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<Array<Object>>} Array of readings with seq, ts, value
   * 
   * @example
   * const data = await ThermalService.getDailyData('TL1', '2024-01-15');
   * // Returns: [
   * //   { seq: 1, ts: '2024-01-15 00:00:00', value: 21.5 },
   * //   { seq: 2, ts: '2024-01-15 00:15:00', value: 21.3 },
   * //   ...
   * // ]
   */
  static async getDailyData(sensorId, date) {
    // Check cache first to avoid expensive database query
    const cacheKey = cache.constructor.generateKey('thermalDaily', sensorId, date);
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`[ThermalService] Returning cached data for ${sensorId} ${date}, length: ${cached.length}`);
      return cached;
    }

    // Get full table name with schema
    const fullTableName = getFullTableName(sensorId);

    // Query to get all readings for a specific date
    // ts: timestamp in YYYY-MM-DD HH:MM:SS format
    // value: temperature in Celsius
    // Note: No seq field in thermal tables, unlike original design
    const query = `SELECT CONVERT(varchar, ts, 120) as ts, value FROM [${fullTableName}] WHERE CONVERT(varchar, ts, 23) = '${date}' ORDER BY ts`;
    const command = buildSqlcmdCommand(query);

    console.log(`[ThermalService] Fetching daily data for ${sensorId} ${date}`);

    try {
      // Execute SQL query via sqlcmd
      const { stdout } = await execPromise(command);

      // Filter out header/footer lines
      const lines = filterOutputLines(stdout);

      console.log(`[ThermalService] Filtered lines count: ${lines.length}`);
      if (lines.length > 0) {
        console.log(`[ThermalService] First line:`, lines[0]);
        console.log(`[ThermalService] Last line:`, lines[lines.length - 1]);
      }

      // Parse CSV output into objects
      // Expected format: "timestamp,value"
      const results = lines.map((line, index) => {
        const parts = line.split(QUERY_CONSTANTS.CSV_DELIMITER).map(p => p.trim());

        // Validate we have all required fields (ts, value)
        if (parts.length >= QUERY_CONSTANTS.MIN_PARTS_BASIC) {
          return {
            seq: index + 1,                // Generate sequence number (1-based index)
            ts: parts[0],                  // Timestamp string
            value: parseFloat(parts[1])    // Temperature in Celsius
          };
        }
        return null;
      }).filter(item => item !== null);  // Remove invalid rows

      console.log(`[ThermalService] Parsed results count: ${results.length}`);
      if (results.length > 0) {
        console.log(`[ThermalService] First result:`, results[0]);
        console.log(`[ThermalService] Last result:`, results[results.length - 1]);
      }

      // Use appropriate cache TTL based on data recency
      // Historical data (>7 days old) cached forever
      // Recent data cached for 5 minutes (might still be updating)
      const ttl = this.isRecentData(date) ? CACHE_TTL.RECENT_DATA : CACHE_TTL.HISTORICAL_DATA;
      cache.set(cacheKey, results, ttl);

      return results;
    } catch (error) {
      // Log error for debugging
      console.error('Error getting daily data:', error.message);

      // Re-throw error so controller can handle it
      throw error;
    }
  }

  /**
   * Get data for multiple sensors on a specific date
   * 
   * Fetches daily data for multiple sensors simultaneously
   * More efficient than calling getDailyData multiple times
   * Used by frontend to display multi-sensor comparison charts
   * 
   * @param {Array<string>} sensorIds - Array of sensor table names
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<Object>} Object with sensor IDs as keys, data arrays as values
   * 
   * @example
   * const data = await ThermalService.getMultipleSensorsDailyData(['TL1', 'TL2'], '2024-01-15');
   * // Returns: {
   * //   'TL1': [{ seq: 1, ts: '2024-01-15 00:00:00', value: 21.5 }, ...],
   * //   'TL2': [{ seq: 1, ts: '2024-01-15 00:00:00', value: 22.1 }, ...]
   * // }
   */
  static async getMultipleSensorsDailyData(sensorIds, date) {
    // Check cache first
    const cacheKey = cache.constructor.generateKey('thermalMultiDaily', sensorIds.join(','), date);
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      // Create array of promises to fetch data for each sensor
      // This allows parallel execution instead of sequential
      const dataPromises = sensorIds.map(sensorId =>
        this.getDailyData(sensorId, date)
      );

      // Wait for all promises to resolve
      // Promise.all executes all queries in parallel for better performance
      const results = await Promise.all(dataPromises);

      // Create a map with sensor IDs as keys
      // This makes it easy for frontend to access data by sensor ID
      const dataMap = {};
      sensorIds.forEach((sensorId, index) => {
        dataMap[sensorId] = results[index];
      });

      // Use appropriate cache TTL based on data recency
      const ttl = this.isRecentData(date) ? CACHE_TTL.RECENT_DATA : CACHE_TTL.HISTORICAL_DATA;
      cache.set(cacheKey, dataMap, ttl);

      return dataMap;
    } catch (error) {
      // Log error for debugging
      console.error('Error getting multiple sensors data:', error.message);

      // Re-throw error so controller can handle it
      throw error;
    }
  }

  /**
   * Get aggregated data for multiple days
   * 
   * Returns daily high/low/avg/open/close temperatures for a date range
   * Used by frontend to display candlestick charts and trend analysis
   * Open = temperature at 00:00, Close = temperature at 23:45
   * 
   * @param {string} sensorId - Sensor table name
   * @param {string} dateFrom - Start date in YYYY-MM-DD format
   * @param {string} dateTo - End date in YYYY-MM-DD format
   * @returns {Promise<Array<Object>>} Array of daily aggregated data
   * 
   * @example
   * const data = await ThermalService.getAggregatedData('TL1', '2024-01-01', '2024-01-07');
   * // Returns: [
   * //   {
   * //     date: '2024-01-01',
   * //     high: 23.5,
   * //     low: 19.2,
   * //     avg: 21.3,
   * //     open: 20.1,  // Temperature at 00:00
   * //     close: 21.8  // Temperature at 23:45
   * //   },
   * //   ...
   * // ]
   */
  static async getAggregatedData(sensorId, dateFrom, dateTo) {
    // Check cache first
    const cacheKey = cache.constructor.generateKey('thermalAggregated', sensorId, dateFrom, dateTo);
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    // Get full table name with schema
    const fullTableName = getFullTableName(sensorId);

    // Complex query to get daily aggregates with open/close values
    // MAX(value): Highest temperature of the day
    // MIN(value): Lowest temperature of the day
    // AVG(value): Average temperature of the day
    // Open: Temperature at 00:00 (first reading)
    // Close: Temperature at 23:45 (last reading)
    const query = `SELECT CONVERT(varchar, ts, 23) as date, MAX(value) as high, MIN(value) as low, AVG(value) as avg, MIN(CASE WHEN DATEPART(hour, ts) = ${TIME_CONSTANTS.HOUR_START} AND DATEPART(minute, ts) = ${TIME_CONSTANTS.MINUTE_START} THEN value END) as [open], MAX(CASE WHEN DATEPART(hour, ts) = ${TIME_CONSTANTS.HOUR_END} AND DATEPART(minute, ts) = ${TIME_CONSTANTS.MINUTE_END} THEN value END) as [close] FROM [${fullTableName}] WHERE CONVERT(varchar, ts, 23) >= '${dateFrom}' AND CONVERT(varchar, ts, 23) <= '${dateTo}' GROUP BY CONVERT(varchar, ts, 23) ORDER BY date`;

    const command = buildSqlcmdCommand(query);

    try {
      // Execute SQL query via sqlcmd
      const { stdout } = await execPromise(command);

      // Filter out header/footer lines
      const lines = filterOutputLines(stdout);

      // Parse CSV output into objects
      // Expected format: "date,high,low,avg,open,close"
      const results = lines.map(line => {
        const parts = line.split(QUERY_CONSTANTS.CSV_DELIMITER).map(p => p.trim());

        // Validate we have all required fields
        if (parts.length >= QUERY_CONSTANTS.MIN_PARTS_AGGREGATED) {
          // Parse open and close values
          // These might be NULL if no reading at 00:00 or 23:45
          const open = parts[4] === QUERY_CONSTANTS.NULL_VALUE ? null : parseFloat(parts[4]);
          const close = parts[5] === QUERY_CONSTANTS.NULL_VALUE ? null : parseFloat(parts[5]);

          return {
            date: parts[0],
            high: parseFloat(parts[1]),
            low: parseFloat(parts[2]),
            avg: parseFloat(parts[3]),
            // Fallback to low if no 00:00 reading (sensor might have started later)
            open: open !== null ? open : parseFloat(parts[2]),
            // Fallback to high if no 23:45 reading (sensor might have stopped earlier)
            close: close !== null ? close : parseFloat(parts[1])
          };
        }
        return null;
      }).filter(item => item !== null);  // Remove invalid rows

      // Use appropriate cache TTL based on data recency
      const ttl = this.isRecentData(dateTo) ? CACHE_TTL.RECENT_DATA : CACHE_TTL.HISTORICAL_DATA;
      cache.set(cacheKey, results, ttl);

      return results;
    } catch (error) {
      // Log error for debugging
      console.error('Error getting aggregated data:', error.message);

      // Re-throw error so controller can handle it
      throw error;
    }
  }

  /**
   * Get aggregated data for multiple sensors
   * 
   * Fetches daily aggregates for multiple sensors simultaneously
   * Organizes data by date for easy comparison across sensors
   * Used by frontend to display multi-sensor trend charts
   * 
   * @param {Array<string>} sensorIds - Array of sensor table names
   * @param {string} dateFrom - Start date in YYYY-MM-DD format
   * @param {string} dateTo - End date in YYYY-MM-DD format
   * @returns {Promise<Object>} Object organized by date, then sensor ID
   * 
   * @example
   * const data = await ThermalService.getMultipleSensorsAggregatedData(
   *   ['TL1', 'TL2'], '2024-01-01', '2024-01-03'
   * );
   * // Returns: {
   * //   '2024-01-01': {
   * //     'TL1': { high: 23.5, low: 19.2, avg: 21.3, open: 20.1, close: 21.8 },
   * //     'TL2': { high: 24.1, low: 20.0, avg: 22.0, open: 21.5, close: 22.5 }
   * //   },
   * //   '2024-01-02': { ... },
   * //   ...
   * // }
   */
  static async getMultipleSensorsAggregatedData(sensorIds, dateFrom, dateTo) {
    // Check cache first
    const cacheKey = cache.constructor.generateKey('thermalMultiAggregated', sensorIds.join(','), dateFrom, dateTo);
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      // Create array of promises to fetch data for each sensor
      // Use .catch() to handle individual sensor failures gracefully
      const dataPromises = sensorIds.map(sensorId =>
        this.getAggregatedData(sensorId, dateFrom, dateTo).catch(err => {
          // Log error but don't fail entire request
          // This allows other sensors to still return data
          console.error(`Error for sensor ${sensorId}:`, err.message);
          return [];  // Return empty array for failed sensor
        })
      );

      // Wait for all promises to resolve
      const results = await Promise.all(dataPromises);

      // Organize data by date first, then by sensor ID
      // This structure makes it easy to compare sensors on the same date
      const dataByDate = {};

      sensorIds.forEach((sensorId, index) => {
        // Loop through each day's data for this sensor
        results[index].forEach(dayData => {
          // Create date entry if it doesn't exist
          if (!dataByDate[dayData.date]) {
            dataByDate[dayData.date] = {};
          }

          // Add this sensor's data for this date
          dataByDate[dayData.date][sensorId] = {
            high: dayData.high,
            low: dayData.low,
            avg: dayData.avg,
            open: dayData.open,
            close: dayData.close
          };
        });
      });

      // Use appropriate cache TTL based on data recency
      const ttl = this.isRecentData(dateTo) ? CACHE_TTL.RECENT_DATA : CACHE_TTL.HISTORICAL_DATA;
      cache.set(cacheKey, dataByDate, ttl);

      return dataByDate;
    } catch (error) {
      // Log error for debugging
      console.error('Error getting multiple sensors aggregated data:', error.message);

      // Re-throw error so controller can handle it
      throw error;
    }
  }

  /**
   * Get the last available date with complete data
   * 
   * Finds the most recent date that has a complete day of data (96 readings)
   * Used by frontend to set default date range and validate data availability
   * Incomplete days are excluded (sensor might still be collecting data)
   * 
   * @param {string} [sensorId=TABLE_NAMES.THERMAL_DEFAULT] - Sensor table name
   * @returns {Promise<string>} Last complete date in YYYY-MM-DD format
   * 
   * @example
   * const lastDate = await ThermalService.getLastCompleteDate('TL1');
   * // Returns: '2024-01-15'
   */
  static async getLastCompleteDate(sensorId = TABLE_NAMES.THERMAL_DEFAULT) {
    // Check cache first
    const cacheKey = cache.constructor.generateKey('thermalLastComplete', sensorId);
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    // Get full table name with schema
    const fullTableName = getFullTableName(sensorId);

    // Query to find most recent date with exactly 96 records (complete day)
    // 96 records = 24 hours × 4 readings per hour (15-minute intervals)
    // HAVING COUNT(*) = 96 ensures we only get complete days
    const query = `SELECT TOP 1 CONVERT(varchar, ts, 23) as date, COUNT(*) as count FROM [${fullTableName}] GROUP BY CONVERT(varchar, ts, 23) HAVING COUNT(*) = ${TIME_CONSTANTS.RECORDS_PER_COMPLETE_DAY} ORDER BY date DESC`;

    const command = buildSqlcmdCommand(query);

    try {
      // Execute SQL query via sqlcmd
      const { stdout } = await execPromise(command);

      // Filter out header/footer lines
      const lines = filterOutputLines(stdout);

      // Check if we found a complete date
      if (lines.length > 0) {
        // Parse CSV output to extract date
        const parts = lines[0].split(QUERY_CONSTANTS.CSV_DELIMITER).map(p => p.trim());
        const result = parts[0]; // Return the date

        // Cache result for 24 hours
        cache.set(cacheKey, result, CACHE_TTL.DATE_RANGE);

        return result;
      }

      // No complete date found, return fallback default date
      // This shouldn't happen unless database is empty
      return FALLBACK_VALUES.DEFAULT_DATE;
    } catch (error) {
      // Log error for debugging
      console.error('Error getting last complete date:', error.message);

      // Return fallback date instead of throwing
      // This allows frontend to still function with default date
      return FALLBACK_VALUES.DEFAULT_DATE;
    }
  }

  /**
   * Check if data is recent (within last 7 days)
   * 
   * Helper method to determine appropriate cache TTL
   * Recent data might still be updating, so cache for shorter time
   * Historical data won't change, so cache forever
   * 
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {boolean} True if date is within last 7 days
   * 
   * @private
   * 
   * @example
   * const isRecent = ThermalService.isRecentData('2024-01-15');
   * // Returns: true if today is within 7 days of 2024-01-15
   */
  static isRecentData(date) {
    // Calculate date 7 days ago from today
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Convert input date string to Date object
    const dateToCheck = new Date(date);

    // Return true if date is within last 7 days
    return dateToCheck >= sevenDaysAgo;
  }
}

module.exports = ThermalService;
