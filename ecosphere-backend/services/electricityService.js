// Electricity Service - Handle electricity data queries from SQL Server
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const cache = require('../utils/cache');

const {
  buildSqlcmdCommand,
  getFullTableName,
  filterOutputLines,
  QUERY_CONSTANTS,
  TABLE_NAMES
} = require('../config/database');

// Cache TTL constants
const CACHE_TTL = {
  DATE_RANGE: 24 * 60 * 60 * 1000,    // 24 hours (rarely changes)
  HISTORICAL_DATA: Infinity,           // Never expire (historical data doesn't change)
  RECENT_DATA: 5 * 60 * 1000          // 5 minutes (for data within last 7 days)
};

class ElectricityService {
  /**
   * Get available date range for a table
   */
  static async getAvailableDateRange(tableName) {
    const cacheKey = cache.constructor.generateKey('elecDateRange', tableName);
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const fullTableName = getFullTableName(tableName);

    const query = `SELECT MIN(CONVERT(varchar, ts, 23)) as minDate, MAX(CONVERT(varchar, ts, 23)) as maxDate FROM [${fullTableName}]`;
    const command = buildSqlcmdCommand(query);

    try {
      const { stdout } = await execPromise(command);
      const lines = filterOutputLines(stdout);

      if (lines.length > 0) {
        const parts = lines[0].split(QUERY_CONSTANTS.CSV_DELIMITER).map(p => p.trim());
        const data = {
          minDate: parts[0],
          maxDate: parts[1]
        };

        cache.set(cacheKey, data, CACHE_TTL.DATE_RANGE);
        return data;
      }

      return null;
    } catch (error) {
      console.error(`Error getting date range for ${tableName}:`, error.message);
      throw error;
    }
  }

