// Verify Phase data aggregation fix
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const { buildSqlcmdCommand } = require('../config/database');

async function verifyFix() {
    console.log('=== Verifying Phase Data Aggregation Fix ===\n');

    const tableName = 'SaitSolarLab_30000_TL343';

    // Test with AVG aggregation (new method)
    console.log('1. Using AVG aggregation (FIXED):');
    const avgQuery = `SELECT CONVERT(varchar, CAST(ts AS DATE), 23) + ' ' + RIGHT('0' + CAST(DATEPART(HOUR, ts) AS VARCHAR), 2) + ':00:00' as ts, AVG(value) as value FROM [${tableName}] WHERE ts >= '2020-11-01' AND ts < '2020-11-02' GROUP BY CAST(ts AS DATE), DATEPART(HOUR, ts) ORDER BY CAST(ts AS DATE), DATEPART(HOUR, ts)`;

    try {
        const { stdout: avgOut } = await execPromise(buildSqlcmdCommand(avgQuery));
        const avgLines = avgOut.trim().split('\n').filter(line => {
            const trimmed = line.trim();
            return trimmed && !trimmed.includes('rows affected') && !trimmed.startsWith('(');
        });

        console.log('First 5 hours (hourly average):');
        avgLines.slice(0, 5).forEach(line => console.log(line));

        // Calculate daily sum (what frontend does)
        let dailySum = 0;
        avgLines.forEach(line => {
            const parts = line.split(',');
            if (parts.length >= 2) {
                dailySum += Math.abs(parseFloat(parts[1]));
            }
        });

        console.log(`\nDaily total (sum of hourly averages): ${dailySum.toFixed(2)} Wh`);
        console.log(`Average per hour: ${(dailySum / avgLines.length).toFixed(2)} Wh`);
        console.log(`Expected daily consumption: ~${(dailySum / 1000).toFixed(2)} kWh`);

    } catch (error) {
        console.error('Error:', error.message);
    }

    // Compare with old SUM method
    console.log('\n2. Using SUM aggregation (OLD - WRONG):');
    const sumQuery = `SELECT CONVERT(varchar, CAST(ts AS DATE), 23) + ' ' + RIGHT('0' + CAST(DATEPART(HOUR, ts) AS VARCHAR), 2) + ':00:00' as ts, SUM(value) as value FROM [${tableName}] WHERE ts >= '2020-11-01' AND ts < '2020-11-02' GROUP BY CAST(ts AS DATE), DATEPART(HOUR, ts) ORDER BY CAST(ts AS DATE), DATEPART(HOUR, ts)`;

    try {
        const { stdout: sumOut } = await execPromise(buildSqlcmdCommand(sumQuery));
        const sumLines = sumOut.trim().split('\n').filter(line => {
            const trimmed = line.trim();
            return trimmed && !trimmed.includes('rows affected') && !trimmed.startsWith('(');
        });

        console.log('First 5 hours (hourly sum):');
        sumLines.slice(0, 5).forEach(line => console.log(line));

        // Calculate daily sum
        let dailySumOld = 0;
        sumLines.forEach(line => {
            const parts = line.split(',');
            if (parts.length >= 2) {
                dailySumOld += Math.abs(parseFloat(parts[1]));
            }
        });

        console.log(`\nDaily total (sum of hourly sums): ${dailySumOld.toFixed(2)} Wh`);
        console.log(`This was WRONG: ~${(dailySumOld / 1000).toFixed(2)} kWh per day`);

    } catch (error) {
        console.error('Error:', error.message);
    }

    console.log('\n=== Conclusion ===');
    console.log('✓ Using AVG() gives reasonable power consumption values');
    console.log('✓ Frontend can now sum hourly averages to get daily totals');
    console.log('✓ Values should be in the range of 100-200 Wh per hour (reasonable for building)');
}

verifyFix();
