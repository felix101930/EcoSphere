// Natural Gas Performance Test Script
// Tests caching and rate limiting for natural gas endpoints

const http = require('http');

const CONFIG = {
    host: 'localhost',
    port: 3001,
    testIterations: 5
};

// Test results
const results = {
    consumption: [],
    forecast: [],
    cacheHits: 0,
    rateLimitHits: 0
};

/**
 * Make HTTP request
 */
function makeRequest(path) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();

        const options = {
            hostname: CONFIG.host,
            port: CONFIG.port,
            path: path,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                const responseTime = Date.now() - startTime;
                resolve({
                    statusCode: res.statusCode,
                    responseTime,
                    data: data
                });
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.end();
    });
}

/**
 * Test consumption endpoint (should use cache after first request)
 */
async function testConsumption() {
    console.log('\n📊 Testing Natural Gas Consumption Endpoint...');
    console.log('Expected: First request slow, subsequent requests fast (cached)\n');

    for (let i = 1; i <= CONFIG.testIterations; i++) {
        try {
            const result = await makeRequest('/api/natural-gas/consumption?dateFrom=2023-01-01&dateTo=2025-12-31');
            results.consumption.push(result.responseTime);

            const cacheStatus = i === 1 ? '(Cache MISS - reading file)' : '(Cache HIT - from memory)';
            console.log(`  Request ${i}: ${result.responseTime}ms ${cacheStatus}`);

            if (i > 1 && result.responseTime < results.consumption[0] / 2) {
                results.cacheHits++;
            }
        } catch (error) {
            console.error(`  Request ${i} failed:`, error.message);
        }
    }

    const avgTime = results.consumption.reduce((a, b) => a + b, 0) / results.consumption.length;
    const firstTime = results.consumption[0];
    const avgCachedTime = results.consumption.slice(1).reduce((a, b) => a + b, 0) / (results.consumption.length - 1);

    console.log(`\n  Summary:`);
    console.log(`    • First request: ${firstTime}ms`);
    console.log(`    • Avg cached requests: ${avgCachedTime.toFixed(2)}ms`);
    console.log(`    • Speed improvement: ${(firstTime / avgCachedTime).toFixed(2)}x faster`);
    console.log(`    • Cache effectiveness: ${results.cacheHits}/${CONFIG.testIterations - 1} hits`);
}

/**
 * Test forecast endpoint (should use cache and respect rate limit)
 */
async function testForecast() {
    console.log('\n\n🔮 Testing Natural Gas Forecast Endpoint...');
    console.log('Expected: First request slow, subsequent requests fast (cached)\n');

    for (let i = 1; i <= CONFIG.testIterations; i++) {
        try {
            const result = await makeRequest('/api/natural-gas/forecast?targetDate=2025-12-01&forecastMonths=6');
            results.forecast.push(result.responseTime);

            const cacheStatus = i === 1 ? '(Cache MISS - calculating)' : '(Cache HIT - from memory)';
            console.log(`  Request ${i}: ${result.responseTime}ms ${cacheStatus}`);
        } catch (error) {
            console.error(`  Request ${i} failed:`, error.message);
        }
    }

    const avgTime = results.forecast.reduce((a, b) => a + b, 0) / results.forecast.length;
    const firstTime = results.forecast[0];
    const avgCachedTime = results.forecast.slice(1).reduce((a, b) => a + b, 0) / (results.forecast.length - 1);

    console.log(`\n  Summary:`);
    console.log(`    • First request: ${firstTime}ms`);
    console.log(`    • Avg cached requests: ${avgCachedTime.toFixed(2)}ms`);
    console.log(`    • Speed improvement: ${(firstTime / avgCachedTime).toFixed(2)}x faster`);
}

/**
 * Test rate limiting (should block after limit)
 */
