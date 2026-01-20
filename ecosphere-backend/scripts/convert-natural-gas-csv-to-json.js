// Convert Natural Gas CSV to JSON with correct month mapping
const fs = require('fs').promises;
const { parse } = require('csv-parse/sync');
const path = require('path');

async function convertCSVToJSON() {
    console.log('=== Converting Natural Gas CSV to JSON ===\n');

    try {
        // Read CSV file
        const csvPath = path.join(__dirname, '../data/naturalGasReadings.csv');
        const fileContent = await fs.readFile(csvPath, 'utf-8');

        // Parse CSV
        const records = parse(fileContent, {
            columns: false,
            skip_empty_lines: true,
            trim: true
        });

        console.log(`Total CSV rows (including header): ${records.length}`);

        // Extract reading date and usage pairs
        const readings = [];
        for (let i = 1; i < records.length; i++) {
            const row = records[i];
            const dateStr = row[0];
            const usage = row[2];

            if (dateStr && usage !== undefined && usage !== '') {
                const readingDate = new Date(dateStr.replace(/"/g, '').trim());
                readings.push({
                    readingDate,
                    readingDateStr: readingDate.toISOString().split('T')[0],
                    usage: parseFloat(usage) || 0
                });
            }
        }

        console.log(`Total readings with usage data: ${readings.length}\n`);

        // Map readings to actual usage months
        // Reading in month M represents usage for month M-1
        const monthlyUsage = [];

        for (let i = 0; i < readings.length; i++) {
            const reading = readings[i];

            // Calculate the month this usage represents (previous month)
            const usageDate = new Date(reading.readingDate);
            usageDate.setMonth(usageDate.getMonth() - 1);

            const year = usageDate.getFullYear();
            const month = usageDate.getMonth() + 1; // 1-12

            monthlyUsage.push({
                year,
                month,
                monthKey: `${year}-${String(month).padStart(2, '0')}`,
                monthLabel: usageDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
                usage: reading.usage,
                readingDate: reading.readingDateStr
            });
        }

        // Sort by year and month
        monthlyUsage.sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.month - b.month;
        });

        console.log('=== Monthly Usage Data ===');
        console.log(`Total months: ${monthlyUsage.length}`);
        console.log('\nFirst 5 months:');
        monthlyUsage.slice(0, 5).forEach(item => {
            console.log(`  ${item.monthKey} (${item.monthLabel}): ${item.usage} GJ (from reading on ${item.readingDate})`);
        });
        console.log('\nLast 5 months:');
        monthlyUsage.slice(-5).forEach(item => {
            console.log(`  ${item.monthKey} (${item.monthLabel}): ${item.usage} GJ (from reading on ${item.readingDate})`);
        });

        // Save to JSON file
        const jsonPath = path.join(__dirname, '../data/naturalGasMonthlyUsage.json');
        await fs.writeFile(jsonPath, JSON.stringify(monthlyUsage, null, 2), 'utf-8');

        console.log(`\n✓ JSON file saved to: ${jsonPath}`);
        console.log(`\nData range: ${monthlyUsage[0].monthKey} to ${monthlyUsage[monthlyUsage.length - 1].monthKey}`);

    } catch (error) {
        console.error('Error:', error);
    }
}

convertCSVToJSON();
