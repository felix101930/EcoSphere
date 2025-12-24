// Test the optimized Phase query with hourly aggregation
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const DB_SERVER = process.env.DB_SERVER || 'localhost';
const DB_DATABASE = process.env.DB_DATABASE || 'TestSlimDB';
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;

async function testAggregation() {
  console.log('Testing Phase data aggregation performance...\n');
  
  // Test original query (1-minute data)
  const originalQuery = "SELECT CONVERT(varchar, ts, 120) as ts, value FROM [SaitSolarLab_30000_TL342] WHERE CONVERT(varchar, ts, 23) >= '2020-11-01' AND CONVERT(varchar, ts, 23) <= '2020-11-08' ORDER BY ts";
  
  // Test aggregated query (hourly averages)
  const aggregatedQuery = "SELECT CONVERT(varchar, DATEADD(hour, DATEDIFF(hour, 0, ts), 0), 120) as ts, AVG(value) as value FROM [SaitSolarLab_30000_TL342] WHERE CONVERT(varchar, ts, 23) >= '2020-11-01' AND CONVERT(varchar, ts, 23) <= '2020-11-08' GROUP BY DATEADD(hour, DATEDIFF(hour, 0, ts), 0) ORDER BY ts";
  
  let authParams = '-E';
  if (DB_USER && DB_PASSWORD) {
    authParams = `-U ${DB_USER} -P ${DB_PASSWORD}`;
  }
  
  try {
    // Test original query
    console.log('1. Original Query (1-minute intervals):');
    const start1 = Date.now();
    const command1 = `sqlcmd -S ${DB_SERVER} ${authParams} -d ${DB_DATABASE} -Q "${originalQuery}" -s "," -W -h -1`;
    const { stdout: stdout1 } = await execPromise(command1);
    const lines1 = stdout1.trim().split('\n').filter(line => line.trim() && !line.includes('rows affected'));
    const time1 = Date.now() - start1;
    console.log(`   Records: ${lines1.length}`);
    console.log(`   Time: ${time1}ms`);
    console.log(`   First 3 records:`);
    lines1.slice(0, 3).forEach(line => console.log(`     ${line}`));
    
    // Test aggregated query
    console.log('\n2. Aggregated Query (hourly averages):');
    const start2 = Date.now();
    const command2 = `sqlcmd -S ${DB_SERVER} ${authParams} -d ${DB_DATABASE} -Q "${aggregatedQuery}" -s "," -W -h -1`;
    const { stdout: stdout2 } = await execPromise(command2);
    const lines2 = stdout2.trim().split('\n').filter(line => line.trim() && !line.includes('rows affected'));
    const time2 = Date.now() - start2;
    console.log(`   Records: ${lines2.length}`);
    console.log(`   Time: ${time2}ms`);
    console.log(`   First 3 records:`);
    lines2.slice(0, 3).forEach(line => console.log(`     ${line}`));
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('PERFORMANCE IMPROVEMENT:');
    console.log(`   Data reduction: ${lines1.length} → ${lines2.length} records (${((1 - lines2.length/lines1.length) * 100).toFixed(1)}% reduction)`);
    console.log(`   Speed improvement: ${time1}ms → ${time2}ms (${((1 - time2/time1) * 100).toFixed(1)}% faster)`);
    console.log('='.repeat(60));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAggregation();