  /**
   * Get consumption data (TL341 - Hourly Increment)
   * Primary data source: 634 days (2019-02-13 to 2020-11-08)
   * 
   * Tier 1: Use TL341 (Overall consumption data)
   * Tier 2: If TL341 has no data, aggregate equipment data
   */
  static async getConsumptionData(dateFrom, dateTo) {
    const cacheKey = cache.constructor.generateKey('consumption', dateFrom, dateTo);
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const tableName = TABLE_NAMES.CONSUMPTION;

    // Tier 1: Try to get Overall data (TL341)
    const query = `SELECT CONVERT(varchar, ts, 120) as ts, value FROM [${tableName}] WHERE CONVERT(varchar, ts, 23) >= '${dateFrom}' AND CONVERT(varchar, ts, 23) <= '${dateTo}' ORDER BY ts`;
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

      // If we have Overall data, return it
      if (results.length > 0) {
        const ttl = this.isRecentData(dateTo) ? CACHE_TTL.RECENT_DATA : CACHE_TTL.HISTORICAL_DATA;
        const response = {
          data: results,
          source: 'overall',
          dataSource: 'TL341 (Primary Consumption Data)'
        };
        cache.set(cacheKey, response, ttl);
        return response;
      }

      // Tier 2: If no Overall data, try to aggregate equipment data
      console.log(`No Overall data for ${dateFrom} to ${dateTo}, trying equipment aggregation...`);
      const equipmentData = await this.getEquipmentBreakdownData(dateFrom, dateTo);
      const aggregatedData = this.aggregateEquipmentData(equipmentData);

      if (aggregatedData.length > 0) {
        const ttl = this.isRecentData(dateTo) ? CACHE_TTL.RECENT_DATA : CACHE_TTL.HISTORICAL_DATA;
        const response = {
          data: aggregatedData,
          source: 'equipment_aggregated',
          dataSource: 'Aggregated from Equipment Tables',
          warning: 'Using aggregated equipment data (Overall consumption data not available for this period)',
          equipmentSources: Object.keys(equipmentData).filter(key => equipmentData[key].length > 0)
        };
        cache.set(cacheKey, response, ttl);
        return response;
      }

      // No data available at all
      const emptyResponse = {
        data: [],
        source: 'none',
        dataSource: 'No data available'
      };
      return emptyResponse;

    } catch (error) {
      console.error('Error getting consumption data:', error.message);
      throw error;
    }
  }

  /**
   * Aggregate equipment data by timestamp
   * Sums all equipment values for each timestamp
   */
  static aggregateEquipmentData(equipmentData) {
    const timestampMap = new Map();

    // Iterate through all equipment types
    for (const [equipmentType, dataArray] of Object.entries(equipmentData)) {
      if (!dataArray || dataArray.length === 0) continue;

      // Add each data point to the timestamp map
      dataArray.forEach(item => {
        const existing = timestampMap.get(item.ts) || 0;
        timestampMap.set(item.ts, existing + Math.abs(item.value)); // Use absolute value
      });
    }

    // Convert map to array and sort by timestamp
    const aggregated = Array.from(timestampMap.entries())
      .map(([ts, value]) => ({
        ts,
        value: -Math.abs(value) // Make negative (consumption convention)
      }))
      .sort((a, b) => a.ts.localeCompare(b.ts));

    return aggregated;
  }

  /**
   * Get generation data (TL340 - Hourly Increment)
   * Primary data source: 634 days (2019-02-13 to 2020-11-08)
   */
  static async getGenerationData(dateFrom, dateTo) {
    const cacheKey = cache.constructor.generateKey('generation', dateFrom, dateTo);
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const tableName = TABLE_NAMES.GENERATION;

    const query = `SELECT CONVERT(varchar, ts, 120) as ts, value FROM [${tableName}] WHERE CONVERT(varchar, ts, 23) >= '${dateFrom}' AND CONVERT(varchar, ts, 23) <= '${dateTo}' ORDER BY ts`;
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

      const ttl = this.isRecentData(dateTo) ? CACHE_TTL.RECENT_DATA : CACHE_TTL.HISTORICAL_DATA;
      cache.set(cacheKey, results, ttl);

      return results;
    } catch (error) {
      console.error('Error getting generation data:', error.message);
      throw error;
    }
  }

  /**
   * Get net energy data (TL339 - Hourly Increment)
   * Primary data source: 634 days (2019-02-13 to 2020-11-08)
   */
  static async getNetEnergyData(dateFrom, dateTo) {
    const cacheKey = cache.constructor.generateKey('netEnergy', dateFrom, dateTo);
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const tableName = TABLE_NAMES.NET_ENERGY;

    const query = `SELECT CONVERT(varchar, ts, 120) as ts, value FROM [${tableName}] WHERE CONVERT(varchar, ts, 23) >= '${dateFrom}' AND CONVERT(varchar, ts, 23) <= '${dateTo}' ORDER BY ts`;
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

      const ttl = this.isRecentData(dateTo) ? CACHE_TTL.RECENT_DATA : CACHE_TTL.HISTORICAL_DATA;
      cache.set(cacheKey, results, ttl);

      return results;
    } catch (error) {
      console.error('Error getting net energy data:', error.message);
      throw error;
    }
  }

  /**
   * Get phase breakdown data (TL342-345)
   * Available: 2020-11-01 to 2020-11-08 (7 days only)
   * Note: Phase tables use 1-minute intervals (~10,378 records per 7 days)
   * Data represents instantaneous power readings (W or Wh), not increments
   * This method aggregates to hourly data using AVG for correct power calculation
   * Optimized query using DATEPART for fast grouping
   */
  static async getPhaseBreakdownData(dateFrom, dateTo) {
    const tables = {
      total: TABLE_NAMES.PHASE_TOTAL,
      phaseA: TABLE_NAMES.PHASE_A,
      phaseB: TABLE_NAMES.PHASE_B,
      phaseC: TABLE_NAMES.PHASE_C
    };

    const results = {};

    for (const [key, tableName] of Object.entries(tables)) {
      // Optimized aggregation using DATEPART - much faster than DATEADD/DATEDIFF
      // Use AVG because data represents instantaneous power readings, not increments
      // Format: YYYY-MM-DD HH:00:00
      const query = `SELECT CONVERT(varchar, CAST(ts AS DATE), 23) + ' ' + RIGHT('0' + CAST(DATEPART(HOUR, ts) AS VARCHAR), 2) + ':00:00' as ts, AVG(value) as value FROM [${tableName}] WHERE ts >= '${dateFrom}' AND ts < DATEADD(day, 1, '${dateTo}') GROUP BY CAST(ts AS DATE), DATEPART(HOUR, ts) ORDER BY CAST(ts AS DATE), DATEPART(HOUR, ts)`;
      const command = buildSqlcmdCommand(query);

      try {
        const { stdout } = await execPromise(command);
        const lines = filterOutputLines(stdout);

        results[key] = lines.map(line => {
          const parts = line.split(QUERY_CONSTANTS.CSV_DELIMITER).map(p => p.trim());
          if (parts.length >= QUERY_CONSTANTS.MIN_PARTS_BASIC) {
            return {
              ts: parts[0],
              value: parseFloat(parts[1])
            };
          }
          return null;
        }).filter(item => item !== null);
      } catch (error) {
        console.error(`Error getting ${key} data:`, error.message);
        results[key] = [];
      }
    }

    return results;
  }

  /**
   * Get equipment breakdown data (aggregated to hourly)
   * TL213: Panel2A-1 (~15-min intervals, 2020-02-15 to 2020-11-08, 9 months)
   * TL4: Ventilation (1-min intervals, 2020-11-01 to 2020-11-08, 7 days)
   * TL209: Lighting (1-min intervals, 2019-11-07 to 2019-11-14, 7 days)
   * TL211: Equipment/R&D (1-min intervals, 2019-11-07 to 2019-11-14, 7 days)
   * TL212: Appliances (1-min intervals, 2019-11-07 to 2019-11-14, 7 days)
   * Note: Data represents instantaneous power readings, not increments
   * Aggregated to hourly averages for consistent interval across all breakdowns
   * Optimized query using DATEPART for fast grouping
   */
  static async getEquipmentBreakdownData(dateFrom, dateTo) {
    const tables = {
      panel2A1: TABLE_NAMES.PANEL_2A1,
      ventilation: TABLE_NAMES.VENTILATION,
      lighting: TABLE_NAMES.LIGHTING,
      equipment: TABLE_NAMES.EQUIPMENT,
      appliances: TABLE_NAMES.APPLIANCES
    };

    const results = {};

    for (const [key, tableName] of Object.entries(tables)) {
      // Optimized aggregation using DATEPART - much faster than DATEADD/DATEDIFF
      // Use AVG because data represents instantaneous power readings, not increments
      // Format: YYYY-MM-DD HH:00:00
      const query = `SELECT CONVERT(varchar, CAST(ts AS DATE), 23) + ' ' + RIGHT('0' + CAST(DATEPART(HOUR, ts) AS VARCHAR), 2) + ':00:00' as ts, AVG(value) as value FROM [${tableName}] WHERE ts >= '${dateFrom}' AND ts < DATEADD(day, 1, '${dateTo}') GROUP BY CAST(ts AS DATE), DATEPART(HOUR, ts) ORDER BY CAST(ts AS DATE), DATEPART(HOUR, ts)`;
      const command = buildSqlcmdCommand(query);

      try {
        const { stdout } = await execPromise(command);
        const lines = filterOutputLines(stdout);

        results[key] = lines.map(line => {
          const parts = line.split(QUERY_CONSTANTS.CSV_DELIMITER).map(p => p.trim());
          if (parts.length >= QUERY_CONSTANTS.MIN_PARTS_BASIC) {
            return {
              ts: parts[0],
              value: parseFloat(parts[1])
            };
          }
          return null;
        }).filter(item => item !== null);
      } catch (error) {
        console.error(`Error getting ${key} data:`, error.message);
        results[key] = [];
      }
    }

    return results;
  }

  /**
   * Get solar source breakdown data (TL252, TL253) - aggregated to hourly
   * Available: 2020-11-01 to 2020-11-08 (7 days only)
   * Note: Original unit is W (power), 1-minute intervals
   * Aggregated to hourly averages for consistent interval across all breakdowns
   * Optimized query using DATEPART for fast grouping
   */
  static async getSolarSourceBreakdownData(dateFrom, dateTo) {
    const tables = {
      carport: TABLE_NAMES.SOLAR_CARPORT,
      rooftop: TABLE_NAMES.SOLAR_ROOFTOP
    };

    const results = {};

    for (const [key, tableName] of Object.entries(tables)) {
      // Optimized aggregation using DATEPART - much faster than DATEADD/DATEDIFF
      // AVG is used because we want average power output per hour (unit is W, not Wh)
      // Format: YYYY-MM-DD HH:00:00
      const query = `SELECT CONVERT(varchar, CAST(ts AS DATE), 23) + ' ' + RIGHT('0' + CAST(DATEPART(HOUR, ts) AS VARCHAR), 2) + ':00:00' as ts, AVG(value) as value FROM [${tableName}] WHERE ts >= '${dateFrom}' AND ts < DATEADD(day, 1, '${dateTo}') GROUP BY CAST(ts AS DATE), DATEPART(HOUR, ts) ORDER BY CAST(ts AS DATE), DATEPART(HOUR, ts)`;
      const command = buildSqlcmdCommand(query);

      try {
        const { stdout } = await execPromise(command);
        const lines = filterOutputLines(stdout);

        results[key] = lines.map(line => {
          const parts = line.split(QUERY_CONSTANTS.CSV_DELIMITER).map(p => p.trim());
          if (parts.length >= QUERY_CONSTANTS.MIN_PARTS_BASIC) {
            return {
              ts: parts[0],
              value: parseFloat(parts[1])
            };
          }
          return null;
        }).filter(item => item !== null);
      } catch (error) {
        console.error(`Error getting ${key} data:`, error.message);
        results[key] = [];
      }
    }

    return results;
  }

  /**
   * Calculate metrics from data
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

    const values = data.map(d => Math.abs(d.value));
    const total = values.reduce((sum, val) => sum + val, 0);

    return {
      total: total,
      average: total / values.length,
      peak: Math.max(...values),
      min: Math.min(...values)
    };
  }

  /**
   * Calculate metrics for net energy (preserves sign)
   * Negative = consuming more than generating
   * Positive = generating more than consuming
   */
  static calculateNetEnergyMetrics(data) {
    if (!data || data.length === 0) {
      return {
        total: 0,
        average: 0,
        peak: 0,
        min: 0
      };
    }

    const values = data.map(d => d.value); // Keep sign!
    const total = values.reduce((sum, val) => sum + val, 0);

    return {
      total: total,
      average: total / values.length,
      peak: Math.max(...values),  // Most positive (max surplus)
      min: Math.min(...values)    // Most negative (max deficit)
    };
  }

  /**
   * Calculate self-sufficiency rate
   */
  static calculateSelfSufficiency(generationData, consumptionData) {
    if (!generationData || !consumptionData || generationData.length === 0 || consumptionData.length === 0) {
      return 0;
    }

    const totalGeneration = generationData.reduce((sum, d) => sum + Math.abs(d.value), 0);
    const totalConsumption = consumptionData.reduce((sum, d) => sum + Math.abs(d.value), 0);

    if (totalConsumption === 0) return 0;

    return (totalGeneration / totalConsumption) * 100;
  }

  /**
   * Check if date is within last 7 days (recent data)
   */
  static isRecentData(dateTo) {
    const date = new Date(dateTo);
    const now = new Date();
    const daysDiff = (now - date) / (1000 * 60 * 60 * 24);
    return daysDiff <= 7;
  }
}

module.exports = ElectricityService;
