/**
 * Check 2024-2025 Data Distribution
 * Verify data availability for the period that forecast actually uses
 */

const { execSync } = require('child_process');
const { buildSqlcmdCommand, TABLE_NAMES } = require('../config/database');

function executeQuery(query) {
    try {
        const cmd = buildSqlcmdCommand(query);
        const output = execSync(cmd, { encoding: 'utf8' });
        return output.trim();
    } catch (error) {
        console.error('Query error:', error.message);
        return null;
    }
}

function checkYearlyData(tableName, year) {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const countOutput = executeQuery(
        `SELECT COUNT(*) FROM ${tableName} WHERE ts >= '${startDate}' AND ts <= '${endDate}'`
    );

    const count = countOutput ? parseInt(countOutput.split('\n')[0].trim()) : 0;
    const expectedPoints = 365 * 24; // 8760 for a full year
    const completeness = Math.round((count / expectedPoints) * 100);

    return { year, count, expectedPoints, completeness };
}

function checkMonthlyData(tableName, year) {
    console.log(`\n  Monthly breakdown for ${year}:`);

    for (let month = 1; month <= 12; month++) {
        const monthStr = String(month).padStart(2, '0');
        const startDate = `${year}-${monthStr}-01`;

        // Calculate days in month
        const daysInMonth = new Date(year, month, 0).getDate();
        const nextMonth = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`;

        const countOutput = executeQuery(
            `SELECT COUNT(*) FROM ${tableName} WHERE ts >= '${startDate}' AND ts < '${nextMonth}'`
        );

        const count = countOutput ? parseInt(countOutput.split('\n')[0].trim()) : 0;
        const expectedPoints = daysInMonth * 24;
        const completeness = Math.round((count / expectedPoints) * 100);

        const status = completeness >= 90 ? '✅' : completeness >= 70 ? '⚠️' : '❌';
        console.log(`    ${status} ${year}-${monthStr}: ${count.toLocaleString()} / ${expectedPoints} (${completeness}%)`);
    }
}

function main() {
    console.log('🔍 Checking 2024-2025 Data Distribution\n');

    const tableName = TABLE_NAMES.CONSUMPTION;
    console.log(`📊 Table: ${tableName}\n`);

    // Check 2024
    console.log('📅 Year 2024:');
    const data2024 = checkYearlyData(tableName, 2024);
    console.log(`  Total: ${data2024.count.toLocaleString()} / ${data2024.expectedPoints.toLocaleString()} (${data2024.completeness}%)`);
    checkMonthlyData(tableName, 2024);

    // Check 2025
    console.log('\n📅 Year 2025:');
    const data2025 = checkYearlyData(tableName, 2025);
    console.log(`  Total: ${data2025.count.toLocaleString()} / ${data2025.expectedPoints.toLocaleString()} (${data2025.completeness}%)`);
    checkMonthlyData(tableName, 2025);

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('\n📊 Summary:');
    console.log(`  2024: ${data2024.completeness}% complete`);
    console.log(`  2025: ${data2025.completeness}% complete`);
    console.log(`  Combined 2024-2025: ${Math.round(((data2024.count + data2025.count) / (data2024.expectedPoints + data2025.expectedPoints)) * 100)}%`);

    console.log('\n✅ Check complete');
}

main();
