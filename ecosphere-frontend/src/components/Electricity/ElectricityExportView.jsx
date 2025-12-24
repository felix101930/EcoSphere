// Electricity Export View - Complete view with all breakdowns for PDF export
import { Box, Typography, Paper, Divider } from '@mui/material';
import MetricsCards from './MetricsCards';
import NetEnergyMetricsCards from './NetEnergyMetricsCards';
import OverallTrendChart from './OverallTrendChart';
import PhaseBreakdownChart from './PhaseBreakdownChart';
import EquipmentBreakdownChart from './EquipmentBreakdownChart';
import SolarSourceBreakdownChart from './SolarSourceBreakdownChart';

const SectionTitle = ({ children }) => (
  <Typography 
    variant="h5" 
    sx={{ 
      color: '#324053', 
      fontWeight: 700, 
      mt: 4, 
      mb: 2,
      pb: 1,
      borderBottom: '3px solid #DA291C'
    }}
  >
    {children}
  </Typography>
);

const SubSectionTitle = ({ children }) => (
  <Typography 
    variant="h6" 
    sx={{ 
      color: '#324053', 
      fontWeight: 600, 
      mt: 3, 
      mb: 2
    }}
  >
    {children}
  </Typography>
);

const ElectricityExportView = ({
  dateFrom,
  dateTo,
  consumptionData,
  generationData,
  netEnergyData,
  phaseBreakdownData,
  equipmentBreakdownData,
  solarBreakdownData
}) => {
  return (
    <Box sx={{ bgcolor: 'white', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" sx={{ color: '#DA291C', fontWeight: 700, mb: 1 }}>
          GBTAC - Electricity Report
        </Typography>
        <Typography variant="h6" sx={{ color: '#666', mb: 0.5 }}>
          Date Range: {dateFrom?.toLocaleDateString('en-CA') || 'N/A'} to {dateTo?.toLocaleDateString('en-CA') || 'N/A'}
        </Typography>
        <Typography variant="body2" sx={{ color: '#999' }}>
          Generated on: {new Date().toLocaleString('en-CA')}
        </Typography>
      </Box>

      <Divider sx={{ mb: 4 }} />

      {/* ========== CONSUMPTION SECTION ========== */}
      <SectionTitle>1. Consumption Analysis</SectionTitle>
      
      {consumptionData && (
        <>
          <MetricsCards metrics={consumptionData.metrics} />
          
          <SubSectionTitle>Overall Consumption Trend</SubSectionTitle>
          <OverallTrendChart
            data={consumptionData.data}
            title="Consumption Trend"
            dataLabel="Consumption (Wh)"
            color="#DA291C"
          />

          {phaseBreakdownData && (
            <>
              <SubSectionTitle>Consumption by Phase</SubSectionTitle>
              <PhaseBreakdownChart
                data={phaseBreakdownData}
                loading={false}
              />
            </>
          )}

          {equipmentBreakdownData && (
            <>
              <SubSectionTitle>Consumption by Equipment</SubSectionTitle>
              <EquipmentBreakdownChart
                data={equipmentBreakdownData}
                loading={false}
              />
            </>
          )}
        </>
      )}

      {/* ========== GENERATION SECTION ========== */}
      <SectionTitle>2. Generation Analysis</SectionTitle>
      
      {generationData && (
        <>
          <MetricsCards metrics={generationData.metrics} />
          
          <SubSectionTitle>Overall Generation Trend</SubSectionTitle>
          <OverallTrendChart
            data={generationData.data}
            title="Generation Trend"
            dataLabel="Generation (Wh)"
            color="#005EB8"
          />

          {solarBreakdownData && (
            <>
              <SubSectionTitle>Generation by Solar Source</SubSectionTitle>
              <SolarSourceBreakdownChart
                data={solarBreakdownData}
                loading={false}
              />
            </>
          )}
        </>
      )}

      {/* ========== NET ENERGY SECTION ========== */}
      <SectionTitle>3. Net Energy Analysis</SectionTitle>
      
      {netEnergyData && (
        <>
          <NetEnergyMetricsCards metrics={netEnergyData.metrics} />
          
          <SubSectionTitle>Net Energy Trend</SubSectionTitle>
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'info.50', borderLeft: 4, borderColor: 'info.main' }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Net Energy</strong> = Generation - Consumption
              <br />
              • <strong>Negative values</strong> (red): Building consumes more than it generates → Grid dependency
              <br />
              • <strong>Positive values</strong> (green): Building generates more than it consumes → Grid export
            </Typography>
          </Paper>
          <OverallTrendChart
            data={netEnergyData.data}
            title="Net Energy Trend"
            dataLabel="Net Energy (Wh)"
            color="#9C27B0"
            preserveSign={true}
          />
        </>
      )}

      {/* Footer */}
      <Divider sx={{ mt: 4, mb: 2 }} />
      <Typography variant="caption" sx={{ color: '#999', display: 'block', textAlign: 'center' }}>
        SAIT Green Building Technology Access Centre (GBTAC) | Electricity Monitoring System
      </Typography>
    </Box>
  );
};

export default ElectricityExportView;
