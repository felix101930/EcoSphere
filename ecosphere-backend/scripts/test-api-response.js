// Test API response to verify AVG is being used
const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/electricity/phase-breakdown/2020-11-01/2020-11-01',
    method: 'GET'
};

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            const phaseA = json.data.phaseA;

            console.log('=== API Response Test ===\n');
            console.log(`Total Phase A records: ${phaseA.length}`);
            console.log('\nFirst 5 hourly records:');
            phaseA.slice(0, 5).forEach(item => {
                console.log(`${item.ts}: ${item.value.toFixed(2)} Wh`);
            });

            // Calculate daily sum
            const dailySum = phaseA.reduce((sum, item) => sum + Math.abs(item.value), 0);
            console.log(`\nDaily sum (what frontend shows): ${dailySum.toFixed(2)} Wh`);
            console.log(`Average per hour: ${(dailySum / phaseA.length).toFixed(2)} Wh`);

            // Expected values
            console.log('\n=== Expected Values ===');
            console.log('If using AVG correctly:');
            console.log('  - Each hourly value should be ~4,000-5,000 Wh');
            console.log('  - Daily sum should be ~100,000 Wh (100 kWh)');
            console.log('\nIf still using SUM (wrong):');
            console.log('  - Each hourly value would be ~250,000 Wh');
            console.log('  - Daily sum would be ~6,000,000 Wh (6,000 kWh)');

        } catch (error) {
            console.error('Error parsing response:', error.message);
            console.log('Raw response:', data);
        }
    });
});

req.on('error', (error) => {
    console.error('Error:', error.message);
});

req.end();
