// Test script for Water API endpoints
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const WaterService = require('../services/waterService');
const { TABLE_NAMES } = require('../config/database');

async function testWaterAPI() {
    console.log('='.repeat(80));
    console.log('WATER API TEST');
    console.log('='.repeat(80));

    try {
        // Test 1: Get date ranges
        console.log('\n1. Testing getAvailableDateRange...');
        const rainwaterRange = await WaterService.getAvailableDateRange(TABLE_NAMES.RAINWATER_LEVEL);
        const hotWaterRange = await WaterService.getAvailableDateRange(TABLE_NAMES.HOT_WATER_CONSUMPTION);

        console.log('✅ Rainwater Range:', rainwaterRange);
        console.log('✅ Hot Water Range:', hotWaterRange);

        // Test 2: Get rainwater data (last 7 days)
        console.log('\n2. Testing getRainwaterLevelData...');
        const rainwaterMaxDate = rainwaterRange.maxDate;
        const rainwaterFromDate = new Date(rainwaterMaxDate + 'T12:00:00');
        rainwaterFromDate.setDate(rainwaterFromDate.getDate() - 7);
        const rainwaterFromStr = rainwaterFromDate.toISOString().split('T')[0];

        const rainwaterData = await WaterService.getRainwaterLevelData(rainwaterFromStr, rainwaterMaxDate);
        console.log(`✅ Rainwater Data: ${rainwaterData.length} records`);
        console.log('   First record:', rainwaterData[0]);
        console.log('   Last record:', rainwaterData[rainwaterData.length - 1]);

        // Test 3: Get hot water data (last 7 days)
        console.log('\n3. Testing getHotWaterConsumptionData...');
        const hotWaterMaxDate = hotWaterRange.maxDate;
        const hotWaterFromDate = new Date(hotWaterMaxDate + 'T12:00:00');
        hotWaterFromDate.setDate(hotWaterFromDate.getDate() - 7);
        const hotWaterFromStr = hotWaterFromDate.toISOString().split('T')[0];

        const hotWaterData = await WaterService.getHotWaterConsumptionData(hotWaterFromStr, hotWaterMaxDate);
        console.log(`✅ Hot Water Data: ${hotWaterData.length} records`);
        console.log('   First record:', hotWaterData[0]);
        console.log('   Last record:', hotWaterData[hotWaterData.length - 1]);

        // Test 4: Calculate metrics
        console.log('\n4. Testing calculateMetrics...');
        const rainwaterMetrics = WaterService.calculateMetrics(rainwaterData);
        const hotWaterMetrics = WaterService.calculateMetrics(hotWaterData);

        console.log('✅ Rainwater Metrics:', rainwaterMetrics);
        console.log('✅ Hot Water Metrics:', hotWaterMetrics);

        console.log('\n' + '='.repeat(80));
        console.log('ALL TESTS PASSED ✅');
        console.log('='.repeat(80));

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        console.error(error);
        process.exit(1);
    }
}

testWaterAPI();
