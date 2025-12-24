// Electricity Service - Handle electricity data queries from SQL Server
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Get database configuration from environment variables
const DB_SERVER = process.env.DB_SERVER || 'localhost';
const DB_DATABASE = process.env.DB_DATABASE || 'TestSlimDB';
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;

class ElectricityService {
  /**
   * Get available date range for a table
   */
  static async getAvailableDateRange(tableName) {
    const fullTableName = tableName.startsWith('SaitSolarLab_') 
      ? tableName 
      : `SaitSolarLab_${tableName}`;
    
    const query = `SELECT MIN(CONVERT(varchar, ts, 23)) as minDate, MAX(CONVERT(varchar, ts, 23)) as maxDate FROM [${fullTableName}]`;
    
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
   * Get consumption data (TL341 - Hourly Increment)
   * Primary data source: 634 days (2019-02-13 to 2020-11-08)
   */
  static async getConsumptionData(dateFrom, dateTo) {
    const tableName = 'SaitSolarLab_30000_TL341';
    
    const query = `SELECT CONVERT(varchar, ts, 120) as ts, value FROM [${tableName}] WHERE CONVERT(varchar, ts, 23) >= '${dateFrom}' AND CONVERT(varchar, ts, 23) <= '${dateTo}' ORDER BY ts`;
    
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
        if (parts.length >= 2) {
          return {
            ts: parts[0],
            value: parseFloat(parts[1])
          };
        }
        return null;
      }).filter(item => item !== null);
      
