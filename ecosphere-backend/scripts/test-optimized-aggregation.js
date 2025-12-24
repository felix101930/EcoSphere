// Test optimized aggregation approaches
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const DB_SERVER = process.env.DB_SERVER || 'localhost';
const DB_DATABASE = process.env.DB_DATABASE || 'TestSlimDB';
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;

async function testOptimizedAggregation() {
  let authParams = '-E';
  if (DB_USER && DB_PASSWORD) {
    authParams = `-U ${DB_USER} -P ${DB_PASSWORD}`;
  }

  console.log('Testing Optimized Aggregation Approaches');
  console.log('='.repeat(70));
  
  // Approach 1: Current (slow) - using DATEADD/DATEDIFF
  console.log('\n1. Current Approach (DATEADD/DATEDIFF):');
  const query1 = "SELECT CONVERT(varchar, DATEADD(hour, DATEDIFF(hour, 0, ts), 0), 120) as ts, SUM(value) as value FROM [SaitSolarLab_30000_TL342] WHERE CONVERT(varchar, ts, 23) >= '2020-11-01' AND CONVERT(varchar, ts, 23) <= '2020-11-08' GROUP BY DATEADD(hour, DATEDIFF(hour, 0, ts), 0) ORDER BY ts";
  const start1 = Date.now();
  const cmd1 = `sqlcmd -S ${DB_SERVER} ${authParams} -d ${DB_DATABASE} -Q "${query1}" -s "," -W -h -1`;
  
  try {
    await execPromise(cmd1);
    const time1 = Date.now() - start1;
    console.log(`   Time: ${time1}ms`);
  } catch (error) {
    console.error(`   Error: ${error.message}`);
  }

  // Approach 2: Optimized - using DATEPART for grouping
  console.log('\n2. Optimized Approach (DATEPART grouping):');
  const query2 = "SELECT CONVERT(varchar, CAST(CAST(ts AS DATE) AS DATETIME) + CAST(DATEPART(HOUR, ts) AS FLOAT)/24, 120) as ts, SUM(value) as value FROM [SaitSolarLab_30000_TL342] WHERE CONVERT(varchar, ts, 23) >= '2020-11-01' AND CONVERT(varchar, ts, 23) <= '2020-11-08' GROUP BY CAST(ts AS DATE), DATEPART(HOUR, ts) ORDER BY CAST(ts AS DATE), DATEPART(HOUR, ts)";
  const start2 = Date.now();
  const cmd2 = `sqlcmd -S ${DB_SERVER} ${authParams} -d ${DB_DATABASE} -Q "${query2}" -s "," -W -h -1`;
  
  try {
    await execPromise(cmd2);
    const time2 = Date.now() - start2;
    console.log(`   Time: ${time2}ms`);
  } catch (error) {
    console.error(`   Error: ${error.message}`);
  }

  // Approach 3: Even simpler - just group by date and hour
  console.log('\n3. Simplest Approach (Direct date/hour grouping):');
  const query3 = "SELECT CONVERT(varchar, CAST(CAST(ts AS DATE) AS DATETIME), 120) + ' ' + RIGHT('0' + CAST(DATEPART(HOUR, ts) AS VARCHAR), 2) + ':00:00' as ts, SUM(value) as value FROM [SaitSolarLab_30000_TL342] WHERE ts >= '2020-11-01' AND ts < '2020-11-09' GROUP BY CAST(ts AS DATE), DATEPART(HOUR, ts) ORDER BY CAST(ts AS DATE), DATEPART(HOUR, ts)";
  const start3 = Date.now();
  const cmd3 = `sqlcmd -S ${DB_SERVER} ${authParams} -d ${DB_DATABASE} -Q "${query3}" -s "," -W -h -1`;
  
  try {
    const { stdout } = await execPromise(cmd3);
    const time3 = Date.now() - start3;
    const lines = stdout.trim().split('\n').filter(line => line.trim() && !line.includes('rows affected'));
    console.log(`   Time: ${time3}ms`);
    console.log(`   Records: ${lines.length}`);
    console.log(`   First 3 records:`);
    lines.slice(0, 3).forEach(line => console.log(`     ${line}`));
  } catch (error) {
    console.error(`   Error: ${error.message}`);
  }

  console.log('\n' + '='.repeat(70));
}

testOptimizedAggregation();
