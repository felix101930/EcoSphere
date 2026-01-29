/**
 * Simple Thermal Table Check
 * 
 * Purpose: List all tables in EcoSphereData database
 * Then check which ones are thermal sensors
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const { buildSqlcmdCommand } = require('../config/database');

async function checkTables() {
    console.log('=== Listing All Tables in EcoSphereData ===\n');

    // Simple query to list all tables
    const query = `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME`;
    const command = buildSqlcmdCommand(query);

    try {
        const { stdout } = await execPromise(command);

        console.log('Raw output:');
        console.log(stdout);
        console.log('\n=== Filtering for thermal sensors (2000X) ===\n');

        const lines = stdout.split('\n');
        const thermalTables = lines.filter(line => {
            const trimmed = line.trim();
            return trimmed.includes('2000') || trimmed.includes('2001');
        });

        console.log('Thermal-related lines:');
        thermalTables.forEach(line => console.log(line));

    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkTables();
