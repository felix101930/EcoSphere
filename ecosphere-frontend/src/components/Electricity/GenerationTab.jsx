// Generation Tab Component - Complete generation analysis
import { useEffect } from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import { GENERATION_BREAKDOWNS } from '../../lib/constants/electricity';
import MetricsCards from './MetricsCards';
import BreakdownSelector from './BreakdownSelector';
import OverallTrendChart from './OverallTrendChart';
import SolarSourceBreakdownChart from './SolarSourceBreakdownChart';

const GenerationTab = ({
  data,
  loading,
  dateFrom,
  dateTo,
  onLoadSolarSourceBreakdown,
  solarSourceBreakdownData,
  selectedBreakdown,
  onBreakdownChange
}) => {
  // Load breakdown data when selection changes
  useEffect(() => {
    if (!dateFrom || !dateTo) return;

    const loadBreakdownData = async () => {
      try {
        if (selectedBreakdown === GENERATION_BREAKDOWNS.SOURCE) {
          await onLoadSolarSourceBreakdown(dateFrom, dateTo);
        }
      } catch (error) {
        console.error('Error loading breakdown data:', error);
      }
    };

    loadBreakdownData();
  }, [selectedBreakdown, dateFrom, dateTo, onLoadSolarSourceBreakdown]);

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
        Select a date range to view generation data
      </Alert>
    );
  }

  return (
    <Box>
      {/* Key Metrics */}
      <MetricsCards metrics={data.metrics} metricType="Generation" />

      {/* Breakdown Selector - Hide in export */}
      <Box data-hide-in-export="true">
        <BreakdownSelector
          selectedBreakdown={selectedBreakdown}
          onBreakdownChange={onBreakdownChange}
          type="generation"
        />
      </Box>

      {/* Overall Trend Chart */}
      {selectedBreakdown === GENERATION_BREAKDOWNS.OVERALL && (
        <OverallTrendChart
          data={data.data}
          title="Electricity Generation Trend Overall (Daily)"
          dataLabel="Generation (Wh)"
          color="#4CAF50"
        />
      )}

      {/* Solar Source Breakdown Chart */}
      {selectedBreakdown === GENERATION_BREAKDOWNS.SOURCE && (
        <SolarSourceBreakdownChart
          data={solarSourceBreakdownData}
          loading={loading}
        />
      )}

      {/* Data Source Info */}
      <Alert severity="info" sx={{ mt: 2 }}>
        Data Source: {data.dataSource} | Records: {data.count} |
        Date Range: {data.dateFrom} to {data.dateTo}
      </Alert>
    </Box>
  );
};

export default GenerationTab;
