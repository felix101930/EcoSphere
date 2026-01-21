// Analyze thermal data patterns to understand temperature behavior
// This script checks for:
// 1. Daily temperature variation patterns
// 2. Weekday vs Weekend differences
// 3. Working hours vs Non-working hours
// 4. Seasonal patterns

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const { buildSqlcmdCommand, filterOutputLines, QUERY_CONSTANTS } = require('../config/database');

// Sensor to analyze (Basement sensor as example)
const SENSOR_ID = 'SaitSolarLab_20004_TL2';

async function analyzeThermalPatterns() {
    console.log('='.repeat(80));
    console.log('THERMAL DATA PATTERN ANALYSIS');
    console.log('='.repeat(80));
    console.log(`Sensor: ${SENSOR_ID}`);
    console.log('');

    try {
        // 1. Get overall data range and statistics
        console.log('1. OVERALL DATA STATISTICS');
        console.log('-'.repeat(80));
        const statsQuery = `
            SELECT 
                MIN(CONVERT(varchar, ts, 23)) as first_date,
                MAX(CONVERT(varchar, ts, 23)) as last_date,
                COUNT(*) as total_records,
                AVG(value) as avg_temp,
                MIN(value) as min_temp,
                MAX(value) as max_temp,
                STDEV(value) as std_dev
            FROM [${SENSOR_ID}]
        `;
        const statsLines = await executeQuery(statsQuery);
        const statsData = parseResults(statsLines);
        formatTable(statsData, ['First Date', 'Last Date', 'Total Records', 'Avg Temp', 'Min Temp', 'Max Temp', 'Std Dev']);
        console.log('');

        // 2. Analyze hourly patterns (working hours vs non-working hours)
        console.log('2. HOURLY PATTERN ANALYSIS (Average temperature by hour of day)');
        console.log('-'.repeat(80));
        const hourlyQuery = `
            SELECT 
                DATEPART(hour, ts) as hour,
                AVG(value) as avg_temp,
                MIN(value) as min_temp,
                MAX(value) as max_temp,
                COUNT(*) as records
            FROM [${SENSOR_ID}]
            GROUP BY DATEPART(hour, ts)
            ORDER BY hour
        `;
        const hourlyLines = await executeQuery(hourlyQuery);
        const hourlyData = parseResults(hourlyLines);
        formatTable(hourlyData, ['Hour', 'Avg Temp', 'Min Temp', 'Max Temp', 'Records']);
        console.log('');

        // 3. Analyze day of week patterns (weekday vs weekend)
        console.log('3. DAY OF WEEK PATTERN ANALYSIS');
        console.log('-'.repeat(80));
        const dowQuery = `
            SELECT 
                DATEPART(weekday, ts) as day_of_week,
                CASE DATEPART(weekday, ts)
                    WHEN 1 THEN 'Sunday'
                    WHEN 2 THEN 'Monday'
                    WHEN 3 THEN 'Tuesday'
                    WHEN 4 THEN 'Wednesday'
                    WHEN 5 THEN 'Thursday'
                    WHEN 6 THEN 'Friday'
                    WHEN 7 THEN 'Saturday'
                END as day_name,
                AVG(value) as avg_temp,
                MIN(value) as min_temp,
                MAX(value) as max_temp,
                STDEV(value) as std_dev
            FROM [${SENSOR_ID}]
            GROUP BY DATEPART(weekday, ts)
            ORDER BY day_of_week
        `;
        const dowLines = await executeQuery(dowQuery);
        const dowData = parseResults(dowLines);
        formatTable(dowData, ['DOW', 'Day Name', 'Avg Temp', 'Min Temp', 'Max Temp', 'Std Dev']);
        console.log('');

        // 4. Analyze monthly patterns (seasonal variation)
        console.log('4. MONTHLY PATTERN ANALYSIS (Seasonal variation)');
        console.log('-'.repeat(80));
        const monthlyQuery = `
            SELECT 
                YEAR(ts) as year,
                MONTH(ts) as month,
                AVG(value) as avg_temp,
                MIN(value) as min_temp,
                MAX(value) as max_temp,
                STDEV(value) as std_dev,
                COUNT(*) as records
            FROM [${SENSOR_ID}]
            GROUP BY YEAR(ts), MONTH(ts)
            ORDER BY year, month
        `;
        const monthlyLines = await executeQuery(monthlyQuery);
        const monthlyData = parseResults(monthlyLines);
        formatTable(monthlyData, ['Year', 'Month', 'Avg Temp', 'Min Temp', 'Max Temp', 'Std Dev', 'Records']);
        console.log('');

        // 5. Sample a few complete days to see detailed patterns
        console.log('5. SAMPLE DAYS ANALYSIS (Last 3 complete days)');
        console.log('-'.repeat(80));
        const sampleQuery = `
            SELECT TOP 3 
                CONVERT(varchar, ts, 23) as date,
                DATEPART(weekday, ts) as day_of_week,
                AVG(value) as avg_temp,
                MIN(value) as min_temp,
                MAX(value) as max_temp,
                MAX(value) - MIN(value) as temp_range,
                COUNT(*) as records
            FROM [${SENSOR_ID}]
            GROUP BY CONVERT(varchar, ts, 23), DATEPART(weekday, ts)
            HAVING COUNT(*) = 96
            ORDER BY date DESC
        `;
        const sampleLines = await executeQuery(sampleQuery);
        const sampleData = parseResults(sampleLines);
        formatTable(sampleData, ['Date', 'DOW', 'Avg Temp', 'Min Temp', 'Max Temp', 'Range', 'Records']);
        console.log('');

        // 6. Analyze temperature stability (how much does it vary?)
        console.log('6. TEMPERATURE STABILITY ANALYSIS');
        console.log('-'.repeat(80));
        const stabilityQuery = `
            SELECT 
                CONVERT(varchar, ts, 23) as date,
                MAX(value) - MIN(value) as daily_range,
                STDEV(value) as daily_std_dev
            FROM [${SENSOR_ID}]
            GROUP BY CONVERT(varchar, ts, 23)
            ORDER BY daily_range DESC
        `;
        const stabilityLines = await executeQuery(stabilityQuery);
        const stabilityData = parseResults(stabilityLines).slice(0, 10);
        console.log('Top 10 days with highest temperature variation:');
        formatTable(stabilityData, ['Date', 'Daily Range', 'Std Dev']);
        console.log('');

        // 7. Check for HVAC on/off patterns (sudden drops/rises)
        console.log('7. HVAC PATTERN DETECTION (Looking for on/off cycles)');
        console.log('-'.repeat(80));
        console.log('Analyzing temperature changes between consecutive readings...');
        const hvacQuery = `
            WITH TempChanges AS (
                SELECT 
                    ts,
                    value,
                    LAG(value) OVER (ORDER BY ts) as prev_value,
                    value - LAG(value) OVER (ORDER BY ts) as temp_change
                FROM [${SENSOR_ID}]
            )
            SELECT 
                AVG(ABS(temp_change)) as avg_change,
                MAX(temp_change) as max_increase,
                MIN(temp_change) as max_decrease,
                STDEV(temp_change) as std_dev_change
            FROM TempChanges
            WHERE temp_change IS NOT NULL
        `;
        const hvacLines = await executeQuery(hvacQuery);
        const hvacData = parseResults(hvacLines);
        formatTable(hvacData, ['Avg Change', 'Max Increase', 'Max Decrease', 'Std Dev']);
        console.log('');

        console.log('='.repeat(80));
        console.log('ANALYSIS COMPLETE');
        console.log('='.repeat(80));
        console.log('');
        console.log('KEY INSIGHTS TO LOOK FOR:');
        console.log('1. Hourly patterns: Do temperatures drop at night or stay constant?');
        console.log('2. Day of week: Are weekends different from weekdays?');
        console.log('3. Seasonal: Do summer months differ from winter months?');
        console.log('4. Stability: Is temperature tightly controlled (small range) or variable?');
        console.log('5. HVAC cycles: Are there regular on/off patterns?');
        console.log('');

    } catch (error) {
        console.error('Error during analysis:', error.message);
        process.exit(1);
    }
}

async function executeQuery(query) {
    const command = buildSqlcmdCommand(query);
    try {
        const { stdout } = await execPromise(command);
        const lines = filterOutputLines(stdout);
        return lines;
    } catch (error) {
        throw new Error(`Query failed: ${error.message}`);
    }
}

function parseResults(lines) {
    return lines.map(line => {
        const parts = line.split(QUERY_CONSTANTS.CSV_DELIMITER).map(p => p.trim());
        return parts;
    });
}

function formatTable(data, headers) {
    if (data.length === 0) return 'No data';

    console.log(headers.join(' | '));
    console.log('-'.repeat(headers.join(' | ').length));

    data.forEach(row => {
        console.log(row.join(' | '));
    });
}

// Run analysis
analyzeThermalPatterns();
