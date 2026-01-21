// Verify which version of the code is loaded
const fs = require('fs');
const path = require('path');

console.log('Verifying Code Version');
console.log('='.repeat(70));

// Read the service file
const servicePath = path.join(__dirname, '../services/electricityService.js');
const serviceCode = fs.readFileSync(servicePath, 'utf8');

// Check for optimized query pattern
const hasOptimizedQuery = serviceCode.includes("CONVERT(varchar, CAST(ts AS DATE), 23)");
const hasOldQuery = serviceCode.includes("DATEADD(hour, DATEDIFF(hour, 0, ts), 0)");

console.log('\nCode Analysis:');
console.log(`  File: ${servicePath}`);
console.log(`  Size: ${serviceCode.length} bytes`);
console.log('');
console.log('Query Pattern Check:');
console.log(`  ✓ Optimized query (CAST(ts AS DATE), 23): ${hasOptimizedQuery ? '✓ FOUND' : '✗ NOT FOUND'}`);
console.log(`  ✗ Old slow query (DATEADD/DATEDIFF): ${hasOldQuery ? '⚠️ STILL PRESENT' : '✓ REMOVED'}`);
console.log('');

if (hasOptimizedQuery && !hasOldQuery) {
  console.log('✅ CODE IS UP TO DATE - Using optimized queries');
} else if (hasOldQuery) {
  console.log('⚠️ WARNING - Old slow queries still present in code');
  console.log('   Please make sure you saved the file after editing');
} else {
  console.log('❌ ERROR - Neither old nor new query pattern found');
}

console.log('');
console.log('='.repeat(70));
console.log('');
console.log('If the code is up to date but API is still slow:');
console.log('1. Stop the backend server (Ctrl+C)');
console.log('2. Run: restart-backend.bat');
console.log('3. Or manually: taskkill /F /IM node.exe && npm start');
console.log('');
