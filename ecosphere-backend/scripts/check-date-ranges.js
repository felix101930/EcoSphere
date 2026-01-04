// Check actual date ranges in database
const ElectricityService = require('../services/electricityService');
const WaterService = require('../services/waterService');

async function checkDateRanges() {
    console.log('='.repeat(60));
    console.log('Checking Available Date Ranges');
    console.log('='.repeat(60));

    try {
        // Check Electricity
        console.log('\n📊 ELECTRICITY:');
        const elecRange = await ElectricityService.getAvailableDateRange();
        console.log(`   Consumption: ${elecRange.consumption.minDate} to ${elecRange.consumption.maxDate}`);
        console.log(`   Generation: ${elecRange.generation.minDate} to ${elecRange.generation.maxDate}`);
        console.log(`   Net Energy: ${elecRange.netEnergy.minDate} to ${elecRange.netEnergy.maxDate}`);

        // Check Water
        console.log('\n💧 WATER:');
        const waterRange = await WaterService.getAvailableDateRange();
        console.log(`   Rainwater: ${waterRange.rainwater.minDate} to ${waterRange.rainwater.maxDate}`);
        console.log(`   Hot Water: ${waterRange.hotWater.minDate} to ${waterRange.hotWater.maxDate}`);

        console.log('\n' + '='.repeat(60));
        console.log('✅ Date range check completed!');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('\n❌ Error:', error);
        process.exit(1);
    }
}

checkDateRanges();
