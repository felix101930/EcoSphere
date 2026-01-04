// Test Overview API endpoints with Demo Day dates
const ElectricityService = require('../services/electricityService');
const WaterService = require('../services/waterService');

async function testOverviewAPIs() {
    const dateFrom = '2020-11-01';
    const dateTo = '2020-11-08';

    console.log('='.repeat(60));
    console.log('Testing Overview APIs with Demo Day dates');
    console.log(`Date Range: ${dateFrom} to ${dateTo}`);
    console.log('='.repeat(60));

    try {
        // Test Electricity APIs
        console.log('\n📊 ELECTRICITY DATA:');
        console.log('-'.repeat(60));

        console.log('\n1. Consumption (TL341):');
        const consumption = await ElectricityService.getConsumptionData(dateFrom, dateTo);
        console.log(`   ✅ Records: ${consumption.length}`);
        if (consumption.length > 0) {
            console.log(`   First: ${consumption[0].timestamp} = ${consumption[0].value} kWh`);
            console.log(`   Last: ${consumption[consumption.length - 1].timestamp} = ${consumption[consumption.length - 1].value} kWh`);
        }

        console.log('\n2. Generation (TL340):');
        const generation = await ElectricityService.getGenerationData(dateFrom, dateTo);
        console.log(`   ✅ Records: ${generation.length}`);
        if (generation.length > 0) {
            console.log(`   First: ${generation[0].timestamp} = ${generation[0].value} kWh`);
            console.log(`   Last: ${generation[generation.length - 1].timestamp} = ${generation[generation.length - 1].value} kWh`);
        }

        console.log('\n3. Net Energy (TL339):');
        const netEnergy = await ElectricityService.getNetEnergyData(dateFrom, dateTo);
        console.log(`   ✅ Records: ${netEnergy.length}`);
        if (netEnergy.length > 0) {
            console.log(`   First: ${netEnergy[0].timestamp} = ${netEnergy[0].value} kWh`);
            console.log(`   Last: ${netEnergy[netEnergy.length - 1].timestamp} = ${netEnergy[netEnergy.length - 1].value} kWh`);
        }

        // Test Water APIs
        console.log('\n\n💧 WATER DATA:');
        console.log('-'.repeat(60));

        console.log('\n1. Rainwater (TL93):');
        const rainwater = await WaterService.getRainwaterLevelData(dateFrom, dateTo);
        console.log(`   ✅ Records: ${rainwater.length}`);
        if (rainwater.length > 0) {
            console.log(`   First: ${rainwater[0].timestamp} = ${rainwater[0].value}%`);
            console.log(`   Last: ${rainwater[rainwater.length - 1].timestamp} = ${rainwater[rainwater.length - 1].value}%`);
        }

        console.log('\n2. Hot Water (TL210):');
        const hotWater = await WaterService.getHotWaterConsumptionData(dateFrom, dateTo);
        console.log(`   ✅ Records: ${hotWater.length}`);
        if (hotWater.length > 0) {
            console.log(`   First: ${hotWater[0].timestamp} = ${hotWater[0].value} L/h`);
            console.log(`   Last: ${hotWater[hotWater.length - 1].timestamp} = ${hotWater[hotWater.length - 1].value} L/h`);
        }

        console.log('\n' + '='.repeat(60));
        console.log('✅ All tests completed successfully!');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('\n❌ Error during testing:', error);
        process.exit(1);
    }
}

testOverviewAPIs();
