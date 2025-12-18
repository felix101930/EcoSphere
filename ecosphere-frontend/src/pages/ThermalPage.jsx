// Thermal Page - Main thermal dashboard
import { useState, useEffect } from 'react';
import { Box, CircularProgress, Alert, TextField } from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import PageHeader from '../components/Common/PageHeader';
import ThermalTrendChart from '../components/Thermal/ThermalTrendChart';
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
  const [selectedDate, setSelectedDate] = useState(null);
  const [dailyData, setDailyData] = useState({});
  const [currentTimeIndex, setCurrentTimeIndex] = useState(0);

  // Sensor IDs
  const sensorIds = ['20004_TL2', '20005_TL2', '20006_TL2'];

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

        // Load data for that date
        const data = await ThermalService.getMultipleSensorsDailyData(lastDate, sensorIds);
        setDailyData(data);

        // Set to last time index
        const recordCount = data['20004_TL2']?.length || 0;
        setCurrentTimeIndex(recordCount > 0 ? recordCount - 1 : 0);

        setLoading(false);
      } catch (err) {
        console.error('Error loading initial data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Load data when date changes
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

  // Check if date should be disabled
  const shouldDisableDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return !availableDates.includes(dateStr);
  };

  // Get current data for the selected time index
  const getCurrentData = () => {
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
  };

  // Get current time string
  const getCurrentTime = () => {
    const sensorData = dailyData['20004_TL2'];
    if (sensorData && sensorData[currentTimeIndex]) {
      return ThermalService.parseTime(sensorData[currentTimeIndex].ts);
    }
    return '00:00';
  };

  // Handle time click from chart
  const handleTimeClick = (index) => {
    setCurrentTimeIndex(index);
  };

  const maxIndex = (dailyData['20004_TL2']?.length || 1) - 1;

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
        {/* Date Picker */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'white', borderRadius: 1, boxShadow: 1 }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Select Date"
              value={selectedDate}
              onChange={handleDateChange}
              shouldDisableDate={shouldDisableDate}
              minDate={new Date('2019-01-01')}
              maxDate={new Date('2020-11-07')}
              renderInput={(params) => <TextField {...params} />}
              slotProps={{
                textField: {
                  fullWidth: false,
                  sx: { maxWidth: 300 }
                }
              }}
            />
          </LocalizationProvider>
        </Box>

        {/* Trend Chart */}
        <ThermalTrendChart 
          data={dailyData}
          onTimeClick={handleTimeClick}
        />

        {/* Floor Plan */}
        <ThermalFloorPlan 
          currentData={getCurrentData()}
        />

        {/* Time Slider */}
        <ThermalTimeSlider
          currentIndex={currentTimeIndex}
          maxIndex={maxIndex}
          onIndexChange={setCurrentTimeIndex}
          currentTime={getCurrentTime()}
        />
      </Box>
    </>
  );
};

export default ThermalPage;
