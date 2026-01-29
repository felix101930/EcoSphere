// Check Hot Water data completeness for last 2 years
const WaterService = require('../services/waterService');

async function checkHotWaterCompleteness() {
    console.log('🔍 Checking Hot Water Data Completeness\n');
    console.log('='.repeat(60));

    try {
        // Get last 2 years of data (730 days)
        const targetDate = '2025-12-31';
        const target = new Date(targetDate + 'T12:00:00');
        const startDate = new Date(target);
        startDate.setDate(startDate.getDate() - (2 * 365)); // 2 years back

        const startDateStr = formatDate(startDate);
        const targetDateStr = targetDate;

        console.log(`📅 Fetching data from ${startDateStr} to ${targetDateStr}`);
        console.log(`   (2 years = 730 days)\n`);

        const data = await WaterService.getHotWaterConsumptionData(
            startDateStr,
            targetDateStr
        );

        if (!data || data.length === 0) {
            console.error('❌ No data found!');
            process.exit(1);
        }

        console.log(`✅ Retrieved ${data.length} data points\n`);

        // Analyze timespan
        const firstDate = new Date(data[0].ts);
        const lastDate = new Date(data[data.length - 1].ts);
        const timeSpanMs = lastDate - firstDate;
        const timeSpanDays = timeSpanMs / (1000 * 60 * 60 * 24);
        const timeSpanHours = timeSpanMs / (1000 * 60 * 60);

        console.log('📊 Data Timespan Analysis:');
        console.log('='.repeat(60));
        console.log(`   First Record: ${data[0].ts}`);
        console.log(`   Last Record:  ${data[data.length - 1].ts}`);
        console.log(`   Time Span:    ${timeSpanDays.toFixed(1)} days (${timeSpanHours.toFixed(0)} hours)`);
        console.log(`   Data Points:  ${data.length}`);

        // Calculate expected points (1-minute interval)
        const expectedPoints = Math.floor(timeSpanHours * 60);
        const actualPoints = data.length;
        const completeness = (actualPoints / expectedPoints) * 100;

        console.log(`\n📈 Completeness Calculation:`);
        console.log(`   Expected Points: ${expectedPoints} (1 per minute)`);
        console.log(`   Actual Points:   ${actualPoints}`);
        console.log(`   Completeness:    ${completeness.toFixed(2)}%`);

        // Find gaps
        console.log(`\n🔍 Analyzing Data Gaps:`);
        const gaps = [];
        for (let i = 1; i < data.length; i++) {
            const prevDate = new Date(data[i - 1].ts);
            const currDate = new Date(data[i].ts);
            const gapMinutes = (currDate - prevDate) / (1000 * 60);

            // If gap is more than 2 minutes (should be 1 minute interval)
            if (gapMinutes > 2) {
                gaps.push({
                    start: data[i - 1].ts,
                    end: data[i].ts,
                    minutes: gapMinutes,
                    days: (gapMinutes / 60 / 24).toFixed(1)
                });
            }
        }

        if (gaps.length > 0) {
            console.log(`   Found ${gaps.length} gaps:`);
            gaps.slice(0, 10).forEach((gap, idx) => {
                console.log(`   ${idx + 1}. ${gap.start} to ${gap.end} (${gap.days} days)`);
            });
            if (gaps.length > 10) {
                console.log(`   ... and ${gaps.length - 10} more gaps`);
            }
        } else {
            console.log(`   ✅ No significant gaps found!`);
        }

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

checkHotWaterCompleteness();
