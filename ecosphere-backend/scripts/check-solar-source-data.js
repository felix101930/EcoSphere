// Check Solar Source data availability
const { buildSqlcmdCommand, filterOutputLines } = require('../config/database');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function checkSolarSourceData() {
    console.log('Checking Solar Source data availability...\n');

    // Check TL252 (Carport) date range
    const query1 = "SELECT MIN(CONVERT(varchar, ts, 23)) as minDate, MAX(CONVERT(varchar, ts, 23)) as maxDate FROM [SaitSolarLab_30000_TL252]";
    const cmd1 = buildSqlcmdCommand(query1);

    try {
        const { stdout: stdout1 } = await execPromise(cmd1);
        const lines1 = filterOutputLines(stdout1);
        console.log('TL252 (Carport) date range:', lines1[0]);
    } catch (err) {
        console.error('Error checking TL252:', err.message);
    }

    // Check TL253 (Rooftop) date range
    const query2 = "SELECT MIN(CONVERT(varchar, ts, 23)) as minDate, MAX(CONVERT(varchar, ts, 23)) as maxDate FROM [SaitSolarLab_30000_TL253]";
    const cmd2 = buildSqlcmdCommand(query2);

    try {
        const { stdout: stdout2 } = await execPromise(cmd2);
        const lines2 = filterOutputLines(stdout2);
        console.log('TL253 (Rooftop) date range:', lines2[0]);
    } catch (err) {
        console.error('Error checking TL253:', err.message);
    }

    // Check count for 2025-12-24 to 2025-12-31
    console.log('\nChecking data for 2025-12-24 to 2025-12-31:');

    const query3 = "SELECT COUNT(*) as count FROM [SaitSolarLab_30000_TL252] WHERE ts >= '2025-12-24' AND ts <= '2025-12-31'";
    const cmd3 = buildSqlcmdCommand(query3);

    try {
        const { stdout: stdout3 } = await execPromise(cmd3);
        const lines3 = filterOutputLines(stdout3);
        console.log('TL252 (Carport) count:', lines3[0]);
    } catch (err) {
        console.error('Error checking TL252 count:', err.message);
    }

    const query4 = "SELECT COUNT(*) as count FROM [SaitSolarLab_30000_TL253] WHERE ts >= '2025-12-24' AND ts <= '2025-12-31'";
    const cmd4 = buildSqlcmdCommand(query4);

    try {
        const { stdout: stdout4 } = await execPromise(cmd4);
        const lines4 = filterOutputLines(stdout4);
        console.log('TL253 (Rooftop) count:', lines4[0]);
    } catch (err) {
        console.error('Error checking TL253 count:', err.message);
    }

    // Check sample data
    console.log('\nSample data from TL252 (first 5 rows in date range):');
    const query5 = "SELECT TOP 5 CONVERT(varchar, ts, 120) as ts, value FROM [SaitSolarLab_30000_TL252] WHERE ts >= '2025-12-24' AND ts <= '2025-12-31' ORDER BY ts";
    const cmd5 = buildSqlcmdCommand(query5);

    try {
        const { stdout: stdout5 } = await execPromise(cmd5);
        const lines5 = filterOutputLines(stdout5);
        lines5.forEach(line => console.log(line));
    } catch (err) {
        console.error('Error checking TL252 sample:', err.message);
    }

    console.log('\nSample data from TL253 (first 5 rows in date range):');
    const query6 = "SELECT TOP 5 CONVERT(varchar, ts, 120) as ts, value FROM [SaitSolarLab_30000_TL253] WHERE ts >= '2025-12-24' AND ts <= '2025-12-31' ORDER BY ts";
    const cmd6 = buildSqlcmdCommand(query6);

    try {
        const { stdout: stdout6 } = await execPromise(cmd6);
        const lines6 = filterOutputLines(stdout6);
        lines6.forEach(line => console.log(line));
    } catch (err) {
        console.error('Error checking TL253 sample:', err.message);
    }
}

checkSolarSourceData();
