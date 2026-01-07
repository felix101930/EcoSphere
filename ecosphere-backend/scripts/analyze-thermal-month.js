// Analyze one month of thermal data to understand patterns
const ThermalService = require('../services/thermalService');

async function analyzeMonthData() {
    console.log('='.repeat(80));
    console.log('THERMAL DATA ANALYSIS - ONE MONTH');
    console.log('='.repeat(80));
    console.log('');

    try {
        // Get one month of aggregated data (Oct 10 - Nov 8, 2020)
        const dateFrom = '2020-10-10';
        const dateTo = '2020-11-08';
        const sensorId = '20004_TL2';

        console.log(`Sensor: ${sensorId}`);
        console.log(`Period: ${dateFrom} to ${dateTo} (30 days)`);
        console.log('');

        const data = await ThermalService.getAggregatedData(sensorId, dateFrom, dateTo);

        console.log('DAILY DATA:');
        console.log('Date       | DOW | High  | Low   | Avg   | Range | Trend');
        console.log('-----------|-----|-------|-------|-------|-------|-------');

        data.forEach((day, index) => {
            const range = (day.high - day.low).toFixed(2);
            const date = new Date(day.date + 'T12:00:00');
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const dow = dayNames[date.getDay()];

            // Calculate trend (compare with previous day)
            let trend = 'N/A';
            if (index > 0) {
                const diff = day.avg - data[index - 1].avg;
                trend = diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2);
            }

            console.log(
                `${day.date} | ${dow} | ` +
                `${day.high.toFixed(2)} | ` +
                `${day.low.toFixed(2)} | ` +
                `${day.avg.toFixed(2)} | ` +
                `${range} | ` +
                `${trend}`
            );
        });

        console.log('');
        console.log('='.repeat(80));
        console.log('SUMMARY STATISTICS:');
        console.log('='.repeat(80));

        // Calculate overall statistics
        const avgHigh = data.reduce((sum, d) => sum + d.high, 0) / data.length;
        const avgLow = data.reduce((sum, d) => sum + d.low, 0) / data.length;
        const avgTemp = data.reduce((sum, d) => sum + d.avg, 0) / data.length;
        const avgRange = data.reduce((sum, d) => sum + (d.high - d.low), 0) / data.length;
        const minTemp = Math.min(...data.map(d => d.low));
        const maxTemp = Math.max(...data.map(d => d.high));
        const tempSpan = maxTemp - minTemp;

        console.log(`Total Days: ${data.length}`);
        console.log(`Average High: ${avgHigh.toFixed(2)}°C`);
        console.log(`Average Low: ${avgLow.toFixed(2)}°C`);
        console.log(`Average Temp: ${avgTemp.toFixed(2)}°C`);
        console.log(`Average Daily Range: ${avgRange.toFixed(2)}°C`);
        console.log(`Overall Min: ${minTemp.toFixed(2)}°C (${data.find(d => d.low === minTemp).date})`);
        console.log(`Overall Max: ${maxTemp.toFixed(2)}°C (${data.find(d => d.high === maxTemp).date})`);
        console.log(`Total Temperature Span: ${tempSpan.toFixed(2)}°C`);
        console.log('');

        // Analyze weekday vs weekend
        const weekdayData = [];
        const weekendData = [];

        data.forEach(day => {
            const date = new Date(day.date + 'T12:00:00');
            const dow = date.getDay();
            if (dow === 0 || dow === 6) {
                weekendData.push(day);
            } else {
                weekdayData.push(day);
            }
        });

        console.log('='.repeat(80));
        console.log('WEEKDAY vs WEEKEND COMPARISON:');
        console.log('='.repeat(80));

        if (weekdayData.length > 0 && weekendData.length > 0) {
            const weekdayAvg = weekdayData.reduce((sum, d) => sum + d.avg, 0) / weekdayData.length;
            const weekendAvg = weekendData.reduce((sum, d) => sum + d.avg, 0) / weekendData.length;
            const weekdayRange = weekdayData.reduce((sum, d) => sum + (d.high - d.low), 0) / weekdayData.length;
            const weekendRange = weekendData.reduce((sum, d) => sum + (d.high - d.low), 0) / weekendData.length;

            console.log(`Weekdays (${weekdayData.length} days):`);
            console.log(`  Average Temperature: ${weekdayAvg.toFixed(2)}°C`);
            console.log(`  Average Daily Range: ${weekdayRange.toFixed(2)}°C`);
            console.log('');
            console.log(`Weekends (${weekendData.length} days):`);
            console.log(`  Average Temperature: ${weekendAvg.toFixed(2)}°C`);
            console.log(`  Average Daily Range: ${weekendRange.toFixed(2)}°C`);
            console.log('');
            console.log(`Temperature Difference: ${Math.abs(weekdayAvg - weekendAvg).toFixed(2)}°C`);
            console.log(`Range Difference: ${Math.abs(weekdayRange - weekendRange).toFixed(2)}°C`);
        }

        console.log('');
        console.log('='.repeat(80));
        console.log('TREND ANALYSIS:');
        console.log('='.repeat(80));

        // Calculate trend (first week vs last week)
        const firstWeek = data.slice(0, 7);
        const lastWeek = data.slice(-7);
        const firstWeekAvg = firstWeek.reduce((sum, d) => sum + d.avg, 0) / firstWeek.length;
        const lastWeekAvg = lastWeek.reduce((sum, d) => sum + d.avg, 0) / lastWeek.length;
        const trendChange = lastWeekAvg - firstWeekAvg;

        console.log(`First Week Average (${firstWeek[0].date} to ${firstWeek[6].date}): ${firstWeekAvg.toFixed(2)}°C`);
        console.log(`Last Week Average (${lastWeek[0].date} to ${lastWeek[6].date}): ${lastWeekAvg.toFixed(2)}°C`);
        console.log(`Trend Change: ${trendChange > 0 ? '+' : ''}${trendChange.toFixed(2)}°C over 3 weeks`);
        console.log(`Trend Rate: ${(trendChange / 3).toFixed(2)}°C per week`);

        console.log('');
        console.log('='.repeat(80));
        console.log('HOURLY PATTERN SAMPLE (2020-11-08):');
        console.log('='.repeat(80));

        // Get one complete day to see hourly pattern
        const dailyData = await ThermalService.getDailyData(sensorId, '2020-11-08');

        console.log('Time  | Temp  | Change | Notes');
        console.log('------|-------|--------|------');

        for (let i = 0; i < Math.min(96, dailyData.length); i += 4) {
            const current = dailyData[i];
            const prev = i > 0 ? dailyData[i - 4] : null;
            const change = prev ? (current.value - prev.value).toFixed(2) : 'N/A';
            const time = current.ts.substring(11, 16);

            // Add notes for specific times
            let notes = '';
            const hour = parseInt(time.substring(0, 2));
            if (hour === 0) notes = 'Midnight';
            else if (hour === 8) notes = 'Work starts?';
            else if (hour === 12) notes = 'Noon';
            else if (hour === 17) notes = 'Work ends?';
            else if (hour === 23) notes = 'Night';

            console.log(`${time} | ${current.value.toFixed(2)} | ${change.padStart(6)} | ${notes}`);
        }

        console.log('');
        console.log('='.repeat(80));
        console.log('KEY FINDINGS:');
        console.log('='.repeat(80));
        console.log('');
        console.log('1. TEMPERATURE STABILITY:');
        if (avgRange < 1.5) {
            console.log('   ✓ Very stable (avg range < 1.5°C) - Tight HVAC control');
        } else if (avgRange < 2.5) {
            console.log('   ✓ Moderately stable (avg range 1.5-2.5°C) - Good HVAC control');
        } else {
            console.log('   ✗ Variable (avg range > 2.5°C) - Loose HVAC control or external factors');
        }
        console.log('');

        console.log('2. WEEKDAY vs WEEKEND:');
        if (weekdayData.length > 0 && weekendData.length > 0) {
            const diff = Math.abs(weekdayData.reduce((sum, d) => sum + d.avg, 0) / weekdayData.length -
                weekendData.reduce((sum, d) => sum + d.avg, 0) / weekendData.length);
            if (diff < 0.5) {
                console.log('   ✓ No significant difference (<0.5°C) - HVAC runs 24/7');
            } else if (diff < 1.5) {
                console.log('   ⚠ Small difference (0.5-1.5°C) - Possible weekend setback');
            } else {
                console.log('   ✗ Large difference (>1.5°C) - Clear weekend HVAC reduction');
            }
        }
        console.log('');

        console.log('3. TREND OVER TIME:');
        if (Math.abs(trendChange) < 1) {
            console.log('   ✓ Stable (<1°C change) - No significant trend');
        } else if (Math.abs(trendChange) < 2) {
            console.log('   ⚠ Gradual change (1-2°C) - Seasonal adjustment or weather influence');
        } else {
            console.log('   ✗ Strong trend (>2°C) - Significant seasonal change or HVAC adjustment');
        }
        console.log('');

        console.log('='.repeat(80));
        console.log('FORECAST RECOMMENDATION:');
        console.log('='.repeat(80));
        console.log('');

        if (avgRange < 1.5 && Math.abs(trendChange) < 1) {
            console.log('RECOMMENDATION: Simple Historical Average');
            console.log('REASON: Temperature is very stable with no significant trend');
            console.log('METHOD: Use moving average of last 7-14 days');
        } else if (Math.abs(trendChange) > 1.5) {
            console.log('RECOMMENDATION: Trend-Based Prediction with Weather Factor');
            console.log('REASON: Clear temperature trend detected');
            console.log('METHOD: Linear regression + outdoor temperature adjustment');
            console.log('WEATHER API: Use outdoor temperature as predictor');
        } else {
            console.log('RECOMMENDATION: Hybrid Model (Historical + Weather)');
            console.log('REASON: Moderate stability with some variation');
            console.log('METHOD: Historical pattern + small weather adjustment factor');
            console.log('WEATHER API: Use outdoor temperature for minor adjustments');
        }

        console.log('');
        console.log('='.repeat(80));

    } catch (error) {
        console.error('Error:', error.message);
        console.error(error.stack);
    }
}

analyzeMonthData();
