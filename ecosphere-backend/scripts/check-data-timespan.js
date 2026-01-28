// Check actual data timespan in database
const ElectricityService = require('../services/electricityService');

async function checkDataTimespan() {
    console.log('🔍 Checking Data Timespan\n');
    console.log('='.repeat(60));

    try {
        // Fetch 2 years of data (same as forecast controller)
        const targetDate = '2025-12-30';
        const target = new Date(targetDate + 'T12:00:00');
        const startDate = new Date(target);
        startDate.setDate(startDate.getDate() - (2 * 365)); // 2 years back

        const startDateStr = formatDate(startDate);
        const targetDateStr = targetDate;

        console.log(`📅 Fetching data from ${startDateStr} to ${targetDateStr}`);
        console.log(`   (2 years = 730 days)\n`);

        const consumptionResponse = await ElectricityService.getConsumptionData(
            startDateStr,
            targetDateStr
        );

        const historicalData = consumptionResponse.data || consumptionResponse;

        if (!historicalData || historicalData.length === 0) {
            console.error('❌ No data found!');
            process.exit(1);
        }

        console.log(`✅ Retrieved ${historicalData.length} data points\n`);

        // Analyze timespan
        const firstDate = new Date(historicalData[0].ts);
        const lastDate = new Date(historicalData[historicalData.length - 1].ts);
        const timeSpanMs = lastDate - firstDate;
        const timeSpanDays = timeSpanMs / (1000 * 60 * 60 * 24);
        const timeSpanHours = timeSpanMs / (1000 * 60 * 60);

        console.log('📊 Data Timespan Analysis:');
        console.log('='.repeat(60));
        console.log(`   First Record: ${historicalData[0].ts}`);
        console.log(`   Last Record:  ${historicalData[historicalData.length - 1].ts}`);
        console.log(`   Time Span:    ${timeSpanDays.toFixed(1)} days (${timeSpanHours.toFixed(0)} hours)`);
        console.log(`   Data Points:  ${historicalData.length}`);

        // Calculate expected points
        const expectedPoints = Math.floor(timeSpanHours);
        const actualPoints = historicalData.length;
        const completeness = (actualPoints / expectedPoints) * 100;

        console.log(`\n📈 Completeness Calculation:`);
        console.log(`   Expected Points: ${expectedPoints} (1 per hour)`);
        console.log(`   Actual Points:   ${actualPoints}`);
        console.log(`   Completeness:    ${completeness.toFixed(2)}%`);

        // Check Tier 1 requirements
        console.log(`\n🎯 Tier 1 Requirements:`);
        console.log(`   Time Span ≥ 730 days: ${timeSpanDays >= 730 ? '✅ PASS' : '❌ FAIL'} (${timeSpanDays.toFixed(1)} days)`);
        console.log(`   Completeness ≥ 70%:   ${completeness >= 70 ? '✅ PASS' : '❌ FAIL'} (${completeness.toFixed(2)}%)`);

        const meetsRequirements = timeSpanDays >= 730 && completeness >= 70;
        console.log(`\n${meetsRequirements ? '✅' : '❌'} Overall: ${meetsRequirements ? 'MEETS' : 'DOES NOT MEET'} Tier 1 requirements`);

        console.log('\n' + '='.repeat(60));

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

checkDataTimespan();
