// Script to analyze water-related tables in the database
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const {
    buildSqlcmdCommand,
    getFullTableName
} = require('../config/database');

// Water-related tables to analyze
const WATER_TABLES = [
    '20001_TL2',  // Humidity sensor 1
    '20002_TL2',  // Humidity sensor 2
    '20003_TL2',  // Humidity sensor 3
    '30000_TL1',  // Water consumption (likely)
    '30000_TL2'   // Water related (likely)
];

async function analyzeTable(tableName) {
    console.log('\n' + '='.repeat(80));
    console.log(`Analyzing Table: ${tableName}`);
    console.log('='.repeat(80));

    const fullTableName = getFullTableName(tableName);

    try {
        // 1. Get table structure (column names and types)
        console.log('\n1. TABLE STRUCTURE:');
        const structureQuery = `SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${fullTableName}' ORDER BY ORDINAL_POSITION`;
        const structureCommand = buildSqlcmdCommand(structureQuery);
        const { stdout: structureOutput } = await execPromise(structureCommand);
        console.log(structureOutput);

        // 2. Get record count
        console.log('\n2. RECORD COUNT:');
        const countQuery = `SELECT COUNT(*) as total_records FROM [${fullTableName}]`;
        const countCommand = buildSqlcmdCommand(countQuery);
        const { stdout: countOutput } = await execPromise(countCommand);
        console.log(countOutput);

        // 3. Get date range
        console.log('\n3. DATE RANGE:');
        const dateRangeQuery = `SELECT MIN(CONVERT(varchar, ts, 23)) as min_date, MAX(CONVERT(varchar, ts, 23)) as max_date, DATEDIFF(day, MIN(ts), MAX(ts)) + 1 as total_days FROM [${fullTableName}]`;
        const dateRangeCommand = buildSqlcmdCommand(dateRangeQuery);
        const { stdout: dateRangeOutput } = await execPromise(dateRangeCommand);
        console.log(dateRangeOutput);

        // 4. Get sample data (first 10 records)
        console.log('\n4. SAMPLE DATA (First 10 records):');
        const sampleQuery = `SELECT TOP 10 CONVERT(varchar, ts, 120) as timestamp, value, seq FROM [${fullTableName}] ORDER BY ts`;
        const sampleCommand = buildSqlcmdCommand(sampleQuery);
        const { stdout: sampleOutput } = await execPromise(sampleCommand);
        console.log(sampleOutput);

        // 5. Get value statistics
        console.log('\n5. VALUE STATISTICS:');
        const statsQuery = `SELECT MIN(value) as min_value, MAX(value) as max_value, AVG(value) as avg_value, STDEV(value) as std_dev FROM [${fullTableName}]`;
        const statsCommand = buildSqlcmdCommand(statsQuery);
        const { stdout: statsOutput } = await execPromise(statsCommand);
        console.log(statsOutput);

        // 6. Check data interval (time between records)
        console.log('\n6. DATA INTERVAL ANALYSIS:');
        const intervalQuery = `WITH TimeIntervals AS (SELECT ts, LAG(ts) OVER (ORDER BY ts) as prev_ts FROM [${fullTableName}]) SELECT TOP 20 CONVERT(varchar, ts, 120) as timestamp, DATEDIFF(MINUTE, prev_ts, ts) as minutes_since_prev FROM TimeIntervals WHERE prev_ts IS NOT NULL ORDER BY ts`;
        const intervalCommand = buildSqlcmdCommand(intervalQuery);
        const { stdout: intervalOutput } = await execPromise(intervalCommand);
        console.log(intervalOutput);

        // 7. Get latest records
        console.log('\n7. LATEST DATA (Last 10 records):');
        const latestQuery = `SELECT TOP 10 CONVERT(varchar, ts, 120) as timestamp, value, seq FROM [${fullTableName}] ORDER BY ts DESC`;
        const latestCommand = buildSqlcmdCommand(latestQuery);
        const { stdout: latestOutput } = await execPromise(latestCommand);
        console.log(latestOutput);

    } catch (error) {
        console.error(`Error analyzing table ${tableName}:`, error.message);
    }
}

async function main() {
    console.log('WATER-RELATED TABLES ANALYSIS');
    console.log('Database: EcoSphereData');
    console.log('Analysis Date:', new Date().toISOString());
    console.log('\nTables to analyze:');
    WATER_TABLES.forEach((table, index) => {
        console.log(`  ${index + 1}. ${table}`);
    });

    for (const tableName of WATER_TABLES) {
        await analyzeTable(tableName);
        // Add a small delay between queries to avoid overwhelming the database
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
