// Net Energy Tab Component - Net energy analysis (Generation - Consumption)
import { Box, CircularProgress, Alert, Paper, Typography } from '@mui/material';
import NetEnergyMetricsCards from './NetEnergyMetricsCards';
import OverallTrendChart from './OverallTrendChart';

const NetEnergyTab = ({ data, loading }) => {
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
          <strong>Net Energy</strong> = Generation - Consumption
          <br />
          • <strong>Negative values</strong> (red): Building consumes more than it generates → Grid dependency
          <br />
          • <strong>Positive values</strong> (green): Building generates more than it consumes → Grid export
        </Typography>
      </Paper>

      {/* Overall Trend Chart */}
      <OverallTrendChart
        data={data.data}
        title="Net Energy Trend"
        dataLabel="Net Energy (Wh)"
        color="#9C27B0"
        preserveSign={true}
      />

      {/* Data Source Info */}
      <Alert severity="info" sx={{ mt: 2 }}>
        Data Source: {data.dataSource} | Records: {data.count} | 
        Date Range: {data.dateFrom} to {data.dateTo}
      </Alert>
    </Box>
  );
};

export default NetEnergyTab;
