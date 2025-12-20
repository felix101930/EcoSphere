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
  const [viewMode, setViewMode] = useState('single'); // 'single' or 'multiple'
  const [selectedFloor, setSelectedFloor] = useState('basement'); // 'basement' or 'level1'
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [dailyData, setDailyData] = useState({});
  const [aggregatedData, setAggregatedData] = useState({});
  const [multipleDaysDetailData, setMultipleDaysDetailData] = useState({}); // Store detailed 15-min data for multiple days
  const [currentTimeIndex, setCurrentTimeIndex] = useState(0);
  const [currentDateIndex, setCurrentDateIndex] = useState(0);
  const [dateRangeError, setDateRangeError] = useState(null);

  // Floor configurations
  const floorConfigs = useMemo(() => ({
    basement: {
      name: 'Basement',
      sensorIds: ['20004_TL2', '20005_TL2', '20006_TL2']
    },
    level1: {
      name: 'Level 1',
      sensorIds: ['20007_TL2', '20008_TL2', '20009_TL2', '20010_TL2', '20011_TL2']
    }
  }), []);

  // Get current sensor IDs based on selected floor
  const sensorIds = useMemo(() => floorConfigs[selectedFloor].sensorIds, [selectedFloor, floorConfigs]);

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
        const initialSensorIds = floorConfigs['basement'].sensorIds;
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
  }, [floorConfigs]); // Only run once on mount

  // Handle floor change
  const handleFloorChange = async (event, newFloor) => {
    if (newFloor !== null && newFloor !== selectedFloor) {
      setSelectedFloor(newFloor);
      
      // Reload data for new floor
      if (viewMode === 'single' && selectedDate) {
        try {
          setLoading(true);
          const year = selectedDate.getFullYear();
          const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
          const day = String(selectedDate.getDate()).padStart(2, '0');
          const dateStr = `${year}-${month}-${day}`;
          
          const newSensorIds = floorConfigs[newFloor].sensorIds;
          const data = await ThermalService.getMultipleSensorsDailyData(dateStr, newSensorIds);
          setDailyData(data);
          setCurrentTimeIndex(0);
          setLoading(false);
        } catch (err) {
          console.error('Error loading floor data:', err);
          setError(err.message);
          setLoading(false);
        }
      } else if (viewMode === 'multiple' && dateFrom && dateTo) {
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
          const newSensorIds = floorConfigs[newFloor].sensorIds;

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
      if (newMode === 'single') {
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
      setDateRangeError('Please select both From and To dates');
      return;
    }

    // Validate date range
    const daysDiff = Math.ceil((dateTo - dateFrom) / (1000 * 60 * 60 * 24));
    
    if (daysDiff < 0) {
      setDateRangeError('From date must be before To date');
      return;
    }
    
    if (daysDiff > 30) {
      setDateRangeError('Date range cannot exceed 30 days');
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

  // Get current date string (Multiple Days mode)
  const getCurrentDate = () => {
    const dates = Object.keys(aggregatedData).sort();
    if (dates.length > 0 && dates[currentDateIndex]) {
      const date = new Date(dates[currentDateIndex] + 'T00:00:00');
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    return '';
  };

  // Handle time click from chart (Single Day mode)
  const handleTimeClick = (index) => {
    setCurrentTimeIndex(index);
  };

  // Handle date click from chart (Multiple Days mode)
  const handleDateClick = (index) => {
    setCurrentDateIndex(index);
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
  
  const maxDateIndex = (Object.keys(aggregatedData).length || 1) - 1;

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
                  Basement
                </ToggleButton>
                <ToggleButton value="level1" aria-label="level 1">
                  Level 1
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
                <ToggleButton value="single" aria-label="single day">
                  Single Day
                </ToggleButton>
                <ToggleButton value="multiple" aria-label="multiple days">
                  Multiple Days
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* Date Picker(s) */}
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              {viewMode === 'single' ? (
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Select Date
                  </Typography>
                  <DatePicker
                    value={selectedDate}
                    onChange={handleDateChange}
                    shouldDisableDate={shouldDisableDate}
                    minDate={new Date('2019-01-01')}
                    maxDate={new Date('2020-11-07')}
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
                      minDate={new Date('2019-01-01')}
                      maxDate={dateTo || new Date('2020-11-07')}
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
                      minDate={dateFrom || new Date('2019-01-01')}
                      maxDate={new Date('2020-11-07')}
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
            {viewMode === 'single' 
              ? 'View 15-minute interval data for a single day'
              : 'View daily Open/High/Low/Close candlestick chart for up to 30 days'}
          </Typography>
        </Box>

        {/* Chart - Show different chart based on view mode */}
        {viewMode === 'single' ? (
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
                Select date range and click "Generate Chart" to view data
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
          currentIndex={viewMode === 'single' ? currentTimeIndex : currentTimeIndex}
          maxIndex={viewMode === 'single' ? maxTimeIndex : maxMultipleDaysTimeIndex}
          onIndexChange={setCurrentTimeIndex}
          currentTime={getCurrentTime()}
          mode={viewMode}
          dateList={viewMode === 'multiple' ? Object.keys(aggregatedData).sort() : []}
          detailData={viewMode === 'multiple' ? multipleDaysDetailData : {}}
          sensorIds={sensorIds}
        />
      </Box>
    </>
  );
};

export default ThermalPage;
