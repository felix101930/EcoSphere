// Test generation forecast API
const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/forecast/generation/2020-11-07/7',
    method: 'GET'
};

console.log('Testing generation forecast API...');
console.log(`URL: http://${options.hostname}:${options.port}${options.path}\n`);

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('Response:');
        try {
            const json = JSON.parse(data);
            console.log(JSON.stringify(json, null, 2));
        } catch (e) {
            console.log(data);
        }
    });
});

req.on('error', (error) => {
    console.error('Error:', error.message);
});

req.end();
