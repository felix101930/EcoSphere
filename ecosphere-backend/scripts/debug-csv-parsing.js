// Debug CSV parsing
const fs = require('fs').promises;
const { parse } = require('csv-parse/sync');

async function debugCSV() {
    const fileContent = await fs.readFile('./data/naturalGasReadings.csv', 'utf-8');

    const records = parse(fileContent, {
        columns: false,
        skip_empty_lines: true,
        trim: true
    });

    console.log('Total rows (including header):', records.length);
    console.log('\nExtracting usage values from column 3:');

    const usageValues = [];
    for (let i = 1; i < records.length; i++) {
        const row = records[i];
        if (row[2] !== undefined && row[2] !== '') {
            const usage = parseFloat(row[2]) || 0;
            usageValues.push(usage);
            console.log(`Row ${i}: ${row[0]} -> Usage: ${usage}`);
        } else {
            console.log(`Row ${i}: ${row[0]} -> No usage value`);
        }
    }

    console.log('\n=== Usage Values Array ===');
    console.log('Total usage values:', usageValues.length);
    console.log('Values:', usageValues);

    console.log('\n=== Mapping to Months ===');
    console.log('2023-01 (index 0) -> usage value:', usageValues[0]);
    console.log('2023-02 (index 1) -> usage value:', usageValues[1]);
    console.log('2025-10 (index 33) -> usage value:', usageValues[33]);
    console.log('2025-11 (index 34) -> usage value:', usageValues[34]);
    console.log('2025-12 (index 35) -> usage value:', usageValues[35]);
}

debugCSV().catch(console.error);
