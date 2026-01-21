// Consumption Tab Component - Complete consumption analysis
import { useState, useEffect } from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import { CONSUMPTION_BREAKDOWNS } from '../../lib/constants/electricity';
import MetricsCards from './MetricsCards';
import BreakdownSelector from './BreakdownSelector';
import OverallTrendChart from './OverallTrendChart';
import PhaseBreakdownChart from './PhaseBreakdownChart';
import EquipmentBreakdownChart from './EquipmentBreakdownChart';

const ConsumptionTab = ({
  data,
  loading,
  dateFrom,
  dateTo,
  onLoadPhaseBreakdown,
  onLoadEquipmentBreakdown,
  phaseBreakdownData,
  equipmentBreakdownData
}) => {
  const [selectedBreakdown, setSelectedBreakdown] = useState(CONSUMPTION_BREAKDOWNS.OVERALL);

  // Load breakdown data when selection changes
  useEffect(() => {
    if (!dateFrom || !dateTo) return;

    const loadBreakdownData = async () => {
      try {
        if (selectedBreakdown === CONSUMPTION_BREAKDOWNS.PHASE) {
          await onLoadPhaseBreakdown(dateFrom, dateTo);
        } else if (selectedBreakdown === CONSUMPTION_BREAKDOWNS.EQUIPMENT) {
          await onLoadEquipmentBreakdown(dateFrom, dateTo);
        }
      } catch (error) {
        console.error('Error loading breakdown data:', error);
      }
    };

    loadBreakdownData();
  }, [selectedBreakdown, dateFrom, dateTo, onLoadPhaseBreakdown, onLoadEquipmentBreakdown]);

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
        Select a date range to view consumption data
      </Alert>
    );
  }

  return (
    <Box>
      {/* Warning for aggregated data */}
      {data.warning && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {data.warning}
          {data.equipmentSources && (
            <Box sx={{ mt: 1, fontSize: '0.875rem' }}>
              Equipment sources used: {data.equipmentSources.join(', ')}
            </Box>
          )}
        </Alert>
      )}

      {/* Key Metrics */}
      <MetricsCards metrics={data.metrics} metricType="Consumption" />

      {/* Breakdown Selector - Hide in export */}
      <Box data-hide-in-export="true">
        <BreakdownSelector
          selectedBreakdown={selectedBreakdown}
          onBreakdownChange={setSelectedBreakdown}
          type="consumption"
        />
      </Box>

      {/* Overall Trend Chart */}
      {selectedBreakdown === CONSUMPTION_BREAKDOWNS.OVERALL && (
        <OverallTrendChart
          data={data.data}
          title="Electricity Consumption Trend Overall (Daily)"
          dataLabel="Consumption (Wh)"
          color="#DA291C"
        />
      )}

      {/* Phase Breakdown Chart */}
      {selectedBreakdown === CONSUMPTION_BREAKDOWNS.PHASE && (
        <PhaseBreakdownChart
          data={phaseBreakdownData}
          loading={loading}
        />
      )}

      {/* Equipment Breakdown Chart */}
      {selectedBreakdown === CONSUMPTION_BREAKDOWNS.EQUIPMENT && (
        <EquipmentBreakdownChart
          data={equipmentBreakdownData}
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

export default ConsumptionTab;
