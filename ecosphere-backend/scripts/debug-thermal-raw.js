/**
 * Debug Thermal Raw Output
 * Check raw sqlcmd output to understand encoding/parsing issues
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const { buildSqlcmdCommand, getFullTableName } = require('../config/database');

async function debugRawOutput() {
    console.log('=== Debug Thermal Raw Output ===\n');

    const sensorId = '20004_TL2';
    const fullTableName = getFullTableName(sensorId);

    console.log(`Sensor ID: ${sensorId}`);
    console.log(`Full table name: ${fullTableName}\n`);

    // Simple query
    const query = `SELECT TOP 3 seq, CONVERT(varchar, ts, 120) as ts, value FROM [${fullTableName}] WHERE CONVERT(varchar, ts, 23) = '2024-06-02' ORDER BY ts`;
    const command = buildSqlcmdCommand(query);

    console.log('Command:');
    console.log(command);
    console.log('');

    try {
        const { stdout, stderr } = await execPromise(command);

        console.log('=== STDOUT ===');
        console.log(stdout);
        console.log('=== END STDOUT ===\n');

        if (stderr) {
            console.log('=== STDERR ===');
            console.log(stderr);
            console.log('=== END STDERR ===\n');
        }

        // Show first 200 bytes in hex
        console.log('First 200 bytes (hex):');
        console.log(Buffer.from(stdout).toString('hex').substring(0, 400));
        console.log('');

        // Try splitting by lines
        console.log('Lines:');
        const lines = stdout.split('\n');
        lines.forEach((line, i) => {
            console.log(`Line ${i}: [${line}]`);
        });

    } catch (error) {
        console.error('Error:', error.message);
    }
}

debugRawOutput();
