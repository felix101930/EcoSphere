// Check Nov 8 data completeness
const ElectricityService = require('../services/electricityService');

async function testNov8Data() {
    try {
        console.log('Checking Nov 8, 2020 data completeness...\n');

        const data = await ElectricityService.getConsumptionData('2020-11-08', '2020-11-08');

        console.log(`Total data points: ${data.length}`);
        console.log(`Expected: 24 (full day)\n`);

        if (data.length > 0) {
            console.log('All records:');
            data.forEach(d => {
                console.log(`  ${d.ts}: ${d.value} Wh`);
            });

            const total = data.reduce((sum, d) => sum + Math.abs(d.value), 0);
            console.log(`\n📊 Total: ${total.toFixed(2)} Wh`);
            console.log(`📊 This is only ${data.length} hours of data, not a full day!`);
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testNov8Data();
