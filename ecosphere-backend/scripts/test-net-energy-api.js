// Test Net Energy API endpoint
const ElectricityService = require('../services/electricityService');

async function testNetEnergyAPI() {
  console.log('Testing Net Energy API');
  console.log('='.repeat(70));
  
  const dateFrom = '2020-11-01';
  const dateTo = '2020-11-08';
  
  try {
    // Test Net Energy Data
    console.log('\nTesting getNetEnergyData (TL339):');
    const start = Date.now();
    const netEnergyData = await ElectricityService.getNetEnergyData(dateFrom, dateTo);
    const time = Date.now() - start;
    
    console.log(`   Records: ${netEnergyData.length}`);
    console.log(`   Time: ${time}ms`);
    console.log(`   First record:`, netEnergyData[0]);
    console.log(`   Last record:`, netEnergyData[netEnergyData.length - 1]);
    
    const metrics = ElectricityService.calculateNetEnergyMetrics(netEnergyData);
    console.log(`   Metrics:`, metrics);
    
    // Analyze net energy pattern
    const negativeCount = netEnergyData.filter(d => d.value < 0).length;
    const positiveCount = netEnergyData.filter(d => d.value > 0).length;
    
    console.log(`\n   Analysis:`);
    console.log(`     Negative values (consuming more): ${negativeCount} records (${(negativeCount/netEnergyData.length*100).toFixed(1)}%)`);
    console.log(`     Positive values (generating more): ${positiveCount} records (${(positiveCount/netEnergyData.length*100).toFixed(1)}%)`);
    console.log(`     Average net energy: ${metrics.average.toFixed(2)} Wh`);
    
    if (metrics.average < 0) {
      console.log(`     → Building is NET CONSUMER (grid dependent)`);
    } else {
      console.log(`     → Building is NET PRODUCER (grid exporter)`);
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('✓ Net Energy API test completed successfully!');
    console.log('='.repeat(70));
    
  } catch (error) {
    console.error('\n✗ Error during testing:', error.message);
    console.error(error.stack);
  }
}

testNetEnergyAPI();
