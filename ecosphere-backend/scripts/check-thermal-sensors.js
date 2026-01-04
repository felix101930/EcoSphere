// Check which thermal sensors actually have data
const { execSync } = require('child_process');
const path = require('path');

const SQLCMD_PATH = 'C:\\Program Files\\Microsoft SQL Server\\Client SDK\\ODBC\\170\\Tools\\Binn\\sqlcmd.exe';

function runQuery(query) {
    try {
        const command = `"${SQLCMD_PATH}" -S .\\SQLEXPRESS -d TestSlimDB -E -C -Q "${query}" -h -1 -W -s ","`;
        const result = execSync(command, { encoding: 'utf-8' });
        return result.trim().split('\n').filter(line => line.trim());
    } catch (error) {
        console.error('Query error:', error.message);
        return [];
    }
}

console.log('='.repeat(60));
console.log('Checking Thermal Sensor Tables');
console.log('='.repeat(60));

// Get all thermal tables
const query = "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE 'SaitSolarLab_2000%_TL%' ORDER BY TABLE_NAME";
const tables = runQuery(query);

console.log(`\nFound ${tables.length} thermal tables:\n`);

tables.forEach((table, index) => {
    const tableName = table.trim();
    if (tableName) {
        // Extract sensor ID (e.g., 20004_TL2 from SaitSolarLab_20004_TL2)
        const match = tableName.match(/SaitSolarLab_(2\d{4}_TL\d+)/);
        if (match) {
            const sensorId = match[1];

            // Check if table has data in our date range
            const countQuery = `SELECT COUNT(*) FROM [${tableName}] WHERE CONVERT(varchar, ts, 23) >= '2020-11-01' AND CONVERT(varchar, ts, 23) <= '2020-11-08'`;
            const countResult = runQuery(countQuery);
            const count = countResult[0] ? parseInt(countResult[0].trim()) : 0;

            console.log(`${index + 1}. ${sensorId.padEnd(15)} - ${count.toString().padStart(6)} records (2020-11-01 to 2020-11-08)`);
        }
    }
});

console.log('\n' + '='.repeat(60));
console.log('Grouping by floor (based on naming pattern):');
console.log('='.repeat(60));

const basement = tables.filter(t => t.includes('_TL2'));
const level1 = tables.filter(t => t.includes('_TL5'));
const level2 = tables.filter(t => t.includes('_TL8'));

console.log(`\nBasement (TL2): ${basement.length} sensors`);
basement.forEach(t => {
    const match = t.match(/SaitSolarLab_(2\d{4}_TL\d+)/);
    if (match) console.log(`  - ${match[1]}`);
});

console.log(`\nLevel 1 (TL5): ${level1.length} sensors`);
level1.forEach(t => {
    const match = t.match(/SaitSolarLab_(2\d{4}_TL\d+)/);
    if (match) console.log(`  - ${match[1]}`);
});

console.log(`\nLevel 2 (TL8): ${level2.length} sensors`);
level2.forEach(t => {
    const match = t.match(/SaitSolarLab_(2\d{4}_TL\d+)/);
    if (match) console.log(`  - ${match[1]}`);
});

console.log('\n' + '='.repeat(60));
