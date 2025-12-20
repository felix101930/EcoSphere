// Thermal Page - Main thermal dashboard
import { useState } from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import PageHeader from '../components/Common/PageHeader';
import ThermalControlPanel from '../components/Thermal/ThermalControlPanel';
import ThermalChartSection from '../components/Thermal/ThermalChartSection';
import ThermalFloorPlan from '../components/Thermal/ThermalFloorPlan';
import ThermalTimeSlider from '../components/Thermal/ThermalTimeSlider';
import { VIEW_MODES } from '../lib/constants/thermal';
import { useThermalData } from '../lib/hooks/useThermalData';
import { useFloorManagement } from '../lib/hooks/useFloorManagement';
import { useTimeControl } from '../lib/hooks/useTimeControl';

const ThermalPage = () => {
  // View mode state
  const [viewMode, setViewMode] = useState(VIEW_MODES.SINGLE);
  const [selectedFloor, setSelectedFloor] = useState('basement'); // Move floor state here
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [dateRangeError, setDateRangeError] = useState(null);

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
    loadSingleDayData,
    loadMultipleDaysData,
    validateDateRange,
    clearMultipleDaysData,
    clearSingleDayData
  } = useThermalData(selectedFloor);

  // Time control hook
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
  const handleViewModeChange = (_event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
      setDateRangeError(null);
      
      // Reset data when switching modes
      if (newMode === VIEW_MODES.SINGLE) {
        setDateFrom(null);
        setDateTo(null);
        clearMultipleDaysData();
      } else {
        clearSingleDayData();
      }
    }
  };

  // Load data when date changes (Single Day mode)
  const handleDateChange = async (newDate) => {
    if (!newDate) return;

    try {
      await loadSingleDayData(newDate, sensorIds);
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
          title="Thermal Dashboard" 
          subtitle="Monitor and analyze building temperature"
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
          title="Thermal Dashboard" 
          subtitle="Monitor and analyze building temperature"
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
        title="Thermal Dashboard" 
        subtitle="Monitor and analyze building temperature"
      />
      
      <Box sx={{ px: 4, py: 3 }}>
        {/* Control Panel */}
        <ThermalControlPanel
          selectedFloor={selectedFloor}
          onFloorChange={handleFloorChange}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          selectedDate={selectedDate}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateChange={handleDateChange}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          shouldDisableDate={shouldDisableDate}
          onGenerateChart={handleGenerateChart}
          dateRangeError={dateRangeError}
          loading={loading}
        />

        {/* Chart Section */}
        <ThermalChartSection
          viewMode={viewMode}
          dailyData={dailyData}
          aggregatedData={aggregatedData}
          onTimeClick={handleTimeClick}
          onDateClick={handleDateClick}
        />

        {/* Floor Plan */}
        <ThermalFloorPlan 
          currentData={currentData}
          floor={selectedFloor}
        />

        {/* Time/Date Slider */}
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
  );
};

export default ThermalPage;
