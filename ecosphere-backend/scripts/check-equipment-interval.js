// Check data interval for Equipment tables
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const DB_SERVER = process.env.DB_SERVER || 'localhost';
const DB_DATABASE = process.env.DB_DATABASE || 'TestSlimDB';
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;

async function checkEquipmentInterval() {
  const tables = [
    { name: 'TL213', desc: 'Panel2A-1', dateRange: '2020-11-01 to 2020-11-08' },
    { name: 'TL4', desc: 'Ventilation', dateRange: '2020-11-01 to 2020-11-08' },
    { name: 'TL209', desc: 'Lighting', dateRange: '2019-11-07 to 2019-11-14' }
  ];
  
  let authParams = '-E';
  if (DB_USER && DB_PASSWORD) {
    authParams = `-U ${DB_USER} -P ${DB_PASSWORD}`;
  }
  
  console.log('Equipment Tables Data Interval Check:');
  console.log('='.repeat(70));
  
  for (const table of tables) {
    const [dateFrom, dateTo] = table.dateRange.split(' to ');
    
    // Count records
    const countQuery = `SELECT COUNT(*) as cnt FROM [SaitSolarLab_30000_${table.name}] WHERE CONVERT(varchar, ts, 23) >= '${dateFrom}' AND CONVERT(varchar, ts, 23) <= '${dateTo}'`;
    const countCmd = `sqlcmd -S ${DB_SERVER} ${authParams} -d ${DB_DATABASE} -Q "${countQuery}" -s "," -W -h -1`;
    
    // Get first 5 timestamps
    const tsQuery = `SELECT TOP 5 CONVERT(varchar, ts, 120) as ts FROM [SaitSolarLab_30000_${table.name}] WHERE CONVERT(varchar, ts, 23) >= '${dateFrom}' ORDER BY ts`;
    const tsCmd = `sqlcmd -S ${DB_SERVER} ${authParams} -d ${DB_DATABASE} -Q "${tsQuery}" -s "," -W -h -1`;
    
    try {
      const { stdout: countOut } = await execPromise(countCmd);
      const countLines = countOut.trim().split('\n').filter(line => line.trim() && !line.includes('rows affected'));
      const recordCount = countLines.length > 0 ? parseInt(countLines[0].trim()) : 0;
      
      const { stdout: tsOut } = await execPromise(tsCmd);
      const tsLines = tsOut.trim().split('\n').filter(line => line.trim() && !line.includes('rows affected'));
      
      console.log(`\n${table.name} - ${table.desc} (${table.dateRange}):`);
      console.log(`  Records: ${recordCount}`);
      console.log(`  First 5 timestamps:`);
      tsLines.slice(0, 5).forEach(line => console.log(`    ${line}`));
      
      // Calculate interval
      const days = 7; // All test ranges are 7 days
      const recordsPerDay = recordCount / days;
      const recordsPerHour = recordsPerDay / 24;
      const minutesPerRecord = 60 / recordsPerHour;
      
      console.log(`  Analysis:`);
      console.log(`    ${recordsPerDay.toFixed(1)} records/day`);
      console.log(`    ${recordsPerHour.toFixed(1)} records/hour`);
      console.log(`    ~${minutesPerRecord.toFixed(1)} minutes/record`);
      
    } catch (error) {
      console.error(`  Error: ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(70));
}

checkEquipmentInterval();
