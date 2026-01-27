// Simple script to check Phase data characteristics
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const { buildSqlcmdCommand } = require('../config/database');

async function checkPhaseData() {
    console.log('Checking Phase A data (TL343)...\n');

    // Get 10 consecutive records
    const query = `SELECT TOP 10 CONVERT(varchar, ts, 120) as ts, value FROM [SaitSolarLab_30000_TL343] WHERE ts >= '2020-11-01' ORDER BY ts`;

    const command = buildSqlcmdCommand(query);

    try {
        const { stdout } = await execPromise(command);
        console.log('Raw output:');
        console.log(stdout);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkPhaseData();
