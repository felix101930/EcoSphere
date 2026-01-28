// Test API raw response
async function test() {
    try {
        const response = await fetch('http://localhost:3001/api/forecast/electricity/2025-12-30/7');
        const text = await response.text();
        console.log('Raw response:');
        console.log(text);

        const data = JSON.parse(text);
        console.log('\nParsed predictions:');
        console.log(JSON.stringify(data.predictions, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
    }
}

test();
