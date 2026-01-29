/**
 * Check Thermal Tables in Database
 * 
 * Purpose: Verify thermal sensor table names in EcoSphereData database
 * Expected tables: 13 thermal sensors (20004-20016)
 * 
 * Usage: node ecosphere-backend/scripts/check-thermal-tables.js
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const { buildSqlcmdCommand } = require('../config/database');

async function checkThermalTables() {
    console.log('=== Checking Thermal Tables in EcoSphereData ===\n');

    // Query to list all tables that contain thermal sensor patterns
    const query = `
    SELECT TABLE_NAME 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_TYPE = 'BASE TABLE' 
    AND (
      TABLE_NAME LIKE '%20004%' OR
      TABLE_NAME LIKE '%20005%' OR
      TABLE_NAME LIKE '%20006%' OR
      TABLE_NAME LIKE '%20007%' OR
      TABLE_NAME LIKE '%20008%' OR
      TABLE_NAME LIKE '%20009%' OR
      TABLE_NAME LIKE '%20010%' OR
      TABLE_NAME LIKE '%20011%' OR
      TABLE_NAME LIKE '%20012%' OR
      TABLE_NAME LIKE '%20013%' OR
      TABLE_NAME LIKE '%20014%' OR
      TABLE_NAME LIKE '%20015%' OR
      TABLE_NAME LIKE '%20016%'
    )
    ORDER BY TABLE_NAME
  `;

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
                    !trimmed.includes('Msg ');
            });

        console.log(`Found ${lines.length} thermal tables:\n`);

        lines.forEach((tableName, index) => {
            console.log(`${index + 1}. ${tableName.trim()}`);
        });

        // Check expected sensors
        console.log('\n=== Expected Thermal Sensors ===\n');
        const expectedSensors = [
            { id: '20004_TL2', location: 'Basement - Sensor 1' },
            { id: '20005_TL2', location: 'Basement - Sensor 2' },
            { id: '20006_TL2', location: 'Basement - Sensor 3' },
            { id: '20007_TL2', location: 'Level 1 - Sensor 1' },
            { id: '20008_TL2', location: 'Level 1 - Sensor 2' },
            { id: '20009_TL2', location: 'Level 1 - Sensor 3' },
            { id: '20010_TL2', location: 'Level 1 - Sensor 4' },
            { id: '20011_TL2', location: 'Level 1 - Sensor 5' },
            { id: '20012_TL2', location: 'Level 2 - Sensor 1' },
            { id: '20013_TL2', location: 'Level 2 - Sensor 2' },
            { id: '20014_TL2', location: 'Level 2 - Sensor 3' },
            { id: '20015_TL2', location: 'Level 2 - Sensor 4' },
            { id: '20016_TL2', location: 'Level 2 - Sensor 5' }
        ];

        expectedSensors.forEach(sensor => {
            const withPrefix = `SaitSolarLab_${sensor.id}`;
            const foundWithPrefix = lines.some(line => line.trim() === withPrefix);
            const foundWithoutPrefix = lines.some(line => line.trim() === sensor.id);

            if (foundWithPrefix) {
                console.log(`✓ ${sensor.location}: ${withPrefix}`);
            } else if (foundWithoutPrefix) {
                console.log(`⚠ ${sensor.location}: ${sensor.id} (NO PREFIX)`);
            } else {
                console.log(`✗ ${sensor.location}: NOT FOUND`);
            }
        });

        // Sample data check for first sensor
        console.log('\n=== Sample Data Check (First Sensor) ===\n');

        if (lines.length > 0) {
            const firstTable = lines[0].trim();
            const sampleQuery = `SELECT TOP 5 ts, value FROM [${firstTable}] ORDER BY ts DESC`;
            const sampleCommand = buildSqlcmdCommand(sampleQuery);

            try {
                const { stdout: sampleOutput } = await execPromise(sampleCommand);
                console.log(`Table: ${firstTable}`);
                console.log('Latest 5 records:');
                console.log(sampleOutput);
            } catch (err) {
                console.error('Error fetching sample data:', err.message);
            }
        }

    } catch (error) {
        console.error('Error checking thermal tables:', error.message);
        process.exit(1);
    }
}

checkThermalTables();
