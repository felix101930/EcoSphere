// Analyze hot water peak usage on 2025-12-26
const WaterService = require('../services/waterService');

async function analyzePeak() {
    console.log('🔍 Analyzing Hot Water Peak Usage on 2025-12-26\n');
    console.log('='.repeat(80));

    try {
        // Get one day of data
        const data = await WaterService.getHotWaterConsumptionData('2025-12-26', '2025-12-26');

        console.log(`✅ Retrieved ${data.length} data points\n`);

        // Find all high flow rate periods (> 3000 L/h)
        const highFlowPeriods = [];
        let currentPeriod = null;

        data.forEach((point, idx) => {
            if (point.value > 3000) {
                if (!currentPeriod) {
                    // Start new period
                    currentPeriod = {
                        start: point.ts,
                        startValue: point.value,
                        peak: point.value,
                        peakTime: point.ts,
                        end: point.ts,
                        endValue: point.value,
                        minutes: 1,
                        totalConsumption: point.value * (1 / 60)
                    };
                } else {
                    // Continue period
                    currentPeriod.end = point.ts;
                    currentPeriod.endValue = point.value;
                    currentPeriod.minutes += 1;
                    currentPeriod.totalConsumption += point.value * (1 / 60);

                    if (point.value > currentPeriod.peak) {
                        currentPeriod.peak = point.value;
                        currentPeriod.peakTime = point.ts;
                    }
                }
            } else {
                if (currentPeriod) {
                    // End current period
                    highFlowPeriods.push(currentPeriod);
                    currentPeriod = null;
                }
            }
        });

        // Add last period if exists
        if (currentPeriod) {
            highFlowPeriods.push(currentPeriod);
        }

        console.log(`📊 Found ${highFlowPeriods.length} high flow periods (> 3000 L/h)\n`);

        // Display each period
        highFlowPeriods.forEach((period, idx) => {
            console.log(`Period ${idx + 1}:`);
            console.log(`  Start:        ${period.start} (${period.startValue.toFixed(0)} L/h)`);
            console.log(`  Peak:         ${period.peakTime} (${period.peak.toFixed(0)} L/h)`);
            console.log(`  End:          ${period.end} (${period.endValue.toFixed(0)} L/h)`);
            console.log(`  Duration:     ${period.minutes} minutes`);
            console.log(`  💧 Total Consumption: ${period.totalConsumption.toFixed(2)} L`);
            console.log('');
        });

        // Calculate daily statistics
        let totalDailyConsumption = 0;
        let totalHighFlowConsumption = 0;

        data.forEach(point => {
            const consumption = point.value * (1 / 60);
            totalDailyConsumption += consumption;
        });

        highFlowPeriods.forEach(period => {
            totalHighFlowConsumption += period.totalConsumption;
        });

        console.log('📈 Daily Summary:');
        console.log('='.repeat(80));
        console.log(`  Total daily consumption:        ${totalDailyConsumption.toFixed(2)} L`);
        console.log(`  High flow consumption (>3000):  ${totalHighFlowConsumption.toFixed(2)} L`);
        console.log(`  Percentage from high flow:      ${(totalHighFlowConsumption / totalDailyConsumption * 100).toFixed(1)}%`);
        console.log(`  Baseline consumption:           ${(totalDailyConsumption - totalHighFlowConsumption).toFixed(2)} L`);

        // Show hourly breakdown for peak hours
        console.log('\n⏰ Hourly Breakdown (hours with high flow):');
        console.log('='.repeat(80));

        const hourlyMap = new Map();
        data.forEach(point => {
            const hour = point.ts.substring(11, 13);
            if (!hourlyMap.has(hour)) {
                hourlyMap.set(hour, { sum: 0, count: 0, max: 0 });
            }
            const hourData = hourlyMap.get(hour);
            hourData.sum += point.value * (1 / 60);
            hourData.count += 1;
            hourData.max = Math.max(hourData.max, point.value);
        });

        // Sort by hour and show only hours with high flow
        const sortedHours = Array.from(hourlyMap.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .filter(([hour, data]) => data.max > 3000);

        console.log('Hour | Total Consumption (L) | Peak Flow (L/h) | Minutes');
        console.log('-'.repeat(80));
        sortedHours.forEach(([hour, data]) => {
            console.log(`${hour}:00 | ${data.sum.toFixed(2).padStart(20)} | ${data.max.toFixed(0).padStart(15)} | ${data.count}`);
        });

        console.log('\n' + '='.repeat(80));

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

analyzePeak();
