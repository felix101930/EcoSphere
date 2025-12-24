// Check record count for TL341 vs TL342 to verify data interval
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const DB_SERVER = process.env.DB_SERVER || 'localhost';
const DB_DATABASE = process.env.DB_DATABASE || 'TestSlimDB';
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;

async function checkRecordCount() {
  const query = "SELECT 'TL341_Overall' as table_name, COUNT(*) as record_count FROM [SaitSolarLab_30000_TL341] WHERE CONVERT(varchar, ts, 23) >= '2020-11-01' AND CONVERT(varchar, ts, 23) <= '2020-11-08' UNION ALL SELECT 'TL342_Phase_Total', COUNT(*) FROM [SaitSolarLab_30000_TL342] WHERE CONVERT(varchar, ts, 23) >= '2020-11-01' AND CONVERT(varchar, ts, 23) <= '2020-11-08' UNION ALL SELECT 'TL343_Phase_A', COUNT(*) FROM [SaitSolarLab_30000_TL343] WHERE CONVERT(varchar, ts, 23) >= '2020-11-01' AND CONVERT(varchar, ts, 23) <= '2020-11-08'";
  
  let authParams = '-E';
  if (DB_USER && DB_PASSWORD) {
    authParams = `-U ${DB_USER} -P ${DB_PASSWORD}`;
  }
  
  const command = `sqlcmd -S ${DB_SERVER} ${authParams} -d ${DB_DATABASE} -Q "${query}" -s "," -W -h -1`;
  
  try {
    const { stdout } = await execPromise(command);
    console.log('Record Count Comparison (7 days: 2020-11-01 to 2020-11-08):');
    console.log('='.repeat(60));
    console.log(stdout);
    console.log('='.repeat(60));
    console.log('\nAnalysis:');
    console.log('- TL341 (Overall): Hourly data = 7 days × 24 hours = ~168 records');
    console.log('- TL342-345 (Phase): If 15-min intervals = 7 days × 96 records/day = ~672 records');
    console.log('- Performance impact: Phase queries return ~4x more data per table');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkRecordCount();
