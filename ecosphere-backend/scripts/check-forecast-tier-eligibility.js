/**
 * Check Forecast Tier Eligibility
 * 
 * This script checks if the database has enough data to qualify for Tier 1 forecast algorithm.
 * 
 * Tier 1 Requirements:
 * - At least 1 year of data (365 days × 24 hours = 8760 data points)
 * - Data completeness score ≥ 70% FOR RECENT 2 YEARS (not entire history)
 */

const { execSync } = require('child_process');
const { buildSqlcmdCommand, TABLE_NAMES } = require('../config/database');

const MS_PER_HOUR = 1000 * 60 * 60;
const HOURS_PER_DAY = 24;
const DAYS_PER_YEAR = 365;
const MIN_COMPLETENESS_SCORE = 70; // For recent 2-year period
const RECENT_PERIOD_DAYS = 2 * DAYS_PER_YEAR; // Check last 2 years only

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

function checkTableData(tableName, dataType) {
    console.log(`  Table: ${tableName}`);

    // Get total count
    const countOutput = executeQuery(`SELECT COUNT(*) as total_count FROM ${tableName}`);
    if (!countOutput) {
        console.log('  ❌ Failed to get count\n');
        return;
    }
    const totalCount = parseInt(countOutput.split('\n')[0].trim());

    // Get date range
    const rangeOutput = executeQuery(`SELECT MIN(ts) as earliest_date, MAX(ts) as latest_date FROM ${tableName}`);
    if (!rangeOutput) {
        console.log('  ❌ Failed to get date range\n');
        return;
    }
    const rangeParts = rangeOutput.split('\n')[0].split(',');
    const earliest_date = rangeParts[0].trim();
    const latest_date = rangeParts[1].trim();

    // Calculate time span for entire history
    const earliestDate = new Date(earliest_date);
    const latestDate = new Date(latest_date);
    const totalHours = (latestDate - earliestDate) / MS_PER_HOUR;
    const totalDays = totalHours / HOURS_PER_DAY;
    const totalYears = totalDays / DAYS_PER_YEAR;

    // Calculate RECENT 2-year period completeness (what Tier 1 actually checks)
    const recentStartDate = new Date(latestDate);
    recentStartDate.setDate(recentStartDate.getDate() - RECENT_PERIOD_DAYS);
    const recentStartStr = recentStartDate.toISOString().split('T')[0];
    const recentEndStr = latestDate.toISOString().split('T')[0];

    const recentCountOutput = executeQuery(
        `SELECT COUNT(*) FROM ${tableName} WHERE ts >= '${recentStartStr}' AND ts <= '${recentEndStr}'`
    );
    const recentCount = recentCountOutput ? parseInt(recentCountOutput.split('\n')[0].trim()) : 0;
    const expectedRecentPoints = RECENT_PERIOD_DAYS * HOURS_PER_DAY;
    const recentCompletenessScore = expectedRecentPoints > 0
        ? Math.min(100, Math.round((recentCount / expectedRecentPoints) * 100))
        : 0;

    // Calculate overall completeness (for reference)
    const expectedPoints = Math.floor(totalHours);
    const overallCompletenessScore = expectedPoints > 0
        ? Math.min(100, Math.round((totalCount / expectedPoints) * 100))
        : 0;

    // Check Tier 1 eligibility
    const requiredPoints = DAYS_PER_YEAR * HOURS_PER_DAY;
    const hasOneYearCycle = totalCount >= requiredPoints;
    const meetsCompletenessThreshold = recentCompletenessScore >= MIN_COMPLETENESS_SCORE;
    const qualifiesForTier1 = hasOneYearCycle && meetsCompletenessThreshold;

    // Display results
    console.log(`  Full Date Range: ${earliest_date} to ${latest_date}`);
    console.log(`  Full Time Span: ${totalDays.toFixed(1)} days (${totalYears.toFixed(2)} years)`);
    console.log(`  Total Data Points: ${totalCount.toLocaleString()}`);
    console.log(`  Overall Completeness: ${overallCompletenessScore}% (entire history)`);
    console.log('');
    console.log(`  📊 RECENT 2-YEAR PERIOD (${recentStartStr} to ${recentEndStr}):`);
    console.log(`    Data Points: ${recentCount.toLocaleString()} / ${expectedRecentPoints.toLocaleString()}`);
    console.log(`    Completeness: ${recentCompletenessScore}% ⭐ (This is what Tier 1 checks)`);
    console.log('');

    // Tier 1 Requirements Check
    console.log('  📋 Tier 1 Requirements:');
    console.log(`    ✓ Minimum Data Points: ${requiredPoints.toLocaleString()} (1 year)`);
    console.log(`    ${hasOneYearCycle ? '✅' : '❌'} Has One Year Cycle: ${hasOneYearCycle ? 'YES' : 'NO'} (${totalCount.toLocaleString()} points)`);
    console.log(`    ✓ Minimum Completeness (Recent 2 Years): ${MIN_COMPLETENESS_SCORE}%`);
    console.log(`    ${meetsCompletenessThreshold ? '✅' : '❌'} Meets Completeness: ${meetsCompletenessThreshold ? 'YES' : 'NO'} (${recentCompletenessScore}%)`);
    console.log('');

    if (qualifiesForTier1) {
        console.log(`  🎉 ${dataType} QUALIFIES FOR TIER 1 (Holt-Winters Algorithm)`);
    } else {
        console.log(`  ⚠️  ${dataType} DOES NOT QUALIFY FOR TIER 1`);
        console.log('');
        console.log('  📝 Reasons:');
        if (!hasOneYearCycle) {
            const needed = requiredPoints - totalCount;
            const neededDays = needed / HOURS_PER_DAY;
            console.log(`    • Need ${needed.toLocaleString()} more data points (${neededDays.toFixed(1)} more days)`);
        }
        if (!meetsCompletenessThreshold) {
            const gap = MIN_COMPLETENESS_SCORE - recentCompletenessScore;
            console.log(`    • Recent 2-year completeness is ${gap}% below threshold`);
            console.log(`    • Missing approximately ${(expectedRecentPoints - recentCount).toLocaleString()} data points in recent period`);
        }
    }

    // Check for data gaps in recent period
    console.log('');
    console.log('  🔍 Checking for data gaps in recent 2-year period...');
    const gapQuery = `
        WITH gaps AS (
            SELECT 
                ts as current_ts,
                LAG(ts) OVER (ORDER BY ts) as prev_ts,
                DATEDIFF(HOUR, LAG(ts) OVER (ORDER BY ts), ts) as hours_gap
            FROM ${tableName}
            WHERE ts >= '${recentStartStr}' AND ts <= '${recentEndStr}'
        )
        SELECT TOP 5
            prev_ts,
            current_ts,
            hours_gap
        FROM gaps
        WHERE hours_gap > 24
        ORDER BY hours_gap DESC
    `;

    const gapOutput = executeQuery(gapQuery);
    if (gapOutput) {
        const gapLines = gapOutput.split('\n').filter(line => line.trim() && !line.includes('prev_ts'));
        if (gapLines.length > 0) {
            console.log(`  Found ${gapLines.length} significant gaps (>24 hours) in recent period:`);
            gapLines.forEach((line, index) => {
                const parts = line.split(',');
                if (parts.length >= 3) {
                    const prev = parts[0].trim();
                    const curr = parts[1].trim();
                    const hours = parseInt(parts[2].trim());
                    const days = (hours / 24).toFixed(1);
                    console.log(`    ${index + 1}. ${prev} → ${curr} (${days} days)`);
                }
            });
        } else {
            console.log('  ✅ No significant gaps found in recent period');
        }
    }
    console.log('');
}

function main() {
    console.log('🔍 Checking Forecast Tier Eligibility...\n');
    console.log('ℹ️  Note: Tier 1 checks completeness of RECENT 2 YEARS, not entire history\n');

    // Check Consumption data (TL341)
    console.log('📊 Consumption Data (TL341):');
    checkTableData(TABLE_NAMES.CONSUMPTION, 'Consumption');

    console.log('='.repeat(80) + '\n');

    // Check Generation data (TL340)
    console.log('📊 Generation Data (TL340):');
    checkTableData(TABLE_NAMES.GENERATION, 'Generation');

    console.log('✅ Check complete');
}

main();
