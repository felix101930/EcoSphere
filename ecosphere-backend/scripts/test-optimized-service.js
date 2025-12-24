// Test optimized service performance
const ElectricityService = require('../services/electricityService');

async function testOptimizedService() {
  console.log('Testing Optimized Service Performance');
  console.log('='.repeat(70));
  
  const dateFrom = '2020-11-01';
  const dateTo = '2020-11-08';
  
  try {
    // Test Phase Breakdown
    console.log('\n1. Phase Breakdown (4 tables):');
    const start1 = Date.now();
    const phaseData = await ElectricityService.getPhaseBreakdownData(dateFrom, dateTo);
    const time1 = Date.now() - start1;
    console.log(`   Time: ${time1}ms`);
    console.log(`   Total records: ${phaseData.total?.length || 0}`);
    console.log(`   Phase A records: ${phaseData.phaseA?.length || 0}`);
    
    // Test Equipment Breakdown
    console.log('\n2. Equipment Breakdown (5 tables):');
    const start2 = Date.now();
    const equipmentData = await ElectricityService.getEquipmentBreakdownData(dateFrom, dateTo);
    const time2 = Date.now() - start2;
    console.log(`   Time: ${time2}ms`);
    console.log(`   Ventilation records: ${equipmentData.ventilation?.length || 0}`);
    
    // Test Solar Source Breakdown
    console.log('\n3. Solar Source Breakdown (2 tables):');
    const start3 = Date.now();
    const solarData = await ElectricityService.getSolarSourceBreakdownData(dateFrom, dateTo);
    const time3 = Date.now() - start3;
    console.log(`   Time: ${time3}ms`);
    console.log(`   Carport records: ${solarData.carport?.length || 0}`);
    console.log(`   Rooftop records: ${solarData.rooftop?.length || 0}`);
    
    console.log('\n' + '='.repeat(70));
    console.log('PERFORMANCE SUMMARY:');
    console.log(`   Phase Breakdown: ${time1}ms (4 tables)`);
    console.log(`   Equipment Breakdown: ${time2}ms (5 tables)`);
    console.log(`   Solar Source Breakdown: ${time3}ms (2 tables)`);
    console.log(`   Total: ${time1 + time2 + time3}ms`);
    console.log('='.repeat(70));
    
  } catch (error) {
    console.error('\nError:', error.message);
  }
}

testOptimizedService();
