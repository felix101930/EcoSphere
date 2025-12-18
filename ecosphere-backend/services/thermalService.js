// Thermal Service - Handle thermal sensor data queries
const { querySensorData } = require('../db/sqlcmdQuery');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Get database configuration from environment variables
const DB_SERVER = process.env.DB_SERVER || 'localhost';
const DB_DATABASE = process.env.DB_DATABASE || 'TestSlimDB';
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;

class ThermalService {
  /**
   * Get available dates with data for a sensor
   */
  static async getAvailableDates(sensorId = '20004_TL2') {
    const fullTableName = sensorId.startsWith('SaitSolarLab_') 
      ? sensorId 
      : `SaitSolarLab_${sensorId}`;
    
    const query = `SELECT DISTINCT CONVERT(varchar, ts, 23) as date FROM [${fullTableName}] ORDER BY date`;
    
    let authParams = '-E';
    if (DB_USER && DB_PASSWORD) {
      authParams = `-U ${DB_USER} -P ${DB_PASSWORD}`;
    }
    
    const command = `sqlcmd -S ${DB_SERVER} ${authParams} -d ${DB_DATABASE} -Q "${query}" -s "," -W -h -1`;
    
    try {
      const { stdout } = await execPromise(command);
      const lines = stdout.trim().split('\n').filter(line => line.trim() && !line.includes('rows affected'));
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
    const fullTableName = sensorId.startsWith('SaitSolarLab_') 
      ? sensorId 
      : `SaitSolarLab_${sensorId}`;
    
    const query = `SELECT seq, CONVERT(varchar, ts, 120) as ts, value FROM [${fullTableName}] WHERE CONVERT(varchar, ts, 23) = '${date}' ORDER BY ts`;
    
    let authParams = '-E';
    if (DB_USER && DB_PASSWORD) {
      authParams = `-U ${DB_USER} -P ${DB_PASSWORD}`;
    }
    
    const command = `sqlcmd -S ${DB_SERVER} ${authParams} -d ${DB_DATABASE} -Q "${query}" -s "," -W -h -1`;
    
    try {
      const { stdout } = await execPromise(command);
      const lines = stdout.trim().split('\n').filter(line => line.trim() && !line.includes('rows affected'));
      
      const results = lines.map(line => {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length >= 3) {
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
   * Get the last available date with complete data
   */
  static async getLastCompleteDate(sensorId = '20004_TL2') {
    const fullTableName = sensorId.startsWith('SaitSolarLab_') 
      ? sensorId 
      : `SaitSolarLab_${sensorId}`;
    
    // Get dates with 96 records (complete day)
    const query = `
      SELECT TOP 1 CONVERT(varchar, ts, 23) as date, COUNT(*) as count 
      FROM [${fullTableName}] 
      GROUP BY CONVERT(varchar, ts, 23) 
      HAVING COUNT(*) = 96 
      ORDER BY date DESC
    `;
    
    let authParams = '-E';
    if (DB_USER && DB_PASSWORD) {
      authParams = `-U ${DB_USER} -P ${DB_PASSWORD}`;
    }
    
    const command = `sqlcmd -S ${DB_SERVER} ${authParams} -d ${DB_DATABASE} -Q "${query}" -s "," -W -h -1`;
    
    try {
      const { stdout } = await execPromise(command);
      const lines = stdout.trim().split('\n').filter(line => line.trim() && !line.includes('rows affected'));
      
      if (lines.length > 0) {
        const parts = lines[0].split(',').map(p => p.trim());
        return parts[0]; // Return the date
      }
      
      return '2020-11-07'; // Fallback to known good date
    } catch (error) {
      console.error('Error getting last complete date:', error.message);
      return '2020-11-07'; // Fallback
    }
  }
}

module.exports = ThermalService;
