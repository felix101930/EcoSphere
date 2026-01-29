/**
 * Check Thermal Data Range
 * 
 * Purpose: Verify actual data range in thermal sensor tables
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const { buildSqlcmdCommand, getFullTableName } = require('../config/database');

async function checkDataRange() {
    console.log('=== Checking Thermal Data Range ===\n');

    const sensorIds = [
        '20004_TL2', '20005_TL2', '20006_TL2',  // Basement
        '20007_TL2', '20008_TL2', '20009_TL2', '20010_TL2', '20011_TL2',  // Level 1
        '20012_TL2', '20013_TL2', '20014_TL2', '20015_TL2', '20016_TL2'   // Level 2
    ];

    for (const sensorId of sensorIds) {
        const fullTableName = getFullTableName(sensorId);

        // Query to get min and max dates
        const query = `SELECT MIN(CONVERT(varchar, ts, 23)) as minDate, MAX(CONVERT(varchar, ts, 23)) as maxDate, COUNT(*) as totalRecords FROM [${fullTableName}]`;
        const command = buildSqlcmdCommand(query);

        try {
            const { stdout } = await execPromise(command);

            // Parse output
            const lines = stdout.trim().split('\n')
                .filter(line => {
                    const trimmed = line.trim();
                    return trimmed &&
                        !trimmed.includes('rows affected') &&
                        !trimmed.startsWith('(') &&
                        !trimmed.startsWith('-');
                });

            if (lines.length > 0) {
                const parts = lines[0].split(',').map(p => p.trim());
                if (parts.length >= 3) {
                    console.log(`${sensorId}:`);
                    console.log(`  Min Date: ${parts[0]}`);
                    console.log(`  Max Date: ${parts[1]}`);
                    console.log(`  Total Records: ${parts[2]}`);
                    console.log('');
                }
            }
        } catch (error) {
            console.error(`Error checking ${sensorId}:`, error.message);
        }
    }
}

checkDataRange();
