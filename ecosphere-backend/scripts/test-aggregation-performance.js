// Test aggregation performance for different approaches
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const DB_SERVER = process.env.DB_SERVER || 'localhost';
const DB_DATABASE = process.env.DB_DATABASE || 'TestSlimDB';
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;

async function testPerformance() {
  let authParams = '-E';
  if (DB_USER && DB_PASSWORD) {
    authParams = `-U ${DB_USER} -P ${DB_PASSWORD}`;
  }

  console.log('Performance Test: Phase Breakdown Queries');
  console.log('='.repeat(70));
  
  // Test 1: Original query (no aggregation) - single table
  console.log('\n1. Original Query (1-minute data, single table):');
  const query1 = "SELECT CONVERT(varchar, ts, 120) as ts, value FROM [SaitSolarLab_30000_TL342] WHERE CONVERT(varchar, ts, 23) >= '2020-11-01' AND CONVERT(varchar, ts, 23) <= '2020-11-08' ORDER BY ts";
  const start1 = Date.now();
  const cmd1 = `sqlcmd -S ${DB_SERVER} ${authParams} -d ${DB_DATABASE} -Q "${query1}" -s "," -W -h -1`;
  
  try {
    const { stdout: out1 } = await execPromise(cmd1);
    const lines1 = out1.trim().split('\n').filter(line => line.trim() && !line.includes('rows affected'));
    const time1 = Date.now() - start1;
    console.log(`   Records: ${lines1.length}`);
    console.log(`   Time: ${time1}ms`);
  } catch (error) {
    console.error(`   Error: ${error.message}`);
  }

  // Test 2: Aggregated query (hourly SUM) - single table
  console.log('\n2. Aggregated Query (hourly SUM, single table):');
  const query2 = "SELECT CONVERT(varchar, DATEADD(hour, DATEDIFF(hour, 0, ts), 0), 120) as ts, SUM(value) as value FROM [SaitSolarLab_30000_TL342] WHERE CONVERT(varchar, ts, 23) >= '2020-11-01' AND CONVERT(varchar, ts, 23) <= '2020-11-08' GROUP BY DATEADD(hour, DATEDIFF(hour, 0, ts), 0) ORDER BY ts";
  const start2 = Date.now();
  const cmd2 = `sqlcmd -S ${DB_SERVER} ${authParams} -d ${DB_DATABASE} -Q "${query2}" -s "," -W -h -1`;
  
  try {
    const { stdout: out2 } = await execPromise(cmd2);
    const lines2 = out2.trim().split('\n').filter(line => line.trim() && !line.includes('rows affected'));
    const time2 = Date.now() - start2;
    console.log(`   Records: ${lines2.length}`);
    console.log(`   Time: ${time2}ms`);
  } catch (error) {
    console.error(`   Error: ${error.message}`);
  }

  // Test 3: Sequential queries for 4 tables (current approach)
  console.log('\n3. Current Approach (4 sequential aggregated queries):');
  const tables = ['TL342', 'TL343', 'TL344', 'TL345'];
  const start3 = Date.now();
  
  for (const table of tables) {
    const query = `SELECT CONVERT(varchar, DATEADD(hour, DATEDIFF(hour, 0, ts), 0), 120) as ts, SUM(value) as value FROM [SaitSolarLab_30000_${table}] WHERE CONVERT(varchar, ts, 23) >= '2020-11-01' AND CONVERT(varchar, ts, 23) <= '2020-11-08' GROUP BY DATEADD(hour, DATEDIFF(hour, 0, ts), 0) ORDER BY ts`;
    const cmd = `sqlcmd -S ${DB_SERVER} ${authParams} -d ${DB_DATABASE} -Q "${query}" -s "," -W -h -1`;
    await execPromise(cmd);
  }
  
  const time3 = Date.now() - start3;
  console.log(`   Tables: 4`);
  console.log(`   Total Time: ${time3}ms`);
  console.log(`   Average per table: ${(time3/4).toFixed(0)}ms`);

  console.log('\n' + '='.repeat(70));
  console.log('ANALYSIS:');
  console.log(`- Aggregation overhead per query: ~${time2 - time1}ms`);
  console.log(`- Total overhead for 4 tables: ~${(time2 - time1) * 4}ms`);
  console.log('- Recommendation: Consider caching or pre-aggregated views');
  console.log('='.repeat(70));
}

testPerformance();
