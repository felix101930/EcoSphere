// Consumption Tab Component - Complete consumption analysis
import { useEffect } from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import { CONSUMPTION_BREAKDOWNS } from '../../lib/constants/electricity';
import MetricsCards from './MetricsCards';
import BreakdownSelector from './BreakdownSelector';
import OverallTrendChart from './OverallTrendChart';
import PhaseBreakdownChart from './PhaseBreakdownChart';
import EquipmentBreakdownChart from './EquipmentBreakdownChart';
import DataSourceInfo from './DataSourceInfo';

const ConsumptionTab = ({
  data,
  loading,
  dateFrom,
  dateTo,
  onLoadPhaseBreakdown,
  onLoadEquipmentBreakdown,
  phaseBreakdownData,
  equipmentBreakdownData,
  selectedBreakdown,
  onBreakdownChange
}) => {
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
          onBreakdownChange={onBreakdownChange}
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

      {/* Data Source Info - Dynamic based on selected breakdown */}
      {selectedBreakdown === CONSUMPTION_BREAKDOWNS.OVERALL && (
        <DataSourceInfo
          dataSource={data.dataSource}
          count={data.count}
          dateFrom={data.dateFrom}
          dateTo={data.dateTo}
          note="Data is stored at hourly intervals in the database (TL341 table contains hourly increment values)"
        />
      )}

      {selectedBreakdown === CONSUMPTION_BREAKDOWNS.PHASE && phaseBreakdownData && (
        <DataSourceInfo
          dataSource="Phase Tables (TL342-345)"
          dateFrom={dateFrom}
          dateTo={dateTo}
          note="Phase data uses 1-minute intervals, aggregated to hourly averages. TL342 (Total), TL343 (Phase A), TL344 (Phase B), TL345 (Phase C)"
        />
      )}

      {selectedBreakdown === CONSUMPTION_BREAKDOWNS.EQUIPMENT && equipmentBreakdownData && (
        <DataSourceInfo
          dataSource="Equipment Tables (TL213, TL4, TL209, TL211, TL212)"
          dateFrom={dateFrom}
          dateTo={dateTo}
          note="Equipment data uses 1-minute or 15-minute intervals, aggregated to hourly averages. Different equipment types have data from different time periods."
        />
      )}
    </Box>
  );
};

export default ConsumptionTab;
