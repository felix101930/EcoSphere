/**
 * Test Database Connection
 * Verify which database is being used
 */

require('dotenv').config();
const { DB_CONFIG } = require('../config/database');

console.log('🔍 Database Configuration Test\n');
console.log('Environment Variables:');
console.log(`  DB_SERVER from .env: ${process.env.DB_SERVER || '(not set)'}`);
console.log(`  DB_DATABASE from .env: ${process.env.DB_DATABASE || '(not set)'}`);
console.log('');
console.log('Actual Configuration (DB_CONFIG):');
console.log(`  SERVER: ${DB_CONFIG.SERVER}`);
console.log(`  DATABASE: ${DB_CONFIG.DATABASE}`);
console.log('');

if (DB_CONFIG.DATABASE === 'EcoSphereData') {
    console.log('✅ Using NEW database (EcoSphereData)');
} else if (DB_CONFIG.DATABASE === 'TestSlimDB') {
    console.log('❌ Using OLD database (TestSlimDB)');
    console.log('');
    console.log('⚠️  Please check:');
    console.log('   1. .env file has DB_DATABASE=EcoSphereData');
    console.log('   2. Restart the backend server');
    console.log('   3. Make sure .env is in ecosphere-backend folder');
} else {
    console.log(`⚠️  Using unexpected database: ${DB_CONFIG.DATABASE}`);
}
