// Debug Tier 3 algorithm
const ElectricityService = require('../services/electricityService');

async function testTier3Debug() {
    try {
        console.log('Testing Tier 3 algorithm components...\n');

        const targetDate = '2020-11-08';

        // Get last 30 days of data
        const endDate = new Date(targetDate + 'T12:00:00');
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 30);

        const startStr = startDate.toISOString().substring(0, 10);
        const endStr = targetDate;

        console.log(`Date Range: ${startStr} to ${endStr}\n`);

        const data = await ElectricityService.getConsumptionData(startStr, endStr);
        console.log(`Total data points: ${data.length}`);
        console.log(`Expected: ~${30 * 24} (30 days hourly)\n`);

        // Manually calculate daily totals
        const dailyTotals = {};
        data.forEach(d => {
            const dateStr = d.ts.substring(0, 10);
            if (!dailyTotals[dateStr]) {
                dailyTotals[dateStr] = 0;
            }
            dailyTotals[dateStr] += Math.abs(d.value);
        });

        const dates = Object.keys(dailyTotals).sort();
        console.log(`Days with data: ${dates.length}\n`);

        console.log('First 5 days:');
        dates.slice(0, 5).forEach(date => {
            console.log(`  ${date}: ${dailyTotals[date].toFixed(2)} Wh`);
        });

        console.log('\nLast 5 days:');
        dates.slice(-5).forEach(date => {
            console.log(`  ${date}: ${dailyTotals[date].toFixed(2)} Wh`);
        });

        // Calculate average daily total
        const totals = Object.values(dailyTotals);
        const avgDailyTotal = totals.reduce((sum, t) => sum + t, 0) / totals.length;
        console.log(`\n📊 Average Daily Total: ${avgDailyTotal.toFixed(2)} Wh/day`);

        // Test the helper function from forecastService
        const ForecastService = require('../services/forecastService');
        const calculatedTotals = ForecastService.calculateDailyTotals(data, 30);
        console.log(`\n📊 calculateDailyTotals result:`);
        console.log(`  Array length: ${calculatedTotals.length}`);
        if (calculatedTotals.length > 0) {
            console.log(`  First value: ${calculatedTotals[0].toFixed(2)} Wh`);
            console.log(`  Last value: ${calculatedTotals[calculatedTotals.length - 1].toFixed(2)} Wh`);
            const avg = calculatedTotals.reduce((sum, t) => sum + t, 0) / calculatedTotals.length;
            console.log(`  Average: ${avg.toFixed(2)} Wh/day`);
        }

    } catch (error) {
        console.error('Error:', error.message);
        console.error(error.stack);
    }
}

testTier3Debug();
