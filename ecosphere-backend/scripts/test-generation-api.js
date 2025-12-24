// Test Generation API endpoints
const ElectricityService = require('../services/electricityService');

async function testGenerationAPI() {
  console.log('Testing Generation API Endpoints');
  console.log('='.repeat(70));
  
  const dateFrom = '2020-11-01';
  const dateTo = '2020-11-08';
  
  try {
    // Test 1: Get Generation Data (Overall)
    console.log('\n1. Testing getGenerationData (Overall - TL340):');
    const generationData = await ElectricityService.getGenerationData(dateFrom, dateTo);
    console.log(`   Records: ${generationData.length}`);
    console.log(`   First record:`, generationData[0]);
    console.log(`   Last record:`, generationData[generationData.length - 1]);
    
    const metrics = ElectricityService.calculateMetrics(generationData);
    console.log(`   Metrics:`, metrics);
    
    // Test 2: Get Solar Source Breakdown
    console.log('\n2. Testing getSolarSourceBreakdownData (Carport + Rooftop):');
    const solarData = await ElectricityService.getSolarSourceBreakdownData(dateFrom, dateTo);
    console.log(`   Carport records: ${solarData.carport?.length || 0}`);
    console.log(`   Rooftop records: ${solarData.rooftop?.length || 0}`);
    
    if (solarData.carport && solarData.carport.length > 0) {
      console.log(`   Carport first:`, solarData.carport[0]);
      const carportTotal = solarData.carport.reduce((sum, item) => sum + Math.abs(item.value), 0);
      console.log(`   Carport total: ${carportTotal.toFixed(2)} W`);
    }
    
    if (solarData.rooftop && solarData.rooftop.length > 0) {
      console.log(`   Rooftop first:`, solarData.rooftop[0]);
      const rooftopTotal = solarData.rooftop.reduce((sum, item) => sum + Math.abs(item.value), 0);
      console.log(`   Rooftop total: ${rooftopTotal.toFixed(2)} W`);
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('✓ All Generation API tests completed successfully!');
    console.log('='.repeat(70));
    
  } catch (error) {
    console.error('\n✗ Error during testing:', error.message);
    console.error(error.stack);
  }
}

testGenerationAPI();
