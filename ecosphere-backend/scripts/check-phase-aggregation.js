// Check Phase data aggregation
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const { buildSqlcmdCommand } = require('../config/database');

async function checkAggregation() {
    console.log('=== Phase A Data Analysis ===\n');

    // 1. Check raw 1-minute data (first hour)
    console.log('1. Raw 1-minute data (first 60 minutes of 2020-11-01):');
    const rawQuery = `SELECT TOP 60 CONVERT(varchar, ts, 120) as ts, value FROM [SaitSolarLab_30000_TL343] WHERE ts >= '2020-11-01' AND ts < '2020-11-01 01:00:00' ORDER BY ts`;

    try {
        const { stdout: rawOut } = await execPromise(buildSqlcmdCommand(rawQuery));
        const rawLines = rawOut.trim().split('\n').filter(line => {
            const trimmed = line.trim();
            return trimmed && !trimmed.includes('rows affected') && !trimmed.startsWith('(');
        });

        console.log(`Total records: ${rawLines.length}`);
        console.log('First 5 records:');
        rawLines.slice(0, 5).forEach(line => console.log(line));
        console.log('...');
        console.log('Last 5 records:');
        rawLines.slice(-5).forEach(line => console.log(line));

        // Calculate sum manually
        let sum = 0;
        rawLines.forEach(line => {
            const parts = line.split(',');
            if (parts.length >= 2) {
                sum += parseFloat(parts[1]);
            }
        });
        console.log(`\nManual SUM of first hour: ${sum.toFixed(2)} Wh`);
        console.log(`Average per minute: ${(sum / rawLines.length).toFixed(2)} Wh`);

    } catch (error) {
        console.error('Error fetching raw data:', error.message);
    }

    // 2. Check backend aggregation query (hourly SUM)
    console.log('\n2. Backend aggregation (hourly SUM):');
    const aggQuery = `SELECT CONVERT(varchar, CAST(ts AS DATE), 23) + ' ' + RIGHT('0' + CAST(DATEPART(HOUR, ts) AS VARCHAR), 2) + ':00:00' as ts, SUM(value) as value, COUNT(*) as count FROM [SaitSolarLab_30000_TL343] WHERE ts >= '2020-11-01' AND ts < '2020-11-02' GROUP BY CAST(ts AS DATE), DATEPART(HOUR, ts) ORDER BY CAST(ts AS DATE), DATEPART(HOUR, ts)`;

    try {
        const { stdout: aggOut } = await execPromise(buildSqlcmdCommand(aggQuery));
        const aggLines = aggOut.trim().split('\n').filter(line => {
            const trimmed = line.trim();
            return trimmed && !trimmed.includes('rows affected') && !trimmed.startsWith('(');
        });

        console.log('First 5 hours:');
        aggLines.slice(0, 5).forEach(line => console.log(line));

        // Parse first hour
        if (aggLines.length > 0) {
            const parts = aggLines[0].split(',');
            console.log(`\nFirst hour aggregated: ${parseFloat(parts[1]).toFixed(2)} Wh (from ${parts[2]} records)`);
        }

    } catch (error) {
        console.error('Error fetching aggregated data:', error.message);
    }

    // 3. Check what frontend receives
    console.log('\n3. Simulating frontend daily aggregation:');
    const dailyQuery = `SELECT CONVERT(varchar, CAST(ts AS DATE), 23) + ' ' + RIGHT('0' + CAST(DATEPART(HOUR, ts) AS VARCHAR), 2) + ':00:00' as ts, SUM(value) as value FROM [SaitSolarLab_30000_TL343] WHERE ts >= '2020-11-01' AND ts < '2020-11-02' GROUP BY CAST(ts AS DATE), DATEPART(HOUR, ts) ORDER BY CAST(ts AS DATE), DATEPART(HOUR, ts)`;

    try {
        const { stdout: dailyOut } = await execPromise(buildSqlcmdCommand(dailyQuery));
        const dailyLines = dailyOut.trim().split('\n').filter(line => {
            const trimmed = line.trim();
            return trimmed && !trimmed.includes('rows affected') && !trimmed.startsWith('(');
        });

        // Sum all hourly values (what frontend does)
        let dailySum = 0;
        dailyLines.forEach(line => {
            const parts = line.split(',');
            if (parts.length >= 2) {
                dailySum += Math.abs(parseFloat(parts[1]));
            }
        });

        console.log(`Total hours in day: ${dailyLines.length}`);
        console.log(`Frontend daily SUM (sum of hourly sums): ${dailySum.toFixed(2)} Wh`);
        console.log(`Average per hour: ${(dailySum / dailyLines.length).toFixed(2)} Wh`);

    } catch (error) {
        console.error('Error:', error.message);
    }

    console.log('\n=== Analysis ===');
    console.log('If the hourly SUM is very large (e.g., -200,000 Wh), it means:');
    console.log('- The 1-minute data is NOT increment values');
    console.log('- The 1-minute data is likely cumulative or power readings');
    console.log('- Using SUM() is incorrect - should use AVG() or MAX()-MIN()');
}

checkAggregation();
