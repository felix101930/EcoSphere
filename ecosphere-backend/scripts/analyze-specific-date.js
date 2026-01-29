// Analyze hot water consumption for a specific date
const WaterService = require('../services/waterService');

async function analyzeDate(dateStr) {
    console.log(`🔍 Analyzing Hot Water Consumption for ${dateStr}\n`);
    console.log('='.repeat(80));

    try {
        // Get one day of data
        const data = await WaterService.getHotWaterConsumptionData(dateStr, dateStr);

        if (!data || data.length === 0) {
            console.log('❌ No data found for this date');
            return;
        }

        console.log(`✅ Retrieved ${data.length} data points (1-minute interval)\n`);

        // Calculate total consumption
        let totalConsumption = 0;
        data.forEach(point => {
            // Convert flow rate (L/h) to consumption per minute (L)
            const consumptionPerMinute = point.value * (1 / 60);
            totalConsumption += consumptionPerMinute;
        });

        console.log('📊 Daily Summary:');
        console.log('='.repeat(80));
        console.log(`  Date:                    ${dateStr}`);
        console.log(`  Data points:             ${data.length} minutes`);
        console.log(`  Total consumption:       ${totalConsumption.toFixed(2)} L`);
        console.log(`  Average per minute:      ${(totalConsumption / data.length).toFixed(2)} L/min`);
        console.log(`  Average flow rate:       ${(data.reduce((sum, p) => sum + p.value, 0) / data.length).toFixed(2)} L/h`);

        // Show flow rate statistics
        const flowRates = data.map(d => d.value);
        const maxFlow = Math.max(...flowRates);
        const minFlow = Math.min(...flowRates);
        const avgFlow = flowRates.reduce((a, b) => a + b, 0) / flowRates.length;

        console.log('\n📈 Flow Rate Statistics:');
        console.log('='.repeat(80));
        console.log(`  Average flow rate:       ${avgFlow.toFixed(2)} L/h`);
        console.log(`  Peak flow rate:          ${maxFlow.toFixed(2)} L/h`);
        console.log(`  Minimum flow rate:       ${minFlow.toFixed(2)} L/h`);

        // Find peak times
        const sorted = [...data].sort((a, b) => b.value - a.value);
        console.log('\n⏰ Top 5 Peak Flow Times:');
        console.log('='.repeat(80));
        sorted.slice(0, 5).forEach((d, idx) => {
            const consumption = d.value * (1 / 60);
            console.log(`   ${idx + 1}. ${d.ts}: ${d.value.toFixed(2)} L/h (${consumption.toFixed(2)} L/min)`);
        });

        // Hourly breakdown
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

        console.log('\n⏰ Hourly Breakdown:');
        console.log('='.repeat(80));
        console.log('Hour | Consumption (L) | Peak Flow (L/h) | Minutes');
        console.log('-'.repeat(80));

        const sortedHours = Array.from(hourlyMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
        sortedHours.forEach(([hour, data]) => {
            console.log(`${hour}:00 | ${data.sum.toFixed(2).padStart(15)} | ${data.max.toFixed(0).padStart(15)} | ${data.count}`);
        });

        console.log('\n' + '='.repeat(80));

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Get date from command line argument or use default
const dateArg = process.argv[2] || '2025-12-31';
analyzeDate(dateArg);
