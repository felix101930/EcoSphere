// Net Energy Tab Component - Net energy analysis (Generation - Consumption)
import { Box, CircularProgress, Alert, Paper, Typography } from '@mui/material';
import NetEnergyMetricsCards from './NetEnergyMetricsCards';
import NetEnergyWithSelfSufficiencyChart from './NetEnergyWithSelfSufficiencyChart';
import DataSourceInfo from './DataSourceInfo';

const NetEnergyTab = ({ data, consumptionData, generationData, loading }) => {
  // Debug: Log received data from parent
  console.log('NetEnergyTab - Data received from parent:', {
    hasNetEnergyData: !!data,
    hasConsumptionData: !!consumptionData,
    hasGenerationData: !!generationData,
    consumptionCount: consumptionData?.data?.length,
    generationCount: generationData?.data?.length,
    netEnergyCount: data?.data?.length
  });

  // Loading state
  if (loading && !data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  // No data state
  if (!data) {
    return (
      <Alert severity="info">
        Select a date range to view net energy data
      </Alert>
    );
  }

  return (
    <Box>
      {/* Key Metrics with Sign Preserved */}
      <NetEnergyMetricsCards metrics={data.metrics} />

      {/* Info Card */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'info.50', borderLeft: 4, borderColor: 'info.main' }}>
        <Typography variant="body2" color="text.secondary">
          • <strong>Net Energy</strong> = Generation - Consumption
          <br />
          • <strong>Negative values</strong> (red): Building consumes more than it generates → Grid dependency
          <br />
          • <strong>Positive values</strong> (green): Building generates more than it consumes → Grid export
          <br />
          • <strong>Self-Supply Rate</strong> = (Generation / Consumption) × 100%
          <br />
          • <strong>100%</strong>: Self-sufficient | <strong>&gt;100%</strong>: Surplus | <strong>&lt;100%</strong>: Grid dependent
        </Typography>
      </Paper>

      {/* Net Energy with Consumption & Generation Chart */}
      <NetEnergyWithSelfSufficiencyChart
        netEnergyData={data.data}
        consumptionData={consumptionData?.data}
        generationData={generationData?.data}
        selfSufficiencyData={data.selfSufficiencyRate}
      />

      {/* Data Source Info */}
      <DataSourceInfo
        dataSource="TL339 (Net Energy), TL340 (Generation), TL341 (Consumption)"
        count={data.count}
        dateFrom={data.dateFrom}
        dateTo={data.dateTo}
        note="Net Energy data is stored at hourly intervals (TL339). Self-Sufficiency Rate is calculated using TL340 (Generation) and TL341 (Consumption) data."
      />
    </Box>
  );
};

export default NetEnergyTab;