      return results;
    } catch (error) {
      console.error('Error getting consumption data:', error.message);
      throw error;
    }
  }

  /**
   * Get generation data (TL340 - Hourly Increment)
   * Primary data source: 634 days (2019-02-13 to 2020-11-08)
   */
  static async getGenerationData(dateFrom, dateTo) {
    const tableName = 'SaitSolarLab_30000_TL340';
    
    const query = `SELECT CONVERT(varchar, ts, 120) as ts, value FROM [${tableName}] WHERE CONVERT(varchar, ts, 23) >= '${dateFrom}' AND CONVERT(varchar, ts, 23) <= '${dateTo}' ORDER BY ts`;
    
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
        if (parts.length >= 2) {
          return {
            ts: parts[0],
            value: parseFloat(parts[1])
          };
        }
        return null;
      }).filter(item => item !== null);
      
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
    const tableName = 'SaitSolarLab_30000_TL339';
    
    const query = `SELECT CONVERT(varchar, ts, 120) as ts, value FROM [${tableName}] WHERE CONVERT(varchar, ts, 23) >= '${dateFrom}' AND CONVERT(varchar, ts, 23) <= '${dateTo}' ORDER BY ts`;
    
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
        if (parts.length >= 2) {
          return {
            ts: parts[0],
            value: parseFloat(parts[1])
          };
        }
        return null;
      }).filter(item => item !== null);
      
      return results;
    } catch (error) {
      console.error('Error getting net energy data:', error.message);
      throw error;
    }
  }

  /**
   * Get phase breakdown data (TL342-345)
   * Available: 2020-11-01 to 2020-11-08 (7 days only)
   */
  static async getPhaseBreakdownData(dateFrom, dateTo) {
    const tables = {
      total: 'SaitSolarLab_30000_TL342',    // Site Consumption (Total)
      phaseA: 'SaitSolarLab_30000_TL343',   // Main Power PA (Phase A)
      phaseB: 'SaitSolarLab_30000_TL344',   // Main Power PB (Phase B)
      phaseC: 'SaitSolarLab_30000_TL345'    // Main Power PC (Phase C)
    };
    
    const results = {};
    
    for (const [key, tableName] of Object.entries(tables)) {
      const query = `SELECT CONVERT(varchar, ts, 120) as ts, value FROM [${tableName}] WHERE CONVERT(varchar, ts, 23) >= '${dateFrom}' AND CONVERT(varchar, ts, 23) <= '${dateTo}' ORDER BY ts`;
      
      let authParams = '-E';
      if (DB_USER && DB_PASSWORD) {
        authParams = `-U ${DB_USER} -P ${DB_PASSWORD}`;
      }
      
      const command = `sqlcmd -S ${DB_SERVER} ${authParams} -d ${DB_DATABASE} -Q "${query}" -s "," -W -h -1`;
      
      try {
        const { stdout } = await execPromise(command);
        const lines = stdout.trim().split('\n').filter(line => line.trim() && !line.includes('rows affected'));
        
        results[key] = lines.map(line => {
          const parts = line.split(',').map(p => p.trim());
          if (parts.length >= 2) {
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
   * Get equipment breakdown data
   * TL213: Panel2A-1 (2020-02-15 to 2020-11-08, 9 months)
   * TL4: Ventilation (2020-11-01 to 2020-11-08, 7 days)
   * TL209: Lighting (2019-11-07 to 2019-11-14, 7 days)
   * TL211: Equipment/R&D (2019-11-07 to 2019-11-14, 7 days)
   * TL212: Appliances (2019-11-07 to 2019-11-14, 7 days)
   */
  static async getEquipmentBreakdownData(dateFrom, dateTo) {
    const tables = {
      panel2A1: 'SaitSolarLab_30000_TL213',      // Panel2A-1
      ventilation: 'SaitSolarLab_30000_TL4',     // Ventilation
      lighting: 'SaitSolarLab_30000_TL209',      // Lighting
      equipment: 'SaitSolarLab_30000_TL211',     // Equipment/R&D
      appliances: 'SaitSolarLab_30000_TL212'     // Appliances
    };
    
    const results = {};
    
    for (const [key, tableName] of Object.entries(tables)) {
      const query = `SELECT CONVERT(varchar, ts, 120) as ts, value FROM [${tableName}] WHERE CONVERT(varchar, ts, 23) >= '${dateFrom}' AND CONVERT(varchar, ts, 23) <= '${dateTo}' ORDER BY ts`;
      
      let authParams = '-E';
      if (DB_USER && DB_PASSWORD) {
        authParams = `-U ${DB_USER} -P ${DB_PASSWORD}`;
      }
      
      const command = `sqlcmd -S ${DB_SERVER} ${authParams} -d ${DB_DATABASE} -Q "${query}" -s "," -W -h -1`;
      
      try {
        const { stdout } = await execPromise(command);
        const lines = stdout.trim().split('\n').filter(line => line.trim() && !line.includes('rows affected'));
        
        results[key] = lines.map(line => {
          const parts = line.split(',').map(p => p.trim());
          if (parts.length >= 2) {
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
   * Get solar source breakdown data (TL252, TL253)
   * Available: 2020-11-01 to 2020-11-08 (7 days only)
   * Note: Unit is W (power), not Wh (energy)
   */
  static async getSolarSourceBreakdownData(dateFrom, dateTo) {
    const tables = {
      carport: 'SaitSolarLab_30000_TL252',   // Carport Solar
      rooftop: 'SaitSolarLab_30000_TL253'    // Rooftop Solar
    };
    
    const results = {};
    
    for (const [key, tableName] of Object.entries(tables)) {
      const query = `SELECT CONVERT(varchar, ts, 120) as ts, value FROM [${tableName}] WHERE CONVERT(varchar, ts, 23) >= '${dateFrom}' AND CONVERT(varchar, ts, 23) <= '${dateTo}' ORDER BY ts`;
      
      let authParams = '-E';
      if (DB_USER && DB_PASSWORD) {
        authParams = `-U ${DB_USER} -P ${DB_PASSWORD}`;
      }
      
      const command = `sqlcmd -S ${DB_SERVER} ${authParams} -d ${DB_DATABASE} -Q "${query}" -s "," -W -h -1`;
      
      try {
        const { stdout } = await execPromise(command);
        const lines = stdout.trim().split('\n').filter(line => line.trim() && !line.includes('rows affected'));
        
        results[key] = lines.map(line => {
          const parts = line.split(',').map(p => p.trim());
          if (parts.length >= 2) {
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
}

module.exports = ElectricityService;
