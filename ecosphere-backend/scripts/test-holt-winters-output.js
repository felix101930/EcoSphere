// Test Holt-Winters output format
const t = require('timeseries-analysis');

console.log('🧪 Testing Holt-Winters Output Format\n');

// Create sample hourly data (7 days = 168 hours)
const data = [];
const startTime = new Date('2025-01-01T00:00:00').getTime();
for (let i = 0; i < 168; i++) {
    const timestamp = startTime + i * 3600000; // Add 1 hour
    const value = 100 + Math.sin(i / 24 * Math.PI * 2) * 20 + Math.random() * 10;
    data.push([timestamp, value]);
}

console.log(`📊 Input data: ${data.length} hourly points`);
console.log(`   First: [${new Date(data[0][0]).toISOString()}, ${data[0][1].toFixed(2)}]`);
console.log(`   Last:  [${new Date(data[data.length - 1][0]).toISOString()}, ${data[data.length - 1][1].toFixed(2)}]\n`);

// Create time series
const ts = new t.main(t.adapter.fromArray(data));

console.log('🔧 Applying Holt-Winters with forecast...\n');

try {
    // Apply Holt-Winters with forecast parameter
    const smoothed = ts.smoother({
        period: 24,      // Daily seasonality
        alpha: 0.5,      // Level
        beta: 0.1,       // Trend
        gamma: 0.3,      // Seasonal
        forecast: 48     // Forecast 48 hours (2 days)
    });

    const output = smoothed.output();

    console.log(`✅ Output received: ${output.length} points`);
    console.log(`   Expected: ${data.length + 48} points (${data.length} historical + 48 forecast)\n`);

    // Check last few points (should be forecasted)
    console.log('📈 Last 5 points (forecasted):');
    output.slice(-5).forEach((point, i) => {
        console.log(`   ${i + 1}. [${new Date(point[0]).toISOString()}, ${point[1]}]`);
    });

    // Check if forecast points are valid
    const forecastPoints = output.slice(data.length);
    console.log(`\n🔍 Forecast points analysis:`);
    console.log(`   Count: ${forecastPoints.length}`);
    console.log(`   Has NaN: ${forecastPoints.some(p => isNaN(p[1]))}`);
    console.log(`   All valid: ${forecastPoints.every(p => typeof p[1] === 'number' && !isNaN(p[1]))}`);

    if (forecastPoints.length > 0) {
        const values = forecastPoints.map(p => p[1]);
        console.log(`   Min: ${Math.min(...values).toFixed(2)}`);
        console.log(`   Max: ${Math.max(...values).toFixed(2)}`);
        console.log(`   Avg: ${(values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)}`);
    }

} catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
}
