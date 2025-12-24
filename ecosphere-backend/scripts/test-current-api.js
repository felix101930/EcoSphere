// Test current API to verify which code version is running
const fetch = require('node-fetch');

async function testCurrentAPI() {
  console.log('Testing Current API Version');
  console.log('='.repeat(70));
  
  const baseURL = 'http://localhost:3001/api/electricity';
  const dateFrom = '2020-11-01';
  const dateTo = '2020-11-08';
  
  try {
    // Test Phase Breakdown
    console.log('\n1. Testing Phase Breakdown API:');
    const start1 = Date.now();
    const response1 = await fetch(`${baseURL}/phase-breakdown/${dateFrom}/${dateTo}`);
    const time1 = Date.now() - start1;
    
    if (!response1.ok) {
      console.log(`   ❌ Error: ${response1.status} ${response1.statusText}`);
      const errorData = await response1.json();
      console.log(`   Error details:`, errorData);
    } else {
      const data1 = await response1.json();
      console.log(`   ✓ Success`);
      console.log(`   Time: ${time1}ms`);
      console.log(`   Phase A records: ${data1.data?.phaseA?.length || 0}`);
      if (data1.data?.phaseA?.length > 0) {
        console.log(`   First timestamp: ${data1.data.phaseA[0].ts}`);
        console.log(`   Timestamp format check: ${data1.data.phaseA[0].ts.includes('00:00:00 ') ? '❌ OLD FORMAT (double time)' : '✓ NEW FORMAT (correct)'}`);
      }
    }
    
    // Test Equipment Breakdown
    console.log('\n2. Testing Equipment Breakdown API:');
    const start2 = Date.now();
    const response2 = await fetch(`${baseURL}/equipment-breakdown/${dateFrom}/${dateTo}`);
    const time2 = Date.now() - start2;
    
    if (!response2.ok) {
      console.log(`   ❌ Error: ${response2.status} ${response2.statusText}`);
    } else {
      const data2 = await response2.json();
      console.log(`   ✓ Success`);
      console.log(`   Time: ${time2}ms`);
      console.log(`   Ventilation records: ${data2.data?.ventilation?.length || 0}`);
    }
    
    // Test Solar Source Breakdown
    console.log('\n3. Testing Solar Source Breakdown API:');
    const start3 = Date.now();
    const response3 = await fetch(`${baseURL}/solar-breakdown/${dateFrom}/${dateTo}`);
    const time3 = Date.now() - start3;
    
    if (!response3.ok) {
      console.log(`   ❌ Error: ${response3.status} ${response3.statusText}`);
    } else {
      const data3 = await response3.json();
      console.log(`   ✓ Success`);
      console.log(`   Time: ${time3}ms`);
      console.log(`   Carport records: ${data3.data?.carport?.length || 0}`);
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('SUMMARY:');
    console.log(`   Phase: ${time1}ms`);
    console.log(`   Equipment: ${time2}ms`);
    console.log(`   Solar: ${time3}ms`);
    console.log('='.repeat(70));
    
  } catch (error) {
    console.error('\n❌ Connection Error:', error.message);
    console.log('\n💡 Make sure the backend server is running:');
    console.log('   cd ecosphere-backend');
    console.log('   npm start');
  }
}

testCurrentAPI();
