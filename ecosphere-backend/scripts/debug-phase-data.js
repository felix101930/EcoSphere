// Debug phase data format
const ElectricityService = require('../services/electricityService');

async function debugPhaseData() {
  console.log('Debugging Phase Data Format');
  console.log('='.repeat(70));
  
  const dateFrom = '2020-11-01';
  const dateTo = '2020-11-08';
  
  try {
    const phaseData = await ElectricityService.getPhaseBreakdownData(dateFrom, dateTo);
    
    console.log('\nPhase A Data (first 10 records):');
    console.log(JSON.stringify(phaseData.phaseA.slice(0, 10), null, 2));
    
    console.log('\nTotal records per phase:');
    console.log(`  Total: ${phaseData.total?.length || 0}`);
    console.log(`  Phase A: ${phaseData.phaseA?.length || 0}`);
    console.log(`  Phase B: ${phaseData.phaseB?.length || 0}`);
    console.log(`  Phase C: ${phaseData.phaseC?.length || 0}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugPhaseData();
