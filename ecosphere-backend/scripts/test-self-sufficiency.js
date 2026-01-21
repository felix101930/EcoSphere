// Test script for self-sufficiency rate calculation
const ElectricityService = require('../services/electricityService');

async function testSelfSufficiencyRate() {
    console.log('=== Testing Self-Sufficiency Rate Calculation ===\n');

    try {
        // Test with a small date range
        const dateFrom = '2020-11-01';
        const dateTo = '2020-11-03';

        console.log(`Date Range: ${dateFrom} to ${dateTo}\n`);

        // Fetch consumption and generation data
        console.log('Fetching consumption data...');
        const consumptionData = await ElectricityService.getConsumptionData(dateFrom, dateTo);
        console.log(`Consumption records: ${consumptionData.length}`);
        if (consumptionData.length > 0) {
            console.log(`First record: ${consumptionData[0].ts} = ${consumptionData[0].value} Wh`);
            console.log(`Last record: ${consumptionData[consumptionData.length - 1].ts} = ${consumptionData[consumptionData.length - 1].value} Wh`);
        }

        console.log('\nFetching generation data...');
        const generationData = await ElectricityService.getGenerationData(dateFrom, dateTo);
        console.log(`Generation records: ${generationData.length}`);
        if (generationData.length > 0) {
            console.log(`First record: ${generationData[0].ts} = ${generationData[0].value} Wh`);
            console.log(`Last record: ${generationData[generationData.length - 1].ts} = ${generationData[generationData.length - 1].value} Wh`);
        }

        // Calculate self-sufficiency rate for each time point
        console.log('\n=== Calculating Self-Sufficiency Rate ===');
        const minLength = Math.min(consumptionData.length, generationData.length);
        console.log(`Processing ${minLength} time points...\n`);

        const selfSufficiencyRateData = [];
        let totalRate = 0;

        for (let i = 0; i < Math.min(5, minLength); i++) {
            const consumption = Math.abs(consumptionData[i].value);
            const generation = Math.abs(generationData[i].value);
            const rate = consumption > 0 ? (generation / consumption) * 100 : 0;

            selfSufficiencyRateData.push({
                ts: consumptionData[i].ts,
                value: rate
            });

            totalRate += rate;

            console.log(`[${i + 1}] ${consumptionData[i].ts}`);
            console.log(`    Consumption: ${consumption.toFixed(2)} Wh`);
            console.log(`    Generation: ${generation.toFixed(2)} Wh`);
            console.log(`    Self-Sufficiency Rate: ${rate.toFixed(2)}%`);
            console.log(`    Status: ${rate >= 100 ? 'Self-sufficient' : 'Grid dependent'}\n`);
        }

        // Calculate average for all data points
        for (let i = 5; i < minLength; i++) {
            const consumption = Math.abs(consumptionData[i].value);
            const generation = Math.abs(generationData[i].value);
            const rate = consumption > 0 ? (generation / consumption) * 100 : 0;
            totalRate += rate;
        }

        const avgRate = minLength > 0 ? totalRate / minLength : 0;

        console.log('=== Summary ===');
        console.log(`Total time points: ${minLength}`);
        console.log(`Average Self-Sufficiency Rate: ${avgRate.toFixed(2)}%`);
        console.log(`Status: ${avgRate >= 100 ? 'Overall self-sufficient' : 'Overall grid dependent'}`);

        // Calculate overall self-sufficiency (total generation / total consumption)
        const totalConsumption = consumptionData.reduce((sum, d) => sum + Math.abs(d.value), 0);
        const totalGeneration = generationData.reduce((sum, d) => sum + Math.abs(d.value), 0);
        const overallRate = totalConsumption > 0 ? (totalGeneration / totalConsumption) * 100 : 0;

        console.log(`\nOverall Self-Sufficiency (Total Method): ${overallRate.toFixed(2)}%`);
        console.log(`Total Consumption: ${totalConsumption.toFixed(2)} Wh`);
        console.log(`Total Generation: ${totalGeneration.toFixed(2)} Wh`);

    } catch (error) {
        console.error('Error testing self-sufficiency rate:', error.message);
        process.exit(1);
    }
}

// Run test
testSelfSufficiencyRate()
    .then(() => {
        console.log('\n✓ Test completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n✗ Test failed:', error);
        process.exit(1);
    });
