// Helper function to execute queries using sqlcmd
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const {
  buildSqlcmdCommand,
  getFullTableName,
  filterOutputLines,
  QUERY_CONSTANTS,
  FALLBACK_VALUES
} = require('../config/database');

/**
 * Query sensor data from SQL Server using sqlcmd
 * @param {string} tableName - Table name or sensor ID
 * @param {number} limit - Number of records to return
 * @returns {Promise<Array>} Array of sensor data records
 */
async function querySensorData(tableName, limit = FALLBACK_VALUES.DEFAULT_LIMIT) {
  const fullTableName = getFullTableName(tableName);

  // Use simple query, then manually build JSON
  const query = `SELECT TOP ${limit} seq, CONVERT(varchar, ts, 120) as ts, value FROM [${fullTableName}] ORDER BY ts DESC`;

  const command = buildSqlcmdCommand(query);

  try {
    const { stdout, stderr } = await execPromise(command);

    if (stderr && stderr.includes('Error')) {
      throw new Error(stderr);
    }

    // Parse CSV format output
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
    console.error('Query error:', error.message);
    throw error;
  }
}

module.exports = {
  querySensorData
};
