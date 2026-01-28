// Test Consumption Forecast API directly
const API_BASE = 'http://localhost:3001/api';

async function testConsumptionForecast() {
    console.log('🧪 Testing Consumption Forecast API\n');
    console.log('='.repeat(60));

    try {
        // Test parameters
        const targetDate = '2025-12-30';
        const forecastDays = 7;

        console.log(`📊 Request Parameters:`);
        console.log(`   Target Date: ${targetDate}`);
        console.log(`   Forecast Days: ${forecastDays}`);
        console.log(`   API: ${API_BASE}/forecast/electricity/${targetDate}/${forecastDays}\n`);

        console.log('🔄 Sending request...\n');

        const response = await fetch(
            `${API_BASE}/forecast/electricity/${targetDate}/${forecastDays}`
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`HTTP ${response.status}: ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();

        console.log('✅ Response received!\n');
        console.log('='.repeat(60));

        // Check response structure
        if (!data.predictions) {
            console.log('❌ ERROR: No predictions in response!');
            console.log('Response structure:', JSON.stringify(data, null, 2));
            throw new Error('No predictions in response');
        }

        console.log('📈 Forecast Metadata:');
        console.log('='.repeat(60));

        const metadata = data.metadata;

        console.log(`\n🎯 Strategy: ${metadata.strategyName}`);
        console.log(`   Algorithm: ${metadata.strategy}`);
        console.log(`   Confidence: ${metadata.confidence}%`);
        console.log(`   Accuracy: ${metadata.accuracy}`);

        if (metadata.warning) {
            console.log(`   ⚠️  Warning: ${metadata.warning}`);
        }

        console.log(`\n📊 Data Availability:`);
        console.log(`   Total Data Points: ${metadata.dataAvailability.totalDataPoints}`);
        console.log(`   Completeness Score: ${metadata.dataAvailability.completenessScore}%`);
        console.log(`   Has 2-Year Cycle: ${metadata.dataAvailability.hasTwoYearCycle ? '✅' : '❌'}`);
        console.log(`   Has Last Year Data: ${metadata.dataAvailability.hasLastYearData ? '✅' : '❌'}`);
        console.log(`   Has Recent 30 Days: ${metadata.dataAvailability.hasRecent30Days ? '✅' : '❌'}`);
        console.log(`   Has Recent 7 Days: ${metadata.dataAvailability.hasRecent7Days ? '✅' : '❌'}`);

        if (metadata.dataAvailability.missingPeriods && metadata.dataAvailability.missingPeriods.length > 0) {
            console.log(`\n⚠️  Missing Data Periods:`);
            metadata.dataAvailability.missingPeriods.forEach(period => {
                console.log(`   • ${period.start} to ${period.end} (${period.days} days)`);
            });
        }

        console.log(`\n📅 Predictions:`);
        console.log(`   Total: ${response.data.predictions.length} days`);

        // Check if predictions have valid values
        const hasValidValues = response.data.predictions.every(p => p.value !== null && p.value !== undefined && !isNaN(p.value));
        console.log(`   Has valid values: ${hasValidValues ? '✅' : '❌'}`);

        if (response.data.predictions.length > 0) {
            console.log(`\n   Sample predictions:`);
            response.data.predictions.slice(0, 3).forEach((p, i) => {
                console.log(`   ${i + 1}. ${p.date}: ${p.value} Wh`);
            });
        }

        if (!hasValidValues) {
            console.log(`\n❌ ERROR: Predictions contain null/undefined/NaN values!`);
            console.log(`   Full predictions:`, JSON.stringify(response.data.predictions, null, 2));
        }

        if (hasValidValues && response.data.predictions[0].value !== null) {
            console.log(`   First: ${response.data.predictions[0].date} - ${response.data.predictions[0].value.toFixed(2)} Wh`);
            console.log(`   Last: ${response.data.predictions[response.data.predictions.length - 1].date} - ${response.data.predictions[response.data.predictions.length - 1].value.toFixed(2)} Wh`);
        }

        console.log('\n' + '='.repeat(60));
        console.log('🎉 Test completed successfully!');
        console.log('='.repeat(60));

        // Check if Tier 1
        if (metadata.strategy === 'HOLT_WINTERS') {
            console.log('\n✅ SUCCESS: Using Tier 1 (Holt-Winters)');
        } else {
            console.log(`\n❌ ISSUE: Using ${metadata.strategy} instead of Tier 1`);
            console.log('\n🔍 Tier 1 Requirements:');
            console.log(`   • 2-Year Cycle: ${metadata.dataAvailability.hasTwoYearCycle ? '✅ PASS' : '❌ FAIL'}`);
            console.log(`   • Completeness ≥ 70%: ${metadata.dataAvailability.completenessScore >= 70 ? '✅ PASS' : '❌ FAIL'} (${metadata.dataAvailability.completenessScore}%)`);
        }

    } catch (error) {
        console.error('\n❌ Test failed!');
        console.error('='.repeat(60));
        console.error(`Error: ${error.message}`);
        console.error('='.repeat(60));
        console.error('\nMake sure:');
        console.error('1. Backend is running on http://localhost:3001');
        console.error('2. Database connection is working');
        console.error('3. EcoSphereData database has data for 2024-2025');
        process.exit(1);
    }
}

// Run test
testConsumptionForecast();
