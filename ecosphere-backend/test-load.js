// Load Testing Script for EcoSphere Backend
// Simulates concurrent users accessing the application

const http = require('http');

// Configuration
const CONFIG = {
    host: 'localhost',
    port: 3001,
    concurrentUsers: 50,  // Number of concurrent users to simulate
    requestsPerUser: 5,   // Number of requests each user makes
    delayBetweenRequests: 100  // Delay in ms between requests
};

// Test endpoints
const ENDPOINTS = [
    { path: '/api/health', method: 'GET', name: 'Health Check' },
    { path: '/api/electricity/date-range', method: 'GET', name: 'Electricity Date Range' },
    { path: '/api/water/date-range', method: 'GET', name: 'Water Date Range' },
    { path: '/api/electricity/consumption/2020-11-01/2020-11-07', method: 'GET', name: 'Electricity Data' },
    { path: '/api/water/rainwater/2020-11-01/2020-11-07', method: 'GET', name: 'Water Data' },
    { path: '/api/forecast/electricity/2020-11-07/7', method: 'GET', name: 'Electricity Forecast' },
];

// Statistics
const stats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    totalResponseTime: 0,
    minResponseTime: Infinity,
    maxResponseTime: 0,
    errors: {},
    statusCodes: {},
    endpointStats: {}
};

/**
 * Make HTTP request
 */
function makeRequest(endpoint) {
    return new Promise((resolve) => {
        const startTime = Date.now();

        const options = {
            hostname: CONFIG.host,
            port: CONFIG.port,
            path: endpoint.path,
            method: endpoint.method,
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

                // Update statistics
                stats.totalRequests++;
                stats.totalResponseTime += responseTime;
                stats.minResponseTime = Math.min(stats.minResponseTime, responseTime);
                stats.maxResponseTime = Math.max(stats.maxResponseTime, responseTime);

                // Track status codes
                stats.statusCodes[res.statusCode] = (stats.statusCodes[res.statusCode] || 0) + 1;

                // Track endpoint stats
                if (!stats.endpointStats[endpoint.name]) {
                    stats.endpointStats[endpoint.name] = {
                        requests: 0,
                        totalTime: 0,
                        minTime: Infinity,
                        maxTime: 0,
                        errors: 0
                    };
                }
                const epStats = stats.endpointStats[endpoint.name];
                epStats.requests++;
                epStats.totalTime += responseTime;
                epStats.minTime = Math.min(epStats.minTime, responseTime);
                epStats.maxTime = Math.max(epStats.maxTime, responseTime);

                if (res.statusCode >= 200 && res.statusCode < 300) {
                    stats.successfulRequests++;
                } else {
                    stats.failedRequests++;
                    epStats.errors++;
                }

                resolve({
                    success: res.statusCode >= 200 && res.statusCode < 300,
                    statusCode: res.statusCode,
                    responseTime,
                    endpoint: endpoint.name
                });
            });
        });

        req.on('error', (error) => {
            const responseTime = Date.now() - startTime;
            stats.totalRequests++;
            stats.failedRequests++;

            const errorType = error.code || 'UNKNOWN';
            stats.errors[errorType] = (stats.errors[errorType] || 0) + 1;

            resolve({
                success: false,
                error: error.message,
                responseTime,
                endpoint: endpoint.name
            });
        });

        req.end();
    });
}

/**
 * Simulate a single user
 */
async function simulateUser(userId) {
    const results = [];

    for (let i = 0; i < CONFIG.requestsPerUser; i++) {
        // Pick a random endpoint
        const endpoint = ENDPOINTS[Math.floor(Math.random() * ENDPOINTS.length)];

        const result = await makeRequest(endpoint);
        results.push(result);

        // Small delay between requests
        if (i < CONFIG.requestsPerUser - 1) {
            await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenRequests));
        }
    }

    return results;
}

/**
 * Run load test
 */
