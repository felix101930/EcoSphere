// Check Hot Water actual values to understand the range
const WaterService = require('../services/waterService');

async function checkHotWaterValues() {
    console.log('🔍 Checking Hot Water Actual Values\n');
    console.log('='.repeat(60));

    try {
        // Get recent data
        const dateFrom = '2025-12-01';
        const dateTo = '2025-12-31';

        console.log(`📅 Fetching data from ${dateFrom} to ${dateTo}\n`);

        const data = await WaterService.getHotWaterConsumptionData(dateFrom, dateTo);

        if (!data || data.length === 0) {
            console.error('❌ No data found!');
            process.exit(1);
        }

        console.log(`✅ Retrieved ${data.length} data points\n`);

        // Calculate statistics
        const values = data.map(d => d.value);
        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / values.length;
        const max = Math.max(...values);
        const min = Math.min(...values);
        const median = values.sort((a, b) => a - b)[Math.floor(values.length / 2)];

        console.log('📊 Value Statistics:');
        console.log('='.repeat(60));
        console.log(`   Average:  ${avg.toFixed(2)} L/h`);
        console.log(`   Median:   ${median.toFixed(2)} L/h`);
        console.log(`   Max:      ${max.toFixed(2)} L/h`);
        console.log(`   Min:      ${min.toFixed(2)} L/h`);

        // Show sample values
        console.log(`\n📋 Sample Values (first 20):`);
        data.slice(0, 20).forEach((point, idx) => {
            console.log(`   ${idx + 1}. ${point.ts}: ${point.value.toFixed(2)} L/h`);
        });

        // Check for outliers
        const outliers = values.filter(v => v > avg * 3);
        console.log(`\n⚠️  Outliers (> 3x average):`);
        console.log(`   Count: ${outliers.length}`);
        if (outliers.length > 0) {
            console.log(`   Values: ${outliers.slice(0, 10).map(v => v.toFixed(2)).join(', ')}`);
        }

        console.log('\n' + '='.repeat(60));

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkHotWaterValues();
