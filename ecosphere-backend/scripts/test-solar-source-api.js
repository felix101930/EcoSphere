// Test Solar Source Breakdown API
const ElectricityService = require('../services/electricityService');

async function testSolarSourceAPI() {
    console.log('Testing Solar Source Breakdown API...\n');

    const dateFrom = '2025-12-24';
    const dateTo = '2025-12-31';

    try {
        console.log(`Fetching data for ${dateFrom} to ${dateTo}...`);
        const result = await ElectricityService.getSolarSourceBreakdownData(dateFrom, dateTo);

        console.log('\n=== Result Structure ===');
        console.log('Keys:', Object.keys(result));
        console.log('\n=== Carport Data ===');
        console.log('Count:', result.carport?.length || 0);
        if (result.carport && result.carport.length > 0) {
            console.log('First 3 records:', result.carport.slice(0, 3));
            console.log('Last 3 records:', result.carport.slice(-3));
        }

        console.log('\n=== Rooftop Data ===');
        console.log('Count:', result.rooftop?.length || 0);
        if (result.rooftop && result.rooftop.length > 0) {
            console.log('First 3 records:', result.rooftop.slice(0, 3));
            console.log('Last 3 records:', result.rooftop.slice(-3));
        }

        console.log('\n=== Summary ===');
        console.log('Has carport data:', !!result.carport && result.carport.length > 0);
        console.log('Has rooftop data:', !!result.rooftop && result.rooftop.length > 0);

    } catch (error) {
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

testSolarSourceAPI();
