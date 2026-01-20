// Test script to verify Natural Gas data structure
const NaturalGasService = require('../services/naturalGasService');

async function testNaturalGasData() {
    console.log('=== Testing Natural Gas Data Structure ===\n');

    try {
        // Test 1: Read all CSV data
        console.log('Test 1: Reading all CSV data...');
        const allData = await NaturalGasService.readCSVData();
        console.log(`Total months: ${allData.length}`);
        console.log('First 5 months:');
        allData.slice(0, 5).forEach(item => {
            console.log(`  ${item.year}-${String(item.month).padStart(2, '0')} (${item.monthLabel}): ${item.usage} GJ`);
        });
        console.log('Last 5 months:');
        allData.slice(-5).forEach(item => {
            console.log(`  ${item.year}-${String(item.month).padStart(2, '0')} (${item.monthLabel}): ${item.usage} GJ`);
        });
        console.log('');

        // Test 2: Get consumption data for "Last Year" (2025)
        console.log('Test 2: Getting consumption data for Last Year (2025-01 to 2025-12)...');
        const lastYearData = await NaturalGasService.getConsumptionData('2025-01-01', '2025-12-31');
        console.log(`Filtered months: ${lastYearData.count}`);
        console.log('Data:');
        lastYearData.data.forEach(item => {
            console.log(`  ${item.month} (${item.monthLabel}): ${item.value} GJ`);
        });
        console.log('Metrics:', lastYearData.metrics);
        console.log('');

        // Test 3: Get consumption data for "This Year" (2026)
        console.log('Test 3: Getting consumption data for This Year (2026-01 to 2026-12)...');
        const thisYearData = await NaturalGasService.getConsumptionData('2026-01-01', '2026-12-31');
        console.log(`Filtered months: ${thisYearData.count}`);
        console.log('Data:');
        thisYearData.data.forEach(item => {
            console.log(`  ${item.month} (${item.monthLabel}): ${item.value} GJ`);
        });
        console.log('Metrics:', thisYearData.metrics);
        console.log('');

        // Test 4: Verify specific months
        console.log('Test 4: Verifying specific months...');
        const jan2023 = allData.find(d => d.year === 2023 && d.month === 1);
        const feb2023 = allData.find(d => d.year === 2023 && d.month === 2);
        const nov2025 = allData.find(d => d.year === 2025 && d.month === 11);
        const dec2025 = allData.find(d => d.year === 2025 && d.month === 12);

        console.log(`  Jan 2023: ${jan2023.usage} GJ (should be 196 - first CSV usage value)`);
        console.log(`  Feb 2023: ${feb2023.usage} GJ (should be 194 - second CSV usage value)`);
        console.log(`  Nov 2025: ${nov2025.usage} GJ (should be 330 - second to last CSV usage value)`);
        console.log(`  Dec 2025: ${dec2025.usage} GJ (should be 720 - last CSV usage value)`);

    } catch (error) {
        console.error('Error:', error.message);
        console.error(error.stack);
    }
}

testNaturalGasData();
