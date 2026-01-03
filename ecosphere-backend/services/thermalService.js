// Thermal Service - Handle thermal sensor data queries
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const {
  buildSqlcmdCommand,
  getFullTableName,
  filterOutputLines,
  QUERY_CONSTANTS,
  TIME_CONSTANTS,
  FALLBACK_VALUES,
  TABLE_NAMES
} = require('../config/database');

class ThermalService {
  /**
   * Get available dates with data for a sensor
   */
  static async getAvailableDates(sensorId = TABLE_NAMES.THERMAL_DEFAULT) {
    const fullTableName = getFullTableName(sensorId);

    const query = `SELECT DISTINCT CONVERT(varchar, ts, 23) as date FROM [${fullTableName}] ORDER BY date`;
    const command = buildSqlcmdCommand(query);

    try {
      const { stdout } = await execPromise(command);
      const lines = filterOutputLines(stdout);
      return lines.map(line => line.trim());
    } catch (error) {
      console.error('Error getting available dates:', error.message);
      throw error;
    }
  }

  /**
   * Get daily data for a specific sensor and date
   */
  static async getDailyData(sensorId, date) {
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
        return parts[0]; // Return the date
      }

      return FALLBACK_VALUES.DEFAULT_DATE;
    } catch (error) {
      console.error('Error getting last complete date:', error.message);
      return FALLBACK_VALUES.DEFAULT_DATE;
    }
  }
}

module.exports = ThermalService;
