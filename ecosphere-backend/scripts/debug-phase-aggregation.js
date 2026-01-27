// Debug script to analyze Phase data aggregation issue
// Check if Phase tables contain cumulative or increment values

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const { buildSqlcmdCommand, filterOutputLines, QUERY_CONSTANTS } = require('../config/database');

async function analyzePhaseData() {
    console.log('=== Phase Data Aggregation Analysis ===\n');

    // Sample a few hours of data from Phase A (TL343)
    const tableName = 'SaitSolarLab_30000_TL343';

    // Get first 120 records (2 hours of 1-minute data)
    const query = `
    SELECT TOP 120 
      CONVERT(varchar, ts, 120) as ts, 
      value 
    FROM [${tableName}] 
    WHERE ts >= '2020-11-01' AND ts < '2020-11-02'
    ORDER BY ts
  `;

    const command = buildSqlcmdCommand(query);

    try {
        const { stdout } = await execPromise(command);
        const lines = filterOutputLines(stdout);

        console.log(`Total records fetched: ${lines.length}\n`);

        if (lines.length === 0) {
            console.log('No data found!');
            return;
        }

        // Parse data
        const data = lines.map(line => {
            const parts = line.split(QUERY_CONSTANTS.CSV_DELIMITER).map(p => p.trim());
            return {
                ts: parts[0],
                value: parseFloat(parts[1])
            };
        });

        // Show first 10 records
        console.log('First 10 records (1-minute intervals):');
        console.log('Timestamp                | Value (Wh)');
        console.log('-------------------------|------------');
        data.slice(0, 10).forEach(item => {
            console.log(`${item.ts} | ${item.value.toFixed(2)}`);
        });

        // Analyze value patterns
        console.log('\n=== Value Pattern Analysis ===');

        // Check if values are cumulative (always increasing)
        let isIncreasing = true;
        let isDecreasing = true;
        let hasNegative = false;
        let hasPositive = false;

        for (let i = 1; i < data.length; i++) {
            if (data[i].value < data[i - 1].value) isIncreasing = false;
            if (data[i].value > data[i - 1].value) isDecreasing = false;
            if (data[i].value < 0) hasNegative = true;
            if (data[i].value > 0) hasPositive = true;
        }

        console.log(`Values always increasing: ${isIncreasing}`);
        console.log(`Values always decreasing: ${isDecreasing}`);
        console.log(`Has negative values: ${hasNegative}`);
        console.log(`Has positive values: ${hasPositive}`);

        // Calculate statistics
        const values = data.map(d => d.value);
        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);

        console.log(`\nValue range: ${min.toFixed(2)} to ${max.toFixed(2)} Wh`);
        console.log(`Average value: ${avg.toFixed(2)} Wh`);
        console.log(`Sum of all values: ${sum.toFixed(2)} Wh`);

        // Group by hour and sum
        console.log('\n=== Hourly Aggregation Test ===');
        const hourlyData = {};

        data.forEach(item => {
            const hour = item.ts.substring(0, 13); // YYYY-MM-DD HH
            if (!hourlyData[hour]) {
                hourlyData[hour] = { sum: 0, count: 0, values: [] };
            }
            hourlyData[hour].sum += item.value;
            hourlyData[hour].count++;
            hourlyData[hour].values.push(item.value);
        });

        console.log('Hour                | Count | Sum (Wh)    | Avg (Wh)');
        console.log('--------------------|-------|-------------|----------');
        Object.keys(hourlyData).sort().forEach(hour => {
            const data = hourlyData[hour];
            console.log(`${hour}:00:00 | ${data.count.toString().padStart(5)} | ${data.sum.toFixed(2).padStart(11)} | ${(data.sum / data.count).toFixed(2).padStart(8)}`);
        });

        // Compare with backend aggregation query
        console.log('\n=== Backend Aggregation Query Test ===');
        const aggQuery = `
      SELECT 
        CONVERT(varchar, CAST(ts AS DATE), 23) + ' ' + 
        RIGHT('0' + CAST(DATEPART(HOUR, ts) AS VARCHAR), 2) + ':00:00' as ts, 
        SUM(value) as value,
        COUNT(*) as count
      FROM [${tableName}] 
      WHERE ts >= '2020-11-01' AND ts < '2020-11-02'
      GROUP BY CAST(ts AS DATE), DATEPART(HOUR, ts) 
      ORDER BY CAST(ts AS DATE), DATEPART(HOUR, ts)
    `;

        const aggCommand = buildSqlcmdCommand(aggQuery);
        const { stdout: aggStdout } = await execPromise(aggCommand);
        const aggLines = filterOutputLines(aggStdout);

        console.log('Backend aggregation results (first 5 hours):');
        console.log('Timestamp           | Sum (Wh)    | Count');
        console.log('--------------------|-------------|------');
        aggLines.slice(0, 5).forEach(line => {
            const parts = line.split(QUERY_CONSTANTS.CSV_DELIMITER).map(p => p.trim());
            console.log(`${parts[0]} | ${parseFloat(parts[1]).toFixed(2).padStart(11)} | ${parts[2].padStart(5)}`);
        });

        // Conclusion
        console.log('\n=== Conclusion ===');
        if (isIncreasing || isDecreasing) {
            console.log('⚠️  Data appears to be CUMULATIVE (monotonic)');
            console.log('    Using SUM() on cumulative data will cause inflated values!');
            console.log('    Should use MAX(value) - MIN(value) for each hour instead.');
        } else {
            console.log('✓  Data appears to be INCREMENT values');
            console.log('    Using SUM() is correct for aggregation.');
        }

        if (Math.abs(avg) > 1000) {
            console.log('\n⚠️  WARNING: Average value per minute is very high!');
            console.log(`    ${avg.toFixed(2)} Wh per minute = ${(avg * 60).toFixed(2)} Wh per hour`);
            console.log('    This suggests the data might be cumulative or in wrong units.');
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Run analysis
analyzePhaseData();
