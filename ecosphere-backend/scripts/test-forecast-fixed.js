// Test fixed forecast calculation
const ElectricityService = require('../services/electricityService');
const ForecastService = require('../services/forecastService');

async function testForecastFixed() {
    try {
        console.log('Testing FIXED forecast calculation for Nov 8, 2020...\n');

        const targetDate = '2020-11-08';
        const forecastDays = 7;

        const startDate = new Date(targetDate + 'T12:00:00');
        startDate.setFullYear(startDate.getFullYear() - 1);
        const startDateStr = startDate.toISOString().substring(0, 10);

        console.log(`Target Date: ${targetDate}`);
        console.log(`Forecast Days: ${forecastDays}\n`);

        // Fetch historical data
        const historicalData = await ElectricityService.getConsumptionData(
            startDateStr,
            targetDate
        );

        console.log(`Historical Data Points: ${historicalData.length}\n`);

        // Test calculateDailyTotals with excludeIncompleteLastDay = true
        const dailyTotals = ForecastService.calculateDailyTotals(historicalData, 30, true);
        console.log(`📊 Daily Totals (last 30 days, excluding incomplete):`);
        console.log(`  Array length: ${dailyTotals.length}`);
        if (dailyTotals.length > 0) {
            console.log(`  Last value: ${dailyTotals[dailyTotals.length - 1].toFixed(2)} Wh`);
            const avg = dailyTotals.reduce((sum, t) => sum + t, 0) / dailyTotals.length;
            console.log(`  Average: ${avg.toFixed(2)} Wh/day\n`);
        }

        // Generate forecast
        console.log('Generating forecast...\n');
        const result = await ForecastService.generateForecast(
            targetDate,
            forecastDays,
            historicalData
        );

        if (result.success) {
            console.log(`Strategy: ${result.metadata.strategy}`);
            console.log(`Confidence: ${result.metadata.confidence}%`);
            console.log(`\nPredictions:`);
            result.predictions.forEach(p => {
                console.log(`  ${p.date}: ${p.value.toFixed(2)} Wh/day`);
            });

            const firstPrediction = result.predictions[0].value;
            console.log(`\n📊 First prediction (Nov 9): ${firstPrediction.toFixed(2)} Wh/day`);
            console.log(`📊 Expected range: ~60,000 - 100,000 Wh/day`);

            if (firstPrediction < 50000 || firstPrediction > 120000) {
                console.log(`⚠️  WARNING: Prediction seems out of range!`);
            } else {
                console.log(`✅ Prediction looks reasonable!`);
            }
        } else {
            console.log('❌ Forecast generation failed');
        }

    } catch (error) {
        console.error('Error:', error.message);
        console.error(error.stack);
    }
}

testForecastFixed();
