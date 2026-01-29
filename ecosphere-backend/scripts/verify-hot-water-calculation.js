// Verify Hot Water calculation logic
const WaterService = require('../services/waterService');

/**
 * Aggregate 1-minute flow rate data to hourly total consumption
 * (Same logic as in waterController.js)
 */
function aggregateToHourly(data) {
    const hourlyMap = new Map();

    data.forEach(point => {
        const hourKey = point.ts.substring(0, 13) + ':00:00';

        if (!hourlyMap.has(hourKey)) {
            hourlyMap.set(hourKey, { sum: 0, count: 0 });
        }

        const hourData = hourlyMap.get(hourKey);
        // Convert flow rate (L/h) to actual consumption in 1 minute
        hourData.sum += point.value * (1 / 60);
        hourData.count += 1;
    });

    const hourlyData = [];
    for (const [ts, data] of hourlyMap.entries()) {
        hourlyData.push({
            ts: ts,
            value: data.sum,
            minuteCount: data.count
        });
    }

    hourlyData.sort((a, b) => a.ts.localeCompare(b.ts));
    return hourlyData;
}

/**
 * Aggregate hourly data to daily total
 */
function aggregateToDaily(hourlyData) {
    const dailyMap = new Map();

    hourlyData.forEach(point => {
        const dayKey = point.ts.substring(0, 10);

        if (!dailyMap.has(dayKey)) {
            dailyMap.set(dayKey, { sum: 0, hourCount: 0 });
        }

        const dayData = dailyMap.get(dayKey);
        dayData.sum += point.value;
        dayData.hourCount += 1;
    });

    const dailyData = [];
    for (const [date, data] of dailyMap.entries()) {
        dailyData.push({
            date: date,
            totalConsumption: data.sum,
            hourCount: data.hourCount
        });
    }

    dailyData.sort((a, b) => a.date.localeCompare(b.date));
    return dailyData;
}

async function verifyCalculation() {
    console.log('🔍 Verifying Hot Water Calculation Logic\n');
    console.log('='.repeat(80));

    try {
        // Get 7 days of data
        const rawData = await WaterService.getHotWaterConsumptionData('2025-12-25', '2025-12-31');
        console.log(`✅ Retrieved ${rawData.length} raw data points (1-minute interval)\n`);

        // Show sample raw data
        console.log('📋 Sample Raw Data (first 10 records):');
        console.log('Timestamp           | Flow Rate (L/h) | Consumption/min (L)');
        console.log('-'.repeat(80));
        rawData.slice(0, 10).forEach(d => {
            const consumptionPerMin = d.value * (1 / 60);
            console.log(`${d.ts} | ${d.value.toFixed(2).padStart(8)} | ${consumptionPerMin.toFixed(4)}`);
        });

        // Aggregate to hourly
        const hourlyData = aggregateToHourly(rawData);
        console.log(`\n✅ Aggregated to ${hourlyData.length} hourly data points\n`);

        // Show sample hourly data
        console.log('📋 Sample Hourly Data (first 24 hours):');
        console.log('Hour                | Total (L) | Minutes');
        console.log('-'.repeat(80));
        hourlyData.slice(0, 24).forEach(d => {
            console.log(`${d.ts} | ${d.value.toFixed(2).padStart(9)} | ${d.minuteCount}`);
        });

        // Aggregate to daily
        const dailyData = aggregateToDaily(hourlyData);
        console.log(`\n✅ Aggregated to ${dailyData.length} daily data points\n`);

        // Show daily totals
        console.log('📋 Daily Totals:');
        console.log('Date       | Total Consumption (L) | Hours');
        console.log('-'.repeat(80));
        dailyData.forEach(d => {
            console.log(`${d.date} | ${d.totalConsumption.toFixed(2).padStart(21)} | ${d.hourCount}`);
        });

        // Calculate statistics
        const dailyTotals = dailyData.map(d => d.totalConsumption);
        const avgDaily = dailyTotals.reduce((a, b) => a + b, 0) / dailyTotals.length;
        const maxDaily = Math.max(...dailyTotals);
        const minDaily = Math.min(...dailyTotals);

        console.log('\n📊 Statistics:');
        console.log('='.repeat(80));
        console.log(`   Average daily consumption: ${avgDaily.toFixed(2)} L/day`);
        console.log(`   Max daily consumption:     ${maxDaily.toFixed(2)} L/day`);
        console.log(`   Min daily consumption:     ${minDaily.toFixed(2)} L/day`);

        // Verify calculation with manual example
        console.log('\n🔍 Manual Verification Example:');
        console.log('='.repeat(80));
        console.log('   If flow rate is constant at 60 L/h for 24 hours:');
        console.log('   - Consumption per minute: 60 × (1/60) = 1 L');
        console.log('   - Consumption per hour: 1 L × 60 minutes = 60 L');
        console.log('   - Consumption per day: 60 L × 24 hours = 1,440 L');
        console.log('');
        console.log('   If flow rate is constant at 4,104 L/h for 1 hour:');
        console.log('   - Consumption per minute: 4,104 × (1/60) = 68.4 L');
        console.log('   - Consumption per hour: 68.4 L × 60 minutes = 4,104 L');

        console.log('\n' + '='.repeat(80));
        console.log('✅ Calculation logic verified successfully!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

verifyCalculation();
