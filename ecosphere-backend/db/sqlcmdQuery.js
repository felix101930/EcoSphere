// Helper function to execute queries using sqlcmd
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function querySensorData(tableName, limit = 10) {
  const fullTableName = tableName.startsWith('SaitSolarLab_') ? tableName : `SaitSolarLab_${tableName}`;
  
  // Use simple query, then manually build JSON
  const query = `SELECT TOP ${limit} seq, CONVERT(varchar, ts, 120) as ts, value FROM [${fullTableName}] ORDER BY ts DESC`;
  
  const command = `sqlcmd -S localhost -E -d TestSlimDB -Q "${query}" -s "," -W -h -1`;
  
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