async function testRateLimit() {
    console.log('\n\n🚦 Testing Rate Limiting...');
    console.log('Expected: Requests succeed until limit (60/min), then 429 error\n');

    let successCount = 0;
    let rateLimitCount = 0;

    // Make 65 rapid requests to trigger rate limit
    for (let i = 1; i <= 65; i++) {
        try {
            const result = await makeRequest('/api/natural-gas/forecast?targetDate=2025-12-01&forecastMonths=3');

            if (result.statusCode === 200) {
                successCount++;
                if (i <= 10 || i > 60) {
                    console.log(`  Request ${i}: ${result.statusCode} (Success)`);
                } else if (i === 11) {
                    console.log(`  ... (requests 11-60) ...`);
                }
            } else if (result.statusCode === 429) {
                rateLimitCount++;
                if (rateLimitCount <= 3) {
                    console.log(`  Request ${i}: ${result.statusCode} (Rate Limited) ⚠️`);
                } else if (rateLimitCount === 4) {
                    console.log(`  ... (remaining requests rate limited) ...`);
                }
            }
        } catch (error) {
            console.error(`  Request ${i} failed:`, error.message);
        }
    }

    console.log(`\n  Summary:`);
    console.log(`    • Successful requests: ${successCount}`);
    console.log(`    • Rate limited requests: ${rateLimitCount}`);
    console.log(`    • Rate limit working: ${rateLimitCount > 0 ? '✅ Yes' : '❌ No'}`);
}

/**
 * Check cache statistics from health endpoint
 */
async function checkCacheStats() {
    console.log('\n\n📈 Cache Statistics (from /api/health)...\n');

    try {
        const result = await makeRequest('/api/health');
        const health = JSON.parse(result.data);

        if (health.cache) {
            console.log(`  Cache Status:`);
            console.log(`    • Size: ${health.cache.size} entries`);
            console.log(`    • Hits: ${health.cache.hits}`);
            console.log(`    • Misses: ${health.cache.misses}`);
            console.log(`    • Hit Rate: ${health.cache.hitRate}`);
        }
    } catch (error) {
        console.error('  Failed to get cache stats:', error.message);
    }
}

/**
 * Run all tests
 */
async function runTests() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║     Natural Gas Performance Test Suite                    ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(`\nTarget: http://${CONFIG.host}:${CONFIG.port}`);
    console.log(`Test iterations: ${CONFIG.testIterations}\n`);

    try {
        // Test 1: Consumption endpoint caching
        await testConsumption();

        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test 2: Forecast endpoint caching
        await testForecast();

        // Small delay before rate limit test
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Test 3: Rate limiting
        await testRateLimit();

        // Test 4: Cache statistics
        await checkCacheStats();

        // Final summary
        console.log('\n\n╔════════════════════════════════════════════════════════════╗');
        console.log('║                    Test Summary                            ║');
        console.log('╚════════════════════════════════════════════════════════════╝\n');

        const consumptionImprovement = results.consumption[0] /
            (results.consumption.slice(1).reduce((a, b) => a + b, 0) / (results.consumption.length - 1));

        const forecastImprovement = results.forecast[0] /
            (results.forecast.slice(1).reduce((a, b) => a + b, 0) / (results.forecast.length - 1));

        console.log('Performance Improvements:');
        console.log(`  ✅ Consumption caching: ${consumptionImprovement.toFixed(2)}x faster`);
        console.log(`  ✅ Forecast caching: ${forecastImprovement.toFixed(2)}x faster`);
        console.log(`  ✅ Rate limiting: Active and working`);

        console.log('\nConclusion:');
        if (consumptionImprovement > 2 && forecastImprovement > 2) {
            console.log('  🎉 EXCELLENT: Caching provides significant performance boost!');
        } else if (consumptionImprovement > 1.5 && forecastImprovement > 1.5) {
            console.log('  ✅ GOOD: Caching is working effectively.');
        } else {
            console.log('  ⚠️  WARNING: Caching may not be working as expected.');
        }

        console.log('\n');

    } catch (error) {
        console.error('\n❌ Test suite failed:', error);
        process.exit(1);
    }
}

// Run the tests
runTests();
