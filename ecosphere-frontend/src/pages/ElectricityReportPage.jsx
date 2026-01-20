// Electricity Report Page - Main electricity dashboard
import { useState, useEffect } from 'react';
import { Box, Tabs, Tab, CircularProgress, Alert } from '@mui/material';
import PageHeader from '../components/Common/PageHeader';
import ExportReportDialog from '../components/Common/ExportReportDialog';
import TimeFilter from '../components/Common/TimeFilter';
import ConsumptionTab from '../components/Electricity/ConsumptionTab';
import GenerationTab from '../components/Electricity/GenerationTab';
import NetEnergyTab from '../components/Electricity/NetEnergyTab';
import ForecastTab from '../components/Forecast/ForecastTab';
import { TAB_TYPES } from '../lib/constants/electricity';
import { useElectricityData } from '../lib/hooks/useElectricityData';

const ElectricityReportPage = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState(TAB_TYPES.CONSUMPTION);  

  // Date filter state
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);

  // Export dialog state
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // Custom hook for data management
  const {
    loading,
    error,
    dateRange,
    consumptionData,
    generationData,
    netEnergyData,
    phaseBreakdownData,
    equipmentBreakdownData,
    solarBreakdownData,
    loadConsumptionData,
    loadGenerationData,
    loadNetEnergyData,
    loadPhaseBreakdown,
    loadEquipmentBreakdown,
    loadSolarBreakdown,
    clearData
  } = useElectricityData();

  // Set default date range when dateRange is loaded
  useEffect(() => {
    if (dateRange && !dateFrom && !dateTo) {
      // Set default to last 7 days of available data
      // Use date strings directly to avoid timezone issues
      const maxDateStr = dateRange.consumption.maxDate; // e.g., "2020-11-08"
      const maxDate = new Date(maxDateStr + 'T12:00:00'); // Add noon time to avoid timezone shifts
      const minDate = new Date(maxDate);
      minDate.setDate(minDate.getDate() - 7);

      setDateFrom(minDate);
      setDateTo(maxDate);
    }
  }, [dateRange, dateFrom, dateTo]);

  // Handle tab change
  const handleTabChange = (_event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle apply filter
  const handleApplyFilter = async () => {
    if (!dateFrom || !dateTo) {
      return;
    }

    try {
      // Clear all existing data first to force reload
      // This ensures all tabs get fresh data when dates change
      clearData();

      // Load data based on active tab
      switch (activeTab) {
        case TAB_TYPES.CONSUMPTION:
          await loadConsumptionData(dateFrom, dateTo);
          break;
        case TAB_TYPES.GENERATION:
          await loadGenerationData(dateFrom, dateTo);
          break;
        case TAB_TYPES.NET_ENERGY:
          await loadNetEnergyData(dateFrom, dateTo);
          break;
        default:
          break;
      }
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  // Auto-load data when dates are set (only on initial load)
  useEffect(() => {
    if (dateFrom && dateTo && !consumptionData && !generationData && !netEnergyData) {
      handleApplyFilter();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo]);

  // Auto-load data when tab changes
  useEffect(() => {
    if (!dateFrom || !dateTo) return;

    const loadDataForTab = async () => {
      try {
        switch (activeTab) {
          case TAB_TYPES.CONSUMPTION:
            if (!consumptionData) {
              await loadConsumptionData(dateFrom, dateTo);
            }
            break;
          case TAB_TYPES.GENERATION:
            if (!generationData) {
              await loadGenerationData(dateFrom, dateTo);
            }
            break;
          case TAB_TYPES.NET_ENERGY:
            if (!netEnergyData) {
              await loadNetEnergyData(dateFrom, dateTo);
            }
            break;
          default:
            break;
        }
      } catch (err) {
        console.error('Error loading data for tab:', err);
      }
    };

    loadDataForTab();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, dateFrom, dateTo]);

  // Loading state
  if (!dateRange && loading) {
    return (
      <>
        <PageHeader
          title="Electricity Report"
          subtitle="Monitor and analyze electricity consumption and generation"
        />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', px: 4 }}>
          <CircularProgress />
        </Box>
      </>
    );
  }

  // Error state
  if (error && !dateRange) {
    return (
      <>
        <PageHeader
          title="Electricity Report"
          subtitle="Monitor and analyze electricity consumption and generation"
        />
        <Box sx={{ px: 4, mt: 4 }}>
          <Alert severity="error">Error loading data: {error}</Alert>
        </Box>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Electricity Report"
        subtitle="Monitor and analyze electricity consumption and generation"
        showExportButton={true}
        onExport={() => setExportDialogOpen(true)}
      />

      {/* Export Report Dialog */}
      <ExportReportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        reportType="Electricity"
        reportTitle="Electricity Report"
      />

      <Box data-export-content sx={{ px: 4, py: 3 }}>
        {/* Time Filter - Show for all tabs */}
        <TimeFilter
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          onApply={handleApplyFilter}
          dateRange={dateRange?.consumption}
          loading={loading}
        />

        {/* Main Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab
              label="Consumption"
              value={TAB_TYPES.CONSUMPTION}
            />
            <Tab
              label="Generation"
              value={TAB_TYPES.GENERATION}
            />
            <Tab
              label="Net Energy"
              value={TAB_TYPES.NET_ENERGY}
            />
            <Tab
              label="Forecast"
              value="FORECAST"
            />
          </Tabs>
        </Box>

        {/* Tab Content */}
        {activeTab === TAB_TYPES.CONSUMPTION && (
          <ConsumptionTab
            data={consumptionData}
            loading={loading}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onLoadPhaseBreakdown={loadPhaseBreakdown}
            onLoadEquipmentBreakdown={loadEquipmentBreakdown}
            phaseBreakdownData={phaseBreakdownData}
            equipmentBreakdownData={equipmentBreakdownData}
          />
        )}
        {activeTab === TAB_TYPES.GENERATION && (
          <GenerationTab
            data={generationData}
            loading={loading}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onLoadSolarSourceBreakdown={loadSolarBreakdown}
            solarSourceBreakdownData={solarBreakdownData}
          />
        )}
        {activeTab === TAB_TYPES.NET_ENERGY && (
          <NetEnergyTab
            data={netEnergyData}
            loading={loading}
          />
        )}
        {activeTab === 'FORECAST' && (
          <ForecastTab
            dateTo={dateTo}
          />
        )}
      </Box>
    </>
  );
};

export default ElectricityReportPage;
