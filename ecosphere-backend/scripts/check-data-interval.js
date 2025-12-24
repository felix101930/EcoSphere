// Check actual data interval for Phase tables
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const DB_SERVER = process.env.DB_SERVER || 'localhost';
const DB_DATABASE = process.env.DB_DATABASE || 'TestSlimDB';
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;

async function checkDataInterval() {
  // Get first 10 timestamps from TL342 to see the interval pattern
  const query = "SELECT TOP 10 CONVERT(varchar, ts, 120) as ts FROM [SaitSolarLab_30000_TL342] WHERE CONVERT(varchar, ts, 23) = '2020-11-01' ORDER BY ts";
  
  let authParams = '-E';
  if (DB_USER && DB_PASSWORD) {
    authParams = `-U ${DB_USER} -P ${DB_PASSWORD}`;
  }
  
  const command = `sqlcmd -S ${DB_SERVER} ${authParams} -d ${DB_DATABASE} -Q "${query}" -s "," -W -h -1`;
  
  try {
    const { stdout } = await execPromise(command);
    console.log('First 10 timestamps from TL342 (Phase Total) on 2020-11-01:');
    console.log('='.repeat(60));
    console.log(stdout);
    console.log('='.repeat(60));
    console.log('\nCalculation:');
    console.log('- 10,378 records / 7 days = ~1,483 records per day');
    console.log('- 1,483 records / 24 hours = ~61.8 records per hour');
    console.log('- 60 minutes / 61.8 records = ~0.97 minutes per record');
    console.log('- Estimated interval: ~1 minute (or possibly every minute)');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkDataInterval();
