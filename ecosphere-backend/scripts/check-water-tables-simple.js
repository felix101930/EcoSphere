// Simple script to check water-related tables
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Use the correct server name from .env
const SERVER = '.\\SQLEXPRESS';
const DATABASE = 'TestSlimDB';
const SQLCMD_PATH = 'C:\\Program Files\\Microsoft SQL Server\\Client SDK\\ODBC\\180\\Tools\\Binn\\SQLCMD.EXE';

// Water-related tables to analyze
const WATER_TABLES = [
    'SaitSolarLab_20001_TL2',  // Humidity sensor 1
    'SaitSolarLab_20002_TL2',  // Humidity sensor 2
    'SaitSolarLab_20003_TL2',  // Humidity sensor 3
    'SaitSolarLab_30000_TL1',  // Water consumption (likely)
    'SaitSolarLab_30000_TL2'   // Water related (likely)
];

function buildCommand(query) {
    return `"${SQLCMD_PATH}" -S ${SERVER} -E -d ${DATABASE} -C -Q "${query}" -s "," -W -h -1`;
}

async function analyzeTable(tableName) {
    console.log('\n' + '='.repeat(80));
    console.log(`Table: ${tableName}`);
    console.log('='.repeat(80));

    try {
        // 1. Record count and date range
        console.log('\n1. BASIC INFO:');
        const infoQuery = `SELECT COUNT(*) as records, MIN(CONVERT(varchar, ts, 23)) as min_date, MAX(CONVERT(varchar, ts, 23)) as max_date, DATEDIFF(day, MIN(ts), MAX(ts)) + 1 as days FROM [${tableName}]`;
        const infoCommand = buildCommand(infoQuery);
        const { stdout: infoOutput } = await execPromise(infoCommand);
        const infoLines = infoOutput.trim().split('\n').filter(line => line.trim() && !line.includes('rows affected'));
        console.log('Records, Min Date, Max Date, Total Days:');
        infoLines.forEach(line => console.log(line));

        // 2. Value statistics
        console.log('\n2. VALUE STATISTICS:');
        const statsQuery = `SELECT MIN(value) as min_val, MAX(value) as max_val, AVG(value) as avg_val FROM [${tableName}]`;
        const statsCommand = buildCommand(statsQuery);
        const { stdout: statsOutput } = await execPromise(statsCommand);
        const statsLines = statsOutput.trim().split('\n').filter(line => line.trim() && !line.includes('rows affected'));
        console.log('Min, Max, Average:');
        statsLines.forEach(line => console.log(line));

        // 3. Sample data (first 5 records)
        console.log('\n3. FIRST 5 RECORDS:');
        const sampleQuery = `SELECT TOP 5 CONVERT(varchar, ts, 120) as timestamp, value FROM [${tableName}] ORDER BY ts`;
        const sampleCommand = buildCommand(sampleQuery);
        const { stdout: sampleOutput } = await execPromise(sampleCommand);
        const sampleLines = sampleOutput.trim().split('\n').filter(line => line.trim() && !line.includes('rows affected'));
        console.log('Timestamp, Value:');
        sampleLines.forEach(line => console.log(line));

        // 4. Latest data (last 5 records)
        console.log('\n4. LAST 5 RECORDS:');
        const latestQuery = `SELECT TOP 5 CONVERT(varchar, ts, 120) as timestamp, value FROM [${tableName}] ORDER BY ts DESC`;
        const latestCommand = buildCommand(latestQuery);
        const { stdout: latestOutput } = await execPromise(latestCommand);
        const latestLines = latestOutput.trim().split('\n').filter(line => line.trim() && !line.includes('rows affected'));
        console.log('Timestamp, Value:');
        latestLines.forEach(line => console.log(line));

        // 5. Check data interval (sample)
        console.log('\n5. DATA INTERVAL (First 10 intervals):');
        const intervalQuery = `WITH TimeIntervals AS (SELECT TOP 10 ts, LAG(ts) OVER (ORDER BY ts) as prev_ts FROM [${tableName}]) SELECT CONVERT(varchar, ts, 120) as timestamp, DATEDIFF(MINUTE, prev_ts, ts) as minutes FROM TimeIntervals WHERE prev_ts IS NOT NULL`;
        const intervalCommand = buildCommand(intervalQuery);
        const { stdout: intervalOutput } = await execPromise(intervalCommand);
        const intervalLines = intervalOutput.trim().split('\n').filter(line => line.trim() && !line.includes('rows affected'));
        console.log('Timestamp, Minutes Since Previous:');
        intervalLines.forEach(line => console.log(line));

    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

async function main() {
    console.log('WATER-RELATED TABLES ANALYSIS');
    console.log('Database: TestSlimDB');
    console.log('Server: .\\SQLEXPRESS');
    console.log('Analysis Date:', new Date().toLocaleString());

    for (const tableName of WATER_TABLES) {
        await analyzeTable(tableName);
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n' + '='.repeat(80));
    console.log('ANALYSIS COMPLETE');
    console.log('='.repeat(80));
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
