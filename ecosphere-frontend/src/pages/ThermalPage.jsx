// Thermal Page - Main thermal dashboard
import { useState, useMemo } from 'react';
import { Box, CircularProgress, Alert, Typography, Paper } from '@mui/material';
import PageHeader from '../components/Common/PageHeader';
import ExportReportDialog from '../components/Common/ExportReportDialog';
import Disclaimer from '../components/Common/Disclaimer';
import ThermalControlPanel from '../components/Thermal/ThermalControlPanel';
import ThermalChartSection from '../components/Thermal/ThermalChartSection';
import ThermalFloorPlan from '../components/Thermal/ThermalFloorPlan';
import ThermalTimeSlider from '../components/Thermal/ThermalTimeSlider';
import ThermalForecastView from '../components/Thermal/ThermalForecastView';
import { VIEW_MODES } from '../lib/constants/thermal';
import { useThermalData } from '../lib/hooks/useThermalData';
import { useFloorManagement } from '../lib/hooks/useFloorManagement';
import { useTimeControl } from '../lib/hooks/useTimeControl';

const ThermalPage = () => {
  // View mode state
  const [viewMode, setViewMode] = useState(VIEW_MODES.SINGLE);
  const [selectedFloor, setSelectedFloor] = useState('basement');

  // Multiple Days mode state (separate from Single Day)
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [dateRangeError, setDateRangeError] = useState(null);

  // Export dialog state
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // Custom hooks for data management (pass selectedFloor)
  const {
    loading,
    error,
    availableDates,
    selectedDate,
    dailyData,
    aggregatedData,
    multipleDaysDetailData,
    sensorIds,
    forecast,
    forecastLoading,
    forecastError,
    outdoorTemperature,
    outdoorTemperatureHourly,
    sensorsDateRange,
    loadSingleDayData,
    loadMultipleDaysData,
    validateDateRange,
    loadThermalForecast,
    setSelectedDate
  } = useThermalData(selectedFloor);

  const timeControl = useTimeControl(
    viewMode,
    dailyData,
    multipleDaysDetailData,
    sensorIds
  );

  const {
    currentTimeIndex,
    maxTimeIndex,
    maxMultipleDaysTimeIndex,
    currentData,
    currentTime,
    setCurrentTimeIndex,
    handleTimeClick,
    handleDateClick,
    resetTimeIndex
  } = timeControl;

  // Calculate date range from available dates
  const dateRange = useMemo(() => {
    if (availableDates.length === 0) return null;
    return {
      minDate: availableDates[0],
      maxDate: availableDates[availableDates.length - 1]
    };
  }, [availableDates]);

  // Floor management hook
  const floorManagement = useFloorManagement(
    selectedFloor,
    setSelectedFloor,
    viewMode,
    selectedDate,
    dateFrom,
    dateTo,
    loadSingleDayData,
    loadMultipleDaysData,
    resetTimeIndex
  );

  const { handleFloorChange } = floorManagement;

  // Handle view mode change
  const handleViewModeChange = async (_event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
      setDateRangeError(null);

      if (newMode === VIEW_MODES.SINGLE) {
        // Switching to Single Day
        if (selectedDate && sensorIds) {
          try {
            await loadSingleDayData(selectedDate, sensorIds);
            resetTimeIndex();
          } catch {
            // Error already handled in hook
          }
        }
      } else if (newMode === VIEW_MODES.MULTIPLE) {
        // Switching to Multiple Days - set default range if not set
        if (!dateFrom || !dateTo) {
          if (availableDates.length > 0) {
            // Get the last available date (add noon time to avoid timezone shifts)
            const lastDateStr = availableDates[availableDates.length - 1];
            const lastDate = new Date(lastDateStr + 'T12:00:00');

            // Calculate 7 days before (or use earliest available date)
            const daysToGoBack = Math.min(6, availableDates.length - 1);
            const fromDateStr = availableDates[availableDates.length - 1 - daysToGoBack];
            const fromDate = new Date(fromDateStr + 'T12:00:00');

            setDateFrom(fromDate);
            setDateTo(lastDate);

            // Auto-load data for the default range
            try {
              await loadMultipleDaysData(fromDate, lastDate, sensorIds);
              resetTimeIndex();
            } catch {
              // Error already handled in hook
            }
          }
        } else {
          // Reload Multiple Days data with saved range
          try {
            await loadMultipleDaysData(dateFrom, dateTo, sensorIds);
            resetTimeIndex();
          } catch {
            // Error already handled in hook
          }
        }
      }
    }
  };

  // Load data when date changes (Single Day mode)
  const handleDateChange = async (newDate) => {
    if (!newDate) return;

    try {
      await loadSingleDayData(newDate, sensorIds);
      setSelectedDate(newDate);
      resetTimeIndex();
    } catch {
      // Error already handled in hook
    }
  };

  // Generate chart for Multiple Days mode
  const handleGenerateChart = async () => {
    // Validate date range
    const validationError = validateDateRange(dateFrom, dateTo);
    if (validationError) {
      setDateRangeError(validationError);
      return;
    }

    try {
      setDateRangeError(null);
      await loadMultipleDaysData(dateFrom, dateTo, sensorIds);
      resetTimeIndex();
    } catch {
      // Error already handled in hook
    }
  };

  // Check if date should be disabled
  const shouldDisableDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return !availableDates.includes(dateStr);
  };

  // Loading state
  if (loading && !selectedDate) {
    return (
      <>
        <PageHeader
          title="Thermal Report"
          subtitle="Monitor and analyze building temperature"
          showExportButton={true}
          onExport={() => setExportDialogOpen(true)}
        />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', px: 4 }}>
          <CircularProgress />
        </Box>
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <PageHeader
          title="Thermal Report"
          subtitle="Monitor and analyze building temperature"
          showExportButton={true}
          onExport={() => setExportDialogOpen(true)}
        />
        <Box sx={{ px: 4, mt: 4 }}>
          <Alert severity="error">Error loading data: {error}</Alert>
        </Box>
      </>
    );
  }

  return (
    <>
      {/* Export Report Dialog */}
      <ExportReportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        reportType="thermal"
        reportTitle="Thermal Report"
      />

      <PageHeader
        title="Thermal Report"
        subtitle="Monitor and analyze building temperature"
        showExportButton={true}
        onExport={() => setExportDialogOpen(true)}
      />

      <Box data-export-content sx={{ px: 4, py: 3 }}>
        {/* Disclaimer */}
        <Disclaimer />

        {/* Control Panel - Hide in export */}
        <Box data-hide-in-export="true">
          <ThermalControlPanel
            selectedFloor={selectedFloor}
            onFloorChange={handleFloorChange}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            selectedDate={viewMode === VIEW_MODES.SINGLE || viewMode === VIEW_MODES.FORECAST ? selectedDate : null}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateChange={handleDateChange}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            shouldDisableDate={shouldDisableDate}
            onGenerateChart={handleGenerateChart}
            dateRangeError={dateRangeError}
            loading={loading}
            dateRange={dateRange}
          />
        </Box>

        {/* Conditional Rendering based on View Mode */}
        {viewMode === VIEW_MODES.FORECAST ? (
          /* Forecast View */
          <ThermalForecastView
            selectedFloor={selectedFloor}
            dateTo={selectedDate}
            loading={forecastLoading}
            error={forecastError}
            forecast={forecast}
            onLoadForecast={loadThermalForecast}
          />
        ) : (
          <>
            {/* Chart Section */}
            <ThermalChartSection
              viewMode={viewMode}
              dailyData={dailyData}
              aggregatedData={aggregatedData}
              outdoorTemperature={outdoorTemperature}
              onTimeClick={handleTimeClick}
              onDateClick={handleDateClick}
            />

            {/* Floor Plan */}
            <ThermalFloorPlan
              currentData={currentData}
              floor={selectedFloor}
              outdoorTemperatureHourly={outdoorTemperatureHourly}
              currentTimeIndex={currentTimeIndex}
              sensorsDateRange={sensorsDateRange}
              sensorIds={sensorIds}
            />

            {/* Time/Date Slider - Hide in export */}
            <Box data-hide-in-export="true">
              <ThermalTimeSlider
                currentIndex={currentTimeIndex}
                maxIndex={viewMode === VIEW_MODES.SINGLE ? maxTimeIndex : maxMultipleDaysTimeIndex}
                onIndexChange={setCurrentTimeIndex}
                currentTime={currentTime}
                mode={viewMode}
                dateList={viewMode === VIEW_MODES.MULTIPLE ? Object.keys(aggregatedData).sort() : []}
                detailData={viewMode === VIEW_MODES.MULTIPLE ? multipleDaysDetailData : {}}
                sensorIds={sensorIds}
                loading={loading}
              />
            </Box>
          </>
        )}

        {/* Data Source Information */}
        <Paper sx={{ p: 2, mt: 3, backgroundColor: '#f5f5f5' }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Data Source:</strong> SQL Server Database (EcoSphereData) - 13 Thermal Sensors (TL20004-TL20016)
          </Typography>
          {dateRange && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              <strong>Available Date Range:</strong> {dateRange.minDate} to {dateRange.maxDate}
            </Typography>
          )}
        </Paper>
      </Box>
    </>
  );
};

export default ThermalPage;
