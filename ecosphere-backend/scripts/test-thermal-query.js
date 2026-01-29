/**
 * Test Thermal Data Query
 * 
 * Purpose: Test if thermal service can fetch data correctly
 */

const ThermalService = require('../services/thermalService');

async function testThermalQuery() {
    console.log('=== Testing Thermal Service ===\n');

    try {
        // Test 1: Get available dates for first sensor
        console.log('Test 1: Get available dates for sensor 20004_TL2');
        const dates = await ThermalService.getAvailableDates('20004_TL2');
        console.log(`Found ${dates.length} dates`);
        if (dates.length > 0) {
            console.log(`First date: ${dates[0]}`);
            console.log(`Last date: ${dates[dates.length - 1]}`);
        }
        console.log('');

        // Test 2: Get last complete date
        console.log('Test 2: Get last complete date');
        const lastDate = await ThermalService.getLastCompleteDate('20004_TL2');
        console.log(`Last complete date: ${lastDate}`);
        console.log('');

        // Test 3: Get daily data for last complete date
        if (lastDate && lastDate !== '2025-12-31') {
            console.log(`Test 3: Get daily data for ${lastDate}`);
            const dailyData = await ThermalService.getDailyData('20004_TL2', lastDate);
            console.log(`Found ${dailyData.length} records`);
            if (dailyData.length > 0) {
                console.log('First record:', dailyData[0]);
                console.log('Last record:', dailyData[dailyData.length - 1]);
            }
            console.log('');
        }

        // Test 4: Get data for multiple sensors
        console.log('Test 4: Get data for multiple sensors (Basement)');
        const sensorIds = ['20004_TL2', '20005_TL2', '20006_TL2'];
        if (lastDate && lastDate !== '2025-12-31') {
            const multiData = await ThermalService.getMultipleSensorsDailyData(sensorIds, lastDate);
            console.log('Sensors:', Object.keys(multiData));
            Object.keys(multiData).forEach(sensorId => {
                console.log(`  ${sensorId}: ${multiData[sensorId].length} records`);
            });
        }

        console.log('\n✓ All tests passed!');

    } catch (error) {
        console.error('✗ Test failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

testThermalQuery();
