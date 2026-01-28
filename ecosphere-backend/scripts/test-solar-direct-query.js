// Direct SQL query test for Solar Source tables
const { buildSqlcmdCommand, filterOutputLines, QUERY_CONSTANTS } = require('../config/database');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function testDirectQuery() {
    console.log('Testing direct SQL query for Solar Source tables...\n');

    const dateFrom = '2025-12-24';
    const dateTo = '2025-12-31';

    // Test TL252 (Carport)
    console.log('=== Testing TL252 (Carport) ===');
    const query1 = `SELECT CONVERT(varchar, CAST(ts AS DATE), 23) + ' ' + RIGHT('0' + CAST(DATEPART(HOUR, ts) AS VARCHAR), 2) + ':00:00' as ts, AVG(value) as value FROM [SaitSolarLab_30000_TL252] WHERE ts >= '${dateFrom}' AND ts < DATEADD(day, 1, '${dateTo}') GROUP BY CAST(ts AS DATE), DATEPART(HOUR, ts) ORDER BY CAST(ts AS DATE), DATEPART(HOUR, ts)`;

    console.log('Query:', query1);
    const cmd1 = buildSqlcmdCommand(query1);
    console.log('\nCommand:', cmd1);

    try {
        const { stdout } = await execPromise(cmd1);
        console.log('\nRaw output:');
        console.log(stdout);

        const lines = filterOutputLines(stdout);
        console.log('\nFiltered lines count:', lines.length);
        console.log('First 5 lines:', lines.slice(0, 5));

        const results = lines.map(line => {
            const parts = line.split(QUERY_CONSTANTS.CSV_DELIMITER).map(p => p.trim());
            if (parts.length >= QUERY_CONSTANTS.MIN_PARTS_BASIC) {
                return {
                    ts: parts[0],
                    value: parseFloat(parts[1])
                };
            }
            return null;
        }).filter(item => item !== null);

        console.log('\nParsed results count:', results.length);
        console.log('First 3 results:', results.slice(0, 3));

    } catch (error) {
        console.error('Error:', error.message);
    }

    // Test TL253 (Rooftop)
    console.log('\n\n=== Testing TL253 (Rooftop) ===');
    const query2 = `SELECT CONVERT(varchar, CAST(ts AS DATE), 23) + ' ' + RIGHT('0' + CAST(DATEPART(HOUR, ts) AS VARCHAR), 2) + ':00:00' as ts, AVG(value) as value FROM [SaitSolarLab_30000_TL253] WHERE ts >= '${dateFrom}' AND ts < DATEADD(day, 1, '${dateTo}') GROUP BY CAST(ts AS DATE), DATEPART(HOUR, ts) ORDER BY CAST(ts AS DATE), DATEPART(HOUR, ts)`;

    const cmd2 = buildSqlcmdCommand(query2);

    try {
        const { stdout } = await execPromise(cmd2);
        const lines = filterOutputLines(stdout);
        console.log('Filtered lines count:', lines.length);
        console.log('First 5 lines:', lines.slice(0, 5));

        const results = lines.map(line => {
            const parts = line.split(QUERY_CONSTANTS.CSV_DELIMITER).map(p => p.trim());
            if (parts.length >= QUERY_CONSTANTS.MIN_PARTS_BASIC) {
                return {
                    ts: parts[0],
                    value: parseFloat(parts[1])
                };
            }
            return null;
        }).filter(item => item !== null);

        console.log('Parsed results count:', results.length);
        console.log('First 3 results:', results.slice(0, 3));

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testDirectQuery();