async function runLoadTest() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║         EcoSphere Backend Load Testing Tool               ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log(`Configuration:`);
    console.log(`  • Concurrent Users: ${CONFIG.concurrentUsers}`);
    console.log(`  • Requests per User: ${CONFIG.requestsPerUser}`);
    console.log(`  • Total Requests: ${CONFIG.concurrentUsers * CONFIG.requestsPerUser}`);
    console.log(`  • Target: http://${CONFIG.host}:${CONFIG.port}\n`);

    console.log('Starting load test...\n');

    const startTime = Date.now();

    // Create array of user simulations
    const userPromises = [];
    for (let i = 0; i < CONFIG.concurrentUsers; i++) {
        userPromises.push(simulateUser(i + 1));
    }

    // Run all users concurrently
    await Promise.all(userPromises);

    const totalTime = Date.now() - startTime;

    // Print results
    printResults(totalTime);
}

/**
 * Print test results
 */
function printResults(totalTime) {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    Test Results                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // Overall statistics
    console.log('Overall Statistics:');
    console.log(`  • Total Requests: ${stats.totalRequests}`);
    console.log(`  • Successful: ${stats.successfulRequests} (${(stats.successfulRequests / stats.totalRequests * 100).toFixed(2)}%)`);
    console.log(`  • Failed: ${stats.failedRequests} (${(stats.failedRequests / stats.totalRequests * 100).toFixed(2)}%)`);
    console.log(`  • Total Time: ${(totalTime / 1000).toFixed(2)}s`);
    console.log(`  • Requests/sec: ${(stats.totalRequests / (totalTime / 1000)).toFixed(2)}\n`);

    // Response time statistics
    const avgResponseTime = stats.totalResponseTime / stats.totalRequests;
    console.log('Response Time:');
    console.log(`  • Average: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`  • Min: ${stats.minResponseTime}ms`);
    console.log(`  • Max: ${stats.maxResponseTime}ms\n`);

    // Status codes
    console.log('Status Codes:');
    Object.entries(stats.statusCodes).forEach(([code, count]) => {
        const percentage = (count / stats.totalRequests * 100).toFixed(2);
        console.log(`  • ${code}: ${count} (${percentage}%)`);
    });
    console.log('');

    // Endpoint statistics
    console.log('Endpoint Performance:');
    Object.entries(stats.endpointStats).forEach(([name, epStats]) => {
        const avgTime = epStats.totalTime / epStats.requests;
        const successRate = ((epStats.requests - epStats.errors) / epStats.requests * 100).toFixed(2);
        console.log(`\n  ${name}:`);
        console.log(`    • Requests: ${epStats.requests}`);
        console.log(`    • Success Rate: ${successRate}%`);
        console.log(`    • Avg Time: ${avgTime.toFixed(2)}ms`);
        console.log(`    • Min Time: ${epStats.minTime}ms`);
        console.log(`    • Max Time: ${epStats.maxTime}ms`);
    });

    // Errors
    if (Object.keys(stats.errors).length > 0) {
        console.log('\nErrors:');
        Object.entries(stats.errors).forEach(([type, count]) => {
            console.log(`  • ${type}: ${count}`);
        });
    }

    // Performance assessment
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                  Performance Assessment                    ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    const successRate = (stats.successfulRequests / stats.totalRequests * 100);
    const requestsPerSec = stats.totalRequests / (totalTime / 1000);

    if (successRate >= 99 && avgResponseTime < 200) {
        console.log('✅ EXCELLENT: System handles load very well!');
    } else if (successRate >= 95 && avgResponseTime < 500) {
        console.log('✅ GOOD: System performs well under load.');
    } else if (successRate >= 90 && avgResponseTime < 1000) {
        console.log('⚠️  ACCEPTABLE: System handles load but could be improved.');
    } else {
        console.log('❌ POOR: System struggles under load. Optimization needed.');
    }

    console.log(`\nKey Metrics:`);
    console.log(`  • Success Rate: ${successRate.toFixed(2)}% ${successRate >= 95 ? '✅' : '⚠️'}`);
    console.log(`  • Avg Response Time: ${avgResponseTime.toFixed(2)}ms ${avgResponseTime < 500 ? '✅' : '⚠️'}`);
    console.log(`  • Throughput: ${requestsPerSec.toFixed(2)} req/s ${requestsPerSec >= 10 ? '✅' : '⚠️'}`);

    console.log('\n');
}

// Run the test
runLoadTest().catch(error => {
    console.error('Load test failed:', error);
    process.exit(1);
});
