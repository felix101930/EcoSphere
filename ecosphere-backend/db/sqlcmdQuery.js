// Helper function to execute queries using sqlcmd
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Get database configuration from environment variables
const DB_SERVER = process.env.DB_SERVER || 'localhost';
const DB_DATABASE = process.env.DB_DATABASE || 'TestSlimDB';
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;

async function querySensorData(tableName, limit = 10) {
  const fullTableName = tableName.startsWith('SaitSolarLab_') ? tableName : `SaitSolarLab_${tableName}`;
  
  // Use simple query, then manually build JSON
  const query = `SELECT TOP ${limit} seq, CONVERT(varchar, ts, 120) as ts, value FROM [${fullTableName}] ORDER BY ts DESC`;
  
  // Build sqlcmd command with authentication
  let authParams = '-E'; // Windows Authentication by default
  if (DB_USER && DB_PASSWORD) {
    authParams = `-U ${DB_USER} -P ${DB_PASSWORD}`; // SQL Server Authentication
  }
  
  const command = `sqlcmd -S ${DB_SERVER} ${authParams} -d ${DB_DATABASE} -Q "${query}" -s "," -W -h -1`;
  
  try {
    const { stdout, stderr } = await execPromise(command);
    
    if (stderr && stderr.includes('Error')) {
      throw new Error(stderr);
    }
    
    // Parse CSV format output
    const lines = stdout.trim().split('\n').filter(line => line.trim());
    
    // Skip the last line (usually "rows affected")
    const dataLines = lines.filter(line => !line.includes('rows affected'));
    
    const results = dataLines.map(line => {
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
    console.error('Query error:', error.message);
    throw error;
  }
}

module.exports = {
  querySensorData
};
