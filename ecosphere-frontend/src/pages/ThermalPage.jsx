// Thermal Page - Main thermal dashboard
import { useState, useEffect, useMemo } from 'react';
import { Box, CircularProgress, Alert, TextField, ToggleButton, ToggleButtonGroup, Typography, Button } from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PageHeader from '../components/Common/PageHeader';
import ThermalTrendChart from '../components/Thermal/ThermalTrendChart';
import ThermalCandlestickChart from '../components/Thermal/ThermalCandlestickChart';
import ThermalFloorPlan from '../components/Thermal/ThermalFloorPlan';
import ThermalTimeSlider from '../components/Thermal/ThermalTimeSlider';
import ThermalService from '../services/ThermalService';
import {
  FLOOR_CONFIGS,
  VIEW_MODES,
  VIEW_MODE_LABELS,
  DATE_CONFIG,
  DEFAULTS,
  UI_CONFIG
} from '../lib/constants/thermal';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [viewMode, setViewMode] = useState(DEFAULTS.VIEW_MODE);
  const [selectedFloor, setSelectedFloor] = useState(DEFAULTS.FLOOR);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [dailyData, setDailyData] = useState({});
  const [aggregatedData, setAggregatedData] = useState({});
  const [multipleDaysDetailData, setMultipleDaysDetailData] = useState({});
  const [currentTimeIndex, setCurrentTimeIndex] = useState(DEFAULTS.TIME_INDEX);
  // eslint-disable-next-line no-unused-vars
  const [currentDateIndex, setCurrentDateIndex] = useState(DEFAULTS.DATE_INDEX);
  const [dateRangeError, setDateRangeError] = useState(null);

  // Get current sensor IDs based on selected floor
  const sensorIds = useMemo(() => FLOOR_CONFIGS[selectedFloor].sensorIds, [selectedFloor]);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get last complete date
        const lastDate = await ThermalService.getLastCompleteDate();
        
        // Get available dates
        const dates = await ThermalService.getAvailableDates();
        setAvailableDates(dates);

        // Set selected date
        const dateObj = new Date(lastDate + 'T00:00:00');
        setSelectedDate(dateObj);

        // Load data for that date using initial floor (basement)
        const initialSensorIds = FLOOR_CONFIGS[DEFAULTS.FLOOR].sensorIds;
        const data = await ThermalService.getMultipleSensorsDailyData(lastDate, initialSensorIds);
        setDailyData(data);

        // Set to last time index
        const firstSensorId = initialSensorIds[0];
        const recordCount = data[firstSensorId]?.length || 0;
        setCurrentTimeIndex(recordCount > 0 ? recordCount - 1 : 0);

        setLoading(false);
      } catch (err) {
        console.error('Error loading initial data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadInitialData();
  }, []); // Only run once on mount

  // Handle floor change
  const handleFloorChange = async (event, newFloor) => {
    if (newFloor !== null && newFloor !== selectedFloor) {
      setSelectedFloor(newFloor);
      
      // Reload data for new floor
      if (viewMode === VIEW_MODES.SINGLE && selectedDate) {
        try {
          setLoading(true);
          const year = selectedDate.getFullYear();
          const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
          const day = String(selectedDate.getDate()).padStart(2, '0');
          const dateStr = `${year}-${month}-${day}`;
          
          const newSensorIds = FLOOR_CONFIGS[newFloor].sensorIds;
          const data = await ThermalService.getMultipleSensorsDailyData(dateStr, newSensorIds);
          setDailyData(data);
          setCurrentTimeIndex(0);
          setLoading(false);
        } catch (err) {
          console.error('Error loading floor data:', err);
          setError(err.message);
          setLoading(false);
        }
      } else if (viewMode === VIEW_MODES.MULTIPLE && dateFrom && dateTo) {
        // Regenerate chart for new floor if dates are selected
        try {
          setLoading(true);
          const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          };

          const dateFromStr = formatDate(dateFrom);
          const dateToStr = formatDate(dateTo);
          const newSensorIds = FLOOR_CONFIGS[newFloor].sensorIds;

          const data = await ThermalService.getAggregatedData(dateFromStr, dateToStr, newSensorIds);
          setAggregatedData(data);
          
          // Load detailed data for new floor
          const dates = Object.keys(data).sort();
          const detailDataPromises = dates.map(date => 
            ThermalService.getMultipleSensorsDailyData(date, newSensorIds)
          );
          const detailDataResults = await Promise.all(detailDataPromises);
          
          const detailDataByDate = {};
          dates.forEach((date, index) => {
            detailDataByDate[date] = detailDataResults[index];
          });
          
          setMultipleDaysDetailData(detailDataByDate);
          setCurrentTimeIndex(0);
          setCurrentDateIndex(0);
          setLoading(false);
        } catch (err) {
          console.error('Error loading floor data:', err);
          setError(err.message);
          setLoading(false);
        }
      }
    }
  };

  // Handle view mode change
  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
      setDateRangeError(null);
      
      // Reset data when switching modes
      if (newMode === VIEW_MODES.SINGLE) {
        setDateFrom(null);
        setDateTo(null);
        setAggregatedData({});
        setMultipleDaysDetailData({});
      } else {
        setDailyData({});
      }
    }
  };

  // Load data when date changes (Single Day mode)
  const handleDateChange = async (newDate) => {
    if (!newDate) return;

    try {
      setLoading(true);
      setSelectedDate(newDate);

      // Format date as YYYY-MM-DD
      const year = newDate.getFullYear();
      const month = String(newDate.getMonth() + 1).padStart(2, '0');
      const day = String(newDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      // Load data
      const data = await ThermalService.getMultipleSensorsDailyData(dateStr, sensorIds);
      setDailyData(data);

      // Reset to first time index
      setCurrentTimeIndex(0);

      setLoading(false);
    } catch (err) {
      console.error('Error loading date data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Generate chart for Multiple Days mode
  const handleGenerateChart = async () => {
    // Validate both dates are selected
    if (!dateFrom || !dateTo) {
      setDateRangeError(UI_CONFIG.ERROR_MESSAGES.NO_DATES);
      return;
    }

    // Validate date range
    const daysDiff = Math.ceil((dateTo - dateFrom) / (1000 * 60 * 60 * 24));
    
    if (daysDiff < 0) {
      setDateRangeError(UI_CONFIG.ERROR_MESSAGES.INVALID_RANGE);
      return;
    }
    
    if (daysDiff > DATE_CONFIG.MAX_DATE_RANGE_DAYS) {
      setDateRangeError(UI_CONFIG.ERROR_MESSAGES.RANGE_TOO_LARGE);
      return;
    }

    try {
      setLoading(true);
      setDateRangeError(null);

      // Format dates as YYYY-MM-DD
      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const dateFromStr = formatDate(dateFrom);
      const dateToStr = formatDate(dateTo);

      // Load aggregated data for chart (using current floor's sensor IDs)
      const aggData = await ThermalService.getAggregatedData(dateFromStr, dateToStr, sensorIds);
      setAggregatedData(aggData);

      // Load detailed 15-min data for all days in range
      const dates = Object.keys(aggData).sort();
      const detailDataPromises = dates.map(date => 
        ThermalService.getMultipleSensorsDailyData(date, sensorIds)
      );
      const detailDataResults = await Promise.all(detailDataPromises);
      
      // Organize by date
      const detailDataByDate = {};
      dates.forEach((date, index) => {
        detailDataByDate[date] = detailDataResults[index];
      });
      
      setMultipleDaysDetailData(detailDataByDate);

      // Reset to first time index
      setCurrentTimeIndex(0);
      setCurrentDateIndex(0);

      setLoading(false);
    } catch (err) {
      console.error('Error loading aggregated data:', err);
      setError(err.message);
      setLoading(false);
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

  // Get current data for the selected time index (Single Day mode)
  const getCurrentData = () => {
    if (viewMode === 'single') {
      const currentData = {};
      sensorIds.forEach(sensorId => {
        const sensorData = dailyData[sensorId];
        if (sensorData && sensorData[currentTimeIndex]) {
          currentData[sensorId] = sensorData[currentTimeIndex].value;
        } else {
          currentData[sensorId] = null;
        }
      });
      return currentData;
    } else {
      // Multiple Days mode - show temperature for current time point
      if (Object.keys(multipleDaysDetailData).length > 0) {
        const allTimePoints = [];
        const dates = Object.keys(multipleDaysDetailData).sort();
        
        // Flatten all time points from all dates
        dates.forEach(date => {
          const dateData = multipleDaysDetailData[date];
          if (dateData && dateData[sensorIds[0]]) {
            dateData[sensorIds[0]].forEach((record, idx) => {
              allTimePoints.push({ date, timeIndex: idx });
            });
          }
        });
        
        if (allTimePoints[currentTimeIndex]) {
          const { date, timeIndex } = allTimePoints[currentTimeIndex];
          const currentData = {};
          sensorIds.forEach(sensorId => {
            const dateData = multipleDaysDetailData[date];
            if (dateData && dateData[sensorId] && dateData[sensorId][timeIndex]) {
              currentData[sensorId] = dateData[sensorId][timeIndex].value;
            } else {
              currentData[sensorId] = null;
            }
          });
          return currentData;
        }
      }
      return {};
    }
  };

  // Get current time string (Single Day mode or Multiple Days mode)
  const getCurrentTime = () => {
    if (viewMode === 'single') {
      const firstSensorId = sensorIds[0];
      const sensorData = dailyData[firstSensorId];
      if (sensorData && sensorData[currentTimeIndex]) {
        return ThermalService.parseTime(sensorData[currentTimeIndex].ts);
      }
      return '00:00';
    } else {
      // Multiple Days mode - show date and time
      if (Object.keys(multipleDaysDetailData).length > 0) {
        const allTimePoints = [];
        const dates = Object.keys(multipleDaysDetailData).sort();
        
        // Flatten all time points from all dates
        dates.forEach(date => {
          const dateData = multipleDaysDetailData[date];
          if (dateData && dateData[sensorIds[0]]) {
            dateData[sensorIds[0]].forEach((record) => {
              allTimePoints.push({ date, ts: record.ts });
            });
          }
        });
        
        if (allTimePoints[currentTimeIndex]) {
          const { date, ts } = allTimePoints[currentTimeIndex];
          const dateObj = new Date(date + 'T00:00:00');
          const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const timeStr = ThermalService.parseTime(ts);
          return `${dateStr} ${timeStr}`;
        }
      }
      return '';
    }
  };

  // Handle time click from chart (Single Day mode)
  const handleTimeClick = (index) => {
    setCurrentTimeIndex(index);
  };

  // Handle date click from chart (Multiple Days mode)
  const handleDateClick = (index) => {
    setCurrentDateIndex(index);
    // Calculate the time index for the start of the clicked date
    if (Object.keys(multipleDaysDetailData).length > 0) {
      const dates = Object.keys(multipleDaysDetailData).sort();
      let cumulativeIndex = 0;
      for (let i = 0; i < index && i < dates.length; i++) {
        const dateData = multipleDaysDetailData[dates[i]];
        if (dateData && dateData[sensorIds[0]]) {
          cumulativeIndex += dateData[sensorIds[0]].length;
        }
      }
      setCurrentTimeIndex(cumulativeIndex);
    }
  };

  const maxTimeIndex = sensorIds[0] && dailyData[sensorIds[0]] ? (dailyData[sensorIds[0]].length - 1) : 0;
  
  // Calculate max time index for multiple days mode (all 15-min intervals across all days)
  const maxMultipleDaysTimeIndex = (() => {
    if (Object.keys(multipleDaysDetailData).length === 0) return 0;
    let totalPoints = 0;
    const dates = Object.keys(multipleDaysDetailData).sort();
    dates.forEach(date => {
      const dateData = multipleDaysDetailData[date];
      if (dateData && dateData[sensorIds[0]]) {
        totalPoints += dateData[sensorIds[0]].length;
      }
    });
    return Math.max(0, totalPoints - 1);
  })();

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
          currentData={getCurrentData()}
          floor={selectedFloor}
        />

        {/* Time/Date Slider */}
        <ThermalTimeSlider
          currentIndex={viewMode === VIEW_MODES.SINGLE ? currentTimeIndex : currentTimeIndex}
          maxIndex={viewMode === VIEW_MODES.SINGLE ? maxTimeIndex : maxMultipleDaysTimeIndex}
          onIndexChange={setCurrentTimeIndex}
          currentTime={getCurrentTime()}
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
