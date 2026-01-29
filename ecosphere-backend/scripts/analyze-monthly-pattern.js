// Analyze hot water consumption pattern for last 30 days
const WaterService = require('../services/waterService');

async function analyzeMonthlyPattern() {
    console.log('🔍 Analyzing Hot Water Consumption Pattern (Last 30 Days)\n');
    console.log('='.repeat(80));

    try {
        // Get last 30 days of data
        const endDate = new Date('2025-12-31');
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 29); // 30 days total

        const startDateStr = formatDate(startDate);
        const endDateStr = formatDate(endDate);

        console.log(`📅 Date Range: ${startDateStr} to ${endDateStr}\n`);

        const data = await WaterService.getHotWaterConsumptionData(startDateStr, endDateStr);

        if (!data || data.length === 0) {
            console.log('❌ No data found');
            return;
        }

        console.log(`✅ Retrieved ${data.length} data points\n`);

        // Aggregate by day
        const dailyMap = new Map();
        data.forEach(point => {
            const date = point.ts.substring(0, 10);
            if (!dailyMap.has(date)) {
                dailyMap.set(date, { sum: 0, count: 0, max: 0 });
            }
            const dayData = dailyMap.get(date);
            const consumption = point.value * (1 / 60);
            dayData.sum += consumption;
            dayData.count += 1;
            dayData.max = Math.max(dayData.max, point.value);
        });

        // Convert to array and sort
        const dailyData = Array.from(dailyMap.entries()).map(([date, data]) => ({
            date: date,
            consumption: data.sum,
            dataPoints: data.count,
            peakFlow: data.max
        })).sort((a, b) => a.date.localeCompare(b.date));

        // Calculate statistics
        const consumptions = dailyData.map(d => d.consumption);
        const avgConsumption = consumptions.reduce((a, b) => a + b, 0) / consumptions.length;
        const maxConsumption = Math.max(...consumptions);
        const minConsumption = Math.min(...consumptions);
        const stdDev = Math.sqrt(
            consumptions.reduce((sum, val) => sum + Math.pow(val - avgConsumption, 2), 0) / consumptions.length
        );

        console.log('📊 Summary Statistics:');
        console.log('='.repeat(80));
        console.log(`  Days analyzed:           ${dailyData.length}`);
        console.log(`  Average daily:           ${avgConsumption.toFixed(2)} L`);
        console.log(`  Maximum daily:           ${maxConsumption.toFixed(2)} L`);
        console.log(`  Minimum daily:           ${minConsumption.toFixed(2)} L`);
        console.log(`  Standard deviation:      ${stdDev.toFixed(2)} L`);
        console.log(`  Variation range:         ${(maxConsumption - minConsumption).toFixed(2)} L`);

        console.log('\n📅 Daily Consumption:');
        console.log('='.repeat(80));
        console.log('Date       | Consumption (L) | Peak Flow (L/h) | Data Points');
        console.log('-'.repeat(80));

        dailyData.forEach(day => {
            const dayOfWeek = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
            console.log(
                `${day.date} ${dayOfWeek} | ${day.consumption.toFixed(2).padStart(15)} | ` +
                `${day.peakFlow.toFixed(0).padStart(15)} | ${day.dataPoints}`
            );
        });

        // Find top 5 highest consumption days
        const topDays = [...dailyData].sort((a, b) => b.consumption - a.consumption).slice(0, 5);
        console.log('\n🔝 Top 5 Highest Consumption Days:');
        console.log('='.repeat(80));
        topDays.forEach((day, idx) => {
            const dayOfWeek = new Date(day.date).toLocaleDateString('en-US', { weekday: 'long' });
            console.log(`   ${idx + 1}. ${day.date} (${dayOfWeek}): ${day.consumption.toFixed(2)} L`);
        });

        // Find bottom 5 lowest consumption days
        const bottomDays = [...dailyData].sort((a, b) => a.consumption - b.consumption).slice(0, 5);
        console.log('\n🔻 Top 5 Lowest Consumption Days:');
        console.log('='.repeat(80));
        bottomDays.forEach((day, idx) => {
            const dayOfWeek = new Date(day.date).toLocaleDateString('en-US', { weekday: 'long' });
            console.log(`   ${idx + 1}. ${day.date} (${dayOfWeek}): ${day.consumption.toFixed(2)} L`);
        });

        console.log('\n' + '='.repeat(80));

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

analyzeMonthlyPattern();
