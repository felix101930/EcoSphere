// Analyze Hot Water data to understand the values
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function analyzeHotWaterData() {
    console.log('🔍 Analyzing Hot Water Data (TL210)\n');
    console.log('='.repeat(60));

    try {
        // Get a sample of data from one day
        const query = `
            SELECT TOP 100
                CONVERT(varchar, ts, 120) as ts,
                value
            FROM [SaitSolarLab_30000_TL210]
            WHERE CONVERT(varchar, ts, 23) = '2025-12-25'
            ORDER BY ts
        `;

        const command = `sqlcmd -S .\\SQLEXPRESS -d EcoSphereData -E -Q "${query}" -h -1 -s "," -W`;

        const { stdout } = await execPromise(command);
        const lines = stdout.trim().split('\n').filter(line => line.trim() && !line.includes('rows affected'));

        console.log('📅 Sample Data from 2025-12-25 (first 100 records):\n');
        console.log('Time                | Value (L/h)');
        console.log('-'.repeat(60));

        const values = [];
        lines.forEach((line, idx) => {
            const parts = line.split(',').map(p => p.trim());
            if (parts.length >= 2 && idx < 20) {
                console.log(`${parts[0]} | ${parts[1]}`);
            }
            if (parts.length >= 2) {
                values.push(parseFloat(parts[1]));
            }
        });

        // Statistics
        console.log('\n📊 Statistics:');
        console.log('='.repeat(60));
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const max = Math.max(...values);
        const min = Math.min(...values);
        const zeros = values.filter(v => v === 0 || v < 20).length;

        console.log(`   Average:      ${avg.toFixed(2)} L/h`);
        console.log(`   Max:          ${max.toFixed(2)} L/h`);
        console.log(`   Min:          ${min.toFixed(2)} L/h`);
        console.log(`   Zero/Low (<20): ${zeros} out of ${values.length} (${(zeros / values.length * 100).toFixed(1)}%)`);

        // Check for patterns
        console.log('\n🔍 Pattern Analysis:');
        console.log('='.repeat(60));

        // Count consecutive non-zero values
        let consecutiveNonZero = 0;
        let maxConsecutive = 0;
        values.forEach(v => {
            if (v >= 20) {
                consecutiveNonZero++;
                maxConsecutive = Math.max(maxConsecutive, consecutiveNonZero);
            } else {
                consecutiveNonZero = 0;
            }
        });

        console.log(`   Max consecutive usage: ${maxConsecutive} minutes`);
        console.log(`   Usage pattern: ${zeros > values.length * 0.5 ? 'Intermittent (lots of zeros)' : 'Continuous'}`);

        // Get peak usage time
        console.log('\n⏰ Peak Usage Analysis:');
        console.log('='.repeat(60));
        const query2 = `
            SELECT TOP 10
                CONVERT(varchar, ts, 120) as ts,
                value
            FROM [SaitSolarLab_30000_TL210]
            WHERE CONVERT(varchar, ts, 23) = '2025-12-25'
            ORDER BY value DESC
        `;

        const command2 = `sqlcmd -S .\\SQLEXPRESS -d EcoSphereData -E -Q "${query2}" -h -1 -s "," -W`;
        const { stdout: stdout2 } = await execPromise(command2);
        const lines2 = stdout2.trim().split('\n').filter(line => line.trim() && !line.includes('rows affected'));

        console.log('   Top 10 highest values:');
        lines2.forEach((line, idx) => {
            const parts = line.split(',').map(p => p.trim());
            if (parts.length >= 2) {
                console.log(`   ${idx + 1}. ${parts[0]}: ${parts[1]} L/h`);
            }
        });

        console.log('\n' + '='.repeat(60));

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

analyzeHotWaterData();
