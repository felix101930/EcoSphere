// Thermal Page - Main thermal dashboard
import { useState } from 'react';
import { Box, CircularProgress, Alert, ToggleButton, ToggleButtonGroup, Typography, Button } from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PageHeader from '../components/Common/PageHeader';
import ThermalTrendChart from '../components/Thermal/ThermalTrendChart';
import ThermalCandlestickChart from '../components/Thermal/ThermalCandlestickChart';
import ThermalFloorPlan from '../components/Thermal/ThermalFloorPlan';
import ThermalTimeSlider from '../components/Thermal/ThermalTimeSlider';
import {
  FLOOR_CONFIGS,
  VIEW_MODES,
  VIEW_MODE_LABELS,
  DATE_CONFIG,
  UI_CONFIG
} from '../lib/constants/thermal';
import { useThermalData } from '../lib/hooks/useThermalData';
import { useFloorManagement } from '../lib/hooks/useFloorManagement';
import { useTimeControl } from '../lib/hooks/useTimeControl';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

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
        {/* View Mode Toggle and Date Selection */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'white', borderRadius: 1, boxShadow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
            {/* Floor Selection */}
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Floor
              </Typography>
              <ToggleButtonGroup
                value={selectedFloor}
                exclusive
                onChange={handleFloorChange}
                aria-label="floor selection"
                size="small"
              >
                <ToggleButton value="basement" aria-label="basement">
                  {FLOOR_CONFIGS.basement.displayName}
                </ToggleButton>
                <ToggleButton value="level1" aria-label="level 1">
                  {FLOOR_CONFIGS.level1.displayName}
                </ToggleButton>
                <ToggleButton value="level2" aria-label="level 2">
                  {FLOOR_CONFIGS.level2.displayName}
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* View Mode Toggle */}
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                View Mode
              </Typography>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={handleViewModeChange}
                aria-label="view mode"
                size="small"
              >
                <ToggleButton value={VIEW_MODES.SINGLE} aria-label="single day">
                  {VIEW_MODE_LABELS[VIEW_MODES.SINGLE]}
                </ToggleButton>
                <ToggleButton value={VIEW_MODES.MULTIPLE} aria-label="multiple days">
                  {VIEW_MODE_LABELS[VIEW_MODES.MULTIPLE]}
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* Date Picker(s) */}
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              {viewMode === VIEW_MODES.SINGLE ? (
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Select Date
                  </Typography>
                  <DatePicker
                    value={selectedDate}
                    onChange={handleDateChange}
                    shouldDisableDate={shouldDisableDate}
                    minDate={new Date(DATE_CONFIG.MIN_DATE)}
                    maxDate={new Date(DATE_CONFIG.MAX_DATE)}
                    slotProps={{
                      textField: {
                        size: 'small',
                        sx: { width: 200 }
                      }
                    }}
                  />
                </Box>
              ) : (
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      From Date
                    </Typography>
                    <DatePicker
                      value={dateFrom}
                      onChange={setDateFrom}
                      shouldDisableDate={shouldDisableDate}
                      minDate={new Date(DATE_CONFIG.MIN_DATE)}
                      maxDate={dateTo || new Date(DATE_CONFIG.MAX_DATE)}
                      slotProps={{
                        textField: {
                          size: 'small',
                          sx: { width: 180 }
                        }
                      }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      To Date
                    </Typography>
                    <DatePicker
                      value={dateTo}
                      onChange={setDateTo}
                      shouldDisableDate={shouldDisableDate}
                      minDate={dateFrom || new Date(DATE_CONFIG.MIN_DATE)}
                      maxDate={new Date(DATE_CONFIG.MAX_DATE)}
                      slotProps={{
                        textField: {
                          size: 'small',
                          sx: { width: 180 }
                        }
                      }}
                    />
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<TrendingUpIcon />}
                    onClick={handleGenerateChart}
                    disabled={loading}
                    sx={{ height: 40 }}
                  >
                    Generate Chart
                  </Button>
                </Box>
              )}
            </LocalizationProvider>
          </Box>

          {/* Date Range Error */}
          {dateRangeError && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              {dateRangeError}
            </Alert>
          )}

          {/* Info Text */}
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
            {viewMode === VIEW_MODES.SINGLE 
              ? 'View 15-minute interval data for a single day'
              : `View daily data for up to ${DATE_CONFIG.MAX_DATE_RANGE_DAYS} days`}
          </Typography>
        </Box>

        {/* Chart - Show different chart based on view mode */}
        {viewMode === VIEW_MODES.SINGLE ? (
          <ThermalTrendChart 
            data={dailyData}
            onTimeClick={handleTimeClick}
          />
        ) : (
          Object.keys(aggregatedData).length > 0 ? (
            <ThermalCandlestickChart 
              data={aggregatedData}
              onDateClick={handleDateClick}
            />
          ) : (
            <Box sx={{ 
              p: 4, 
              bgcolor: 'white', 
              borderRadius: 1, 
              boxShadow: 1, 
              textAlign: 'center',
              mb: 3
            }}>
              <Typography variant="body1" color="text.secondary">
                {UI_CONFIG.ERROR_MESSAGES.NO_DATA}
              </Typography>
            </Box>
          )
        )}

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
