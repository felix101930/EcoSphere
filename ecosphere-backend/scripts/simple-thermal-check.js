// Simple thermal data check - Get a few days of data to analyze patterns
const ThermalService = require('../services/thermalService');

async function checkThermalData() {
    console.log('Checking thermal data patterns...\n');

    try {
        // Get a few days of aggregated data
        const dateFrom = '2020-11-01';
        const dateTo = '2020-11-08';
        const sensorId = '20004_TL2';

        console.log(`Fetching data for sensor ${sensorId} from ${dateFrom} to ${dateTo}...\n`);

        const data = await ThermalService.getAggregatedData(sensorId, dateFrom, dateTo);

        console.log('Date       | High  | Low   | Avg   | Open  | Close | Range');
        console.log('-----------|-------|-------|-------|-------|-------|------');

        data.forEach(day => {
            const range = (day.high - day.low).toFixed(2);
            console.log(
                `${day.date} | ` +
                `${day.high.toFixed(2)} | ` +
                `${day.low.toFixed(2)} | ` +
                `${day.avg.toFixed(2)} | ` +
                `${day.open.toFixed(2)} | ` +
                `${day.close.toFixed(2)} | ` +
                `${range}`
            );
        });

        console.log('\n');

        // Calculate overall statistics
        const avgHigh = data.reduce((sum, d) => sum + d.high, 0) / data.length;
        const avgLow = data.reduce((sum, d) => sum + d.low, 0) / data.length;
        const avgTemp = data.reduce((sum, d) => sum + d.avg, 0) / data.length;
        const avgRange = data.reduce((sum, d) => sum + (d.high - d.low), 0) / data.length;

        console.log('SUMMARY STATISTICS:');
        console.log(`Average High: ${avgHigh.toFixed(2)}°C`);
        console.log(`Average Low: ${avgLow.toFixed(2)}°C`);
        console.log(`Average Temp: ${avgTemp.toFixed(2)}°C`);
        console.log(`Average Daily Range: ${avgRange.toFixed(2)}°C`);
        console.log('');

        // Get one complete day to see hourly pattern
        console.log('Fetching detailed hourly data for 2020-11-08...\n');
        const dailyData = await ThermalService.getDailyData(sensorId, '2020-11-08');

        console.log('Time  | Temp  | Change');
        console.log('------|-------|-------');

        for (let i = 0; i < Math.min(24, dailyData.length); i += 4) {
            const current = dailyData[i];
            const prev = i > 0 ? dailyData[i - 1] : null;
            const change = prev ? (current.value - prev.value).toFixed(2) : 'N/A';
            const time = current.ts.substring(11, 16);
            console.log(`${time} | ${current.value.toFixed(2)} | ${change}`);
        }

        console.log('\n');
        console.log('='.repeat(70));
        console.log('KEY OBSERVATIONS TO ANALYZE:');
        console.log('='.repeat(70));
        console.log('1. Temperature Stability:');
        console.log('   - Is daily range small (<2°C) or large (>3°C)?');
        console.log('   - Is temperature tightly controlled or variable?');
        console.log('');
        console.log('2. Trends Over Time:');
        console.log('   - Is there a gradual warming/cooling trend?');
        console.log('   - Are there sudden jumps (HVAC setting changes)?');
        console.log('');
        console.log('3. Weekday vs Weekend:');
        console.log('   - Is there a significant difference?');
        console.log('   - Does HVAC turn off or reduce on weekends?');
        console.log('');
        console.log('4. Hourly Patterns:');
        console.log('   - Are changes gradual (<0.5°C/hour) or sudden (>1°C/hour)?');
        console.log('   - Is there a daily cycle (cooler at night, warmer during day)?');
        console.log('');
        console.log('5. Forecast Implications:');
        console.log('   - If stable: Use simple historical average');
        console.log('   - If trending: Use trend-based prediction');
        console.log('   - If cyclical: Use seasonal/weekly patterns');
        console.log('   - If weather-dependent: Add outdoor temperature factor');
        console.log('='.repeat(70));

    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkThermalData();
