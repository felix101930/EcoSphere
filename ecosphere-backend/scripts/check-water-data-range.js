// Check Water module data range
const WaterService = require('../services/waterService');

async function checkWaterDataRange() {
    console.log('🔍 Checking Water Module Data Range\n');
    console.log('='.repeat(60));

    try {
        // Check Rainwater (TL93)
        console.log('\n💧 Rainwater Level (TL93):');
        const rainwaterRange = await WaterService.getAvailableDateRange('SaitSolarLab_30000_TL93');
        if (rainwaterRange) {
            console.log(`   Min Date: ${rainwaterRange.minDate}`);
            console.log(`   Max Date: ${rainwaterRange.maxDate}`);

            const minDate = new Date(rainwaterRange.minDate);
            const maxDate = new Date(rainwaterRange.maxDate);
            const daysDiff = Math.floor((maxDate - minDate) / (1000 * 60 * 60 * 24));
            const yearsDiff = (daysDiff / 365).toFixed(2);

            console.log(`   Duration: ${daysDiff} days (${yearsDiff} years)`);
            console.log(`   Has 2+ years: ${daysDiff >= 730 ? '✅ YES' : '❌ NO'}`);
        }

        // Check Hot Water (TL210)
        console.log('\n🔥 Hot Water Consumption (TL210):');
        const hotWaterRange = await WaterService.getAvailableDateRange('SaitSolarLab_30000_TL210');
        if (hotWaterRange) {
            console.log(`   Min Date: ${hotWaterRange.minDate}`);
            console.log(`   Max Date: ${hotWaterRange.maxDate}`);

            const minDate = new Date(hotWaterRange.minDate);
            const maxDate = new Date(hotWaterRange.maxDate);
            const daysDiff = Math.floor((maxDate - minDate) / (1000 * 60 * 60 * 24));
            const yearsDiff = (daysDiff / 365).toFixed(2);

            console.log(`   Duration: ${daysDiff} days (${yearsDiff} years)`);
            console.log(`   Has 2+ years: ${daysDiff >= 730 ? '✅ YES' : '❌ NO'}`);
        }

        console.log('\n' + '='.repeat(60));

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkWaterDataRange();
