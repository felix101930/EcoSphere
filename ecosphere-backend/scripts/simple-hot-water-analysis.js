// Simple Hot Water data analysis
const WaterService = require('../services/waterService');

async function analyzeHotWater() {
    console.log('🔍 Analyzing Hot Water Data Pattern\n');
    console.log('='.repeat(60));

    try {
        // Get one day of data
        const data = await WaterService.getHotWaterConsumptionData('2025-12-25', '2025-12-25');

        console.log(`✅ Retrieved ${data.length} data points for 2025-12-25\n`);

        // Show first 30 records
        console.log('📋 First 30 records:');
        console.log('Time                | Value (L/h)');
        console.log('-'.repeat(60));
        data.slice(0, 30).forEach(d => {
            console.log(`${d.ts} | ${d.value.toFixed(2)}`);
        });

        // Statistics
        const values = data.map(d => d.value);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const max = Math.max(...values);
        const min = Math.min(...values);
        const zeros = values.filter(v => v < 20).length;

        console.log('\n📊 Statistics:');
        console.log('='.repeat(60));
        console.log(`   Total records:  ${data.length}`);
        console.log(`   Average:        ${avg.toFixed(2)} L/h`);
        console.log(`   Max:            ${max.toFixed(2)} L/h`);
        console.log(`   Min:            ${min.toFixed(2)} L/h`);
        console.log(`   Low usage (<20): ${zeros} (${(zeros / data.length * 100).toFixed(1)}%)`);

        // Find peak times
        const sorted = [...data].sort((a, b) => b.value - a.value);
        console.log('\n⏰ Top 10 Peak Usage Times:');
        console.log('='.repeat(60));
        sorted.slice(0, 10).forEach((d, idx) => {
            console.log(`   ${idx + 1}. ${d.ts}: ${d.value.toFixed(2)} L/h`);
        });

        // Calculate if data is continuous or intermittent
        let consecutiveUsage = 0;
        let maxConsecutive = 0;
        values.forEach(v => {
            if (v >= 20) {
                consecutiveUsage++;
                maxConsecutive = Math.max(maxConsecutive, consecutiveUsage);
            } else {
                consecutiveUsage = 0;
            }
        });

        console.log('\n🔍 Usage Pattern:');
        console.log('='.repeat(60));
        console.log(`   Max consecutive usage: ${maxConsecutive} minutes`);
        console.log(`   Pattern: ${zeros > data.length * 0.5 ? 'Intermittent (lots of idle time)' : 'Continuous'}`);

        console.log('\n' + '='.repeat(60));

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

analyzeHotWater();
