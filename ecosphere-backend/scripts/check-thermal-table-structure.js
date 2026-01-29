// Check thermal table structure
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const { buildSqlcmdCommand, getFullTableName } = require('../config/database');

async function checkTableStructure() {
    const sensorId = '20004_TL2';
    const fullTableName = getFullTableName(sensorId);

    console.log(`Checking table structure for: ${fullTableName}`);

    // Extract just the table name without schema
    const tableName = fullTableName.includes('.')
        ? fullTableName.split('.')[1].replace(/[\[\]]/g, '')
        : fullTableName.replace(/[\[\]]/g, '');

    console.log(`Table name for query: ${tableName}`);

    // Query to get column information
    const query = `SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${tableName}' ORDER BY ORDINAL_POSITION`;
    const command = buildSqlcmdCommand(query);

    try {
        const { stdout } = await execPromise(command);
        console.log('\nTable columns:');
        console.log(stdout);

        // Also get a sample row
        const sampleQuery = `SELECT TOP 1 * FROM [${fullTableName}]`;
        const sampleCommand = buildSqlcmdCommand(sampleQuery);
        const { stdout: sampleOutput } = await execPromise(sampleCommand);
        console.log('\nSample row:');
        console.log(sampleOutput);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkTableStructure();
