// Test script to check Nov 3, 2020 consumption total
const ElectricityService = require('../services/electricityService');

async function testNov3Consumption() {
    try {
        console.log('Testing Nov 3, 2020 consumption data...\n');

        // Get Nov 3 data
        const data = await ElectricityService.getConsumptionData('2020-11-03', '2020-11-03');

        console.log(`Total data points: ${data.length}`);
        console.log(`Expected: 24 (hourly data)\n`);

        if (data.length > 0) {
            console.log('First 5 records:');
            data.slice(0, 5).forEach(d => {
                console.log(`  ${d.ts}: ${d.value} Wh`);
            });

            console.log('\nLast 5 records:');
            data.slice(-5).forEach(d => {
                console.log(`  ${d.ts}: ${d.value} Wh`);
            });

            // Calculate daily total
            const dailyTotal = data.reduce((sum, d) => sum + Math.abs(d.value), 0);
            console.log(`\n📊 Daily Total Consumption: ${dailyTotal.toFixed(2)} Wh`);
            console.log(`📊 Daily Total Consumption: ${(dailyTotal / 1000).toFixed(2)} kWh`);

            // Calculate average hourly
            const avgHourly = dailyTotal / data.length;
            console.log(`\n📊 Average Hourly: ${avgHourly.toFixed(2)} Wh/hour`);
        } else {
            console.log('❌ No data found for Nov 3, 2020');
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testNov3Consumption();
