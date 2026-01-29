// Check TL20005 table data
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const { buildSqlcmdCommand, getFullTableName } = require('../config/database');

async function checkTL20005() {
    const sensorId = '20005_TL2';
    const fullTableName = getFullTableName(sensorId);

    console.log(`Checking data for: ${fullTableName}`);

    // Check if table exists
    const tableName = fullTableName.includes('.')
        ? fullTableName.split('.')[1].replace(/[\[\]]/g, '')
        : fullTableName.replace(/[\[\]]/g, '');

    const existsQuery = `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '${tableName}'`;
    const existsCommand = buildSqlcmdCommand(existsQuery);

    try {
        const { stdout: existsOutput } = await execPromise(existsCommand);
        console.log('\nTable exists check:');
        console.log(existsOutput);

        // Check row count
        const countQuery = `SELECT COUNT(*) as total_rows FROM [${fullTableName}]`;
        const countCommand = buildSqlcmdCommand(countQuery);
        const { stdout: countOutput } = await execPromise(countCommand);
        console.log('\nTotal rows:');
        console.log(countOutput);

        // Check date range
        const dateRangeQuery = `SELECT MIN(CONVERT(varchar, ts, 23)) as min_date, MAX(CONVERT(varchar, ts, 23)) as max_date FROM [${fullTableName}]`;
        const dateRangeCommand = buildSqlcmdCommand(dateRangeQuery);
        const { stdout: dateRangeOutput } = await execPromise(dateRangeCommand);
        console.log('\nDate range:');
        console.log(dateRangeOutput);

        // Get sample data from recent dates
        const sampleQuery = `SELECT TOP 5 CONVERT(varchar, ts, 120) as ts, value FROM [${fullTableName}] WHERE CONVERT(varchar, ts, 23) >= '2024-05-27' ORDER BY ts DESC`;
        const sampleCommand = buildSqlcmdCommand(sampleQuery);
        const { stdout: sampleOutput } = await execPromise(sampleCommand);
        console.log('\nSample data (last 5 rows from 2024-05-27 onwards):');
        console.log(sampleOutput);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkTL20005();
