// File: ecosphere-backend/db/sqlcmdQuery.js
const { spawn } = require('child_process');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

function sqlcmdQuery(query) {
    return new Promise((resolve, reject) => {
        const server = process.env.DB_SERVER || '.\\SQLEXPRESS';
        const database = process.env.DB_DATABASE || 'TestSlimDB';

        // -W remove trailing whitespace, -s"," comma separator, -I quoted identifiers
        const args = ['-S', server, '-d', database, '-Q', query, '-W', '-s', ',', '-I'];

        console.log(`🔌 Spawning sqlcmd...`);
        const proc = spawn('sqlcmd', args);
        
        let stdoutData = '';
        let stderrData = '';

        proc.stdout.on('data', (data) => { stdoutData += data.toString(); });
        proc.stderr.on('data', (data) => { stderrData += data.toString(); });

        proc.on('close', (code) => {
            if (code !== 0) {
                console.error("SQLCMD Error:", stderrData);
                return reject(new Error(`sqlcmd failed: ${stderrData}`));
            }

            try {
                // 1. Clean the output: Split by newlines, trim whitespace
                let lines = stdoutData.trim().split('\n').map(l => l.trim()).filter(l => l.length > 0);
                
                // 2. Filter out SQL Server messages like "(X rows affected)" or separator lines "---,---"
                lines = lines.filter(line => 
                    !line.includes('rows affected') && 
                    !line.startsWith('-') &&
                    line.includes(',') // Data lines must have a comma
                );

                if (lines.length < 2) return resolve([]); // Need at least Header + 1 Row

                // 3. Extract Headers
                const headers = lines[0].split(',').map(h => h.trim());

                // 4. Map Data
                const results = lines.slice(1).map(line => {
                    const row = line.split(',');
                    // Ensure row matches header length
                    if (row.length === headers.length) {
                        const obj = {};
                        headers.forEach((header, index) => {
                            obj[header] = row[index] ? row[index].trim() : null;
                        });
                        return obj;
                    }
                    return null;
                }).filter(item => item !== null);
                
                resolve(results);

            } catch (err) {
                console.error("Parsing Error:", err);
                reject(err);
            }
        });
    });
}

module.exports = { sqlcmdQuery };