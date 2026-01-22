// Path: ecosphere-frontend/src/pages/CustomAnalytics.jsx
import React, { useState, useEffect } from 'react';
import {
  Container, Paper, Typography, Box, Button,
  Autocomplete, TextField, CircularProgress, Alert, Chip,
  Stack, ToggleButton, ToggleButtonGroup, Tooltip, IconButton
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import TimelineIcon from '@mui/icons-material/Timeline';
import BarChartIcon from '@mui/icons-material/BarChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import AreaChartIcon from '@mui/icons-material/ssidChart';
import ClearIcon from '@mui/icons-material/Clear';
import DynamicChart from '../components/DynamicChart';
import { SENSORS } from '../data/sensorList';

const TIME_PRESETS = {
  LAST_7_DAYS: 'last7days',
  LAST_30_DAYS: 'last30days',
  LAST_3_MONTHS: 'last3months',
  CUSTOM: 'custom'
};

const CustomAnalytics = () => {
  // State
  const [selectedSensors, setSelectedSensors] = useState([]);
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [preset, setPreset] = useState(TIME_PRESETS.LAST_7_DAYS);
  const [dateRange, setDateRange] = useState(null);
  const [chartType, setChartType] = useState('line');
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null); // For "No Data" states

  // Constants
  const COLORS = ['#DA291C', '#00A3E0', '#6D2077', '#F1C40F'];

  // Fetch available date range on mount
  useEffect(() => {
    const fetchDateRange = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/analytics/date-range');
        const result = await response.json();

        if (result.success) {
          setDateRange(result.dateRange);
          // Set default to last 7 days
          const maxDateStr = result.dateRange.maxDate;
          const maxDate = new Date(maxDateStr + 'T12:00:00');
          const minDate = new Date(maxDate);
          minDate.setDate(minDate.getDate() - 7);

          // Ensure minDate is not before available range
          const availableMinDate = new Date(result.dateRange.minDate + 'T12:00:00');
          if (minDate < availableMinDate) {
            setDateFrom(availableMinDate);
          } else {
            setDateFrom(minDate);
          }
          setDateTo(maxDate);
        }
      } catch (err) {
        console.error('Failed to fetch date range:', err);
      }
    };

    fetchDateRange();
  }, []);

  // Handle preset change
  const handlePresetChange = (_event, newPreset) => {
    if (newPreset === null || !dateRange) return;

    setPreset(newPreset);

    if (newPreset === TIME_PRESETS.CUSTOM) return;

    // Calculate dates based on preset
    const maxDateStr = dateRange.maxDate;
    const maxDate = new Date(maxDateStr + 'T12:00:00');
    let fromDate = new Date(maxDate);

    switch (newPreset) {
      case TIME_PRESETS.LAST_7_DAYS:
        fromDate.setDate(fromDate.getDate() - 7);
        break;
      case TIME_PRESETS.LAST_30_DAYS:
        fromDate.setDate(fromDate.getDate() - 30);
        break;
      case TIME_PRESETS.LAST_3_MONTHS:
        fromDate.setMonth(fromDate.getMonth() - 3);
        break;
      default:
        break;
    }

    // Ensure fromDate is not before minDate
    const minDateStr = dateRange.minDate;
    const minDate = new Date(minDateStr + 'T12:00:00');
    if (fromDate < minDate) {
      fromDate = minDate;
    }

    setDateFrom(fromDate);
    setDateTo(maxDate);
  };

  // Should disable dates outside available range
  const shouldDisableDate = (date) => {
    if (!dateRange) return false;

    const minDateStr = dateRange.minDate;
    const maxDateStr = dateRange.maxDate;
    const minDate = new Date(minDateStr + 'T12:00:00');
    const maxDate = new Date(maxDateStr + 'T12:00:00');

    return date < minDate || date > maxDate;
  };

  const handleGenerate = async () => {
    // 1. Validation: Sensors Selected
    if (selectedSensors.length === 0) {
      setError("Please select at least one sensor.");
      return;
    }

    // 2. Validation: Date Logic
    if (dateFrom && dateTo) {
      if (dateFrom > dateTo) {
        setError("Start Date cannot be after End Date.");
        return;
      }
    }

    setLoading(true);
    setError(null);
    setWarning(null);

    try {
      // Format dates as YYYY-MM-DD
      const formatDate = (date) => {
        if (!date) return null;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const payload = {
        sensors: selectedSensors,
        startDate: formatDate(dateFrom),
        endDate: formatDate(dateTo)
      };

      const response = await fetch('http://localhost:3001/api/analytics/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        processDataForChart(result.results);
      } else {
        setError(result.error || "Failed to fetch data.");
      }
    } catch (err) {
      setError("Network error connecting to analytics engine.");
    } finally {
      setLoading(false);
    }
  };

  const processDataForChart = (results) => {
    const allPoints = [];

    results.forEach((series) => {
      if (series.data && Array.isArray(series.data)) {
        series.data.forEach(point => {
          allPoints.push({
            ts: point.ts,
            [series.name]: parseFloat(point.value)
          });
        });
      }
    });

    // 3. Validation: No Data Returned
    if (allPoints.length === 0) {
      setChartData([]);
      setWarning("No data found for the selected range. Try clearing dates to see the latest available data.");
      return;
    }

    // Sort by timestamp
    allPoints.sort((a, b) => new Date(a.ts) - new Date(b.ts));
    setChartData(allPoints);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 3, mb: 4 }}>
      {/* HEADER */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 2, fontWeight: 600, color: '#324053' }}>
          <TimelineIcon fontSize="large" color="primary" />
          Custom Analytics
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Select sensors, choose a date range (or leave empty for latest data), and visualize trends.
        </Typography>
      </Box>

      {/* CONTROL BAR */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">

          {/* Sensor Selector */}
          <Autocomplete
            multiple
            fullWidth
            options={SENSORS}
            getOptionLabel={(option) => option.label}
            groupBy={(option) => option.category}
            value={selectedSensors}
            onChange={(e, newValue) => {
              if (newValue.length <= 4) setSelectedSensors(newValue);
            }}
            renderInput={(params) => (
              <TextField {...params} label="Select Sensors (Max 4)" placeholder="Search..." size="small" />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  label={option.label}
                  {...getTagProps({ index })}
                  size="small"
                  sx={{ bgcolor: COLORS[index], color: 'white', fontWeight: 'bold' }}
                />
              ))
            }
          />

          {/* Time Range Presets */}
          <Box sx={{ width: '100%' }}>
            <ToggleButtonGroup
              value={preset}
              exclusive
              onChange={handlePresetChange}
              size="small"
              sx={{ mb: 2 }}
            >
              <ToggleButton value={TIME_PRESETS.LAST_7_DAYS}>
                Last 7 Days
              </ToggleButton>
              <ToggleButton value={TIME_PRESETS.LAST_30_DAYS}>
                Last 30 Days
              </ToggleButton>
              <ToggleButton value={TIME_PRESETS.LAST_3_MONTHS}>
                Last 3 Months
              </ToggleButton>
              <ToggleButton value={TIME_PRESETS.CUSTOM}>
                Custom
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Date Pickers */}
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Stack direction="row" spacing={2} alignItems="center">
                <DatePicker
                  label="From Date"
                  value={dateFrom}
                  onChange={(newValue) => {
                    setDateFrom(newValue);
                    setPreset(TIME_PRESETS.CUSTOM);
                  }}
                  shouldDisableDate={shouldDisableDate}
                  slotProps={{
                    textField: {
                      size: 'small',
                      sx: { minWidth: 180 }
                    }
                  }}
                />
                <Typography color="text.secondary">to</Typography>
                <DatePicker
                  label="To Date"
                  value={dateTo}
                  onChange={(newValue) => {
                    setDateTo(newValue);
                    setPreset(TIME_PRESETS.CUSTOM);
                  }}
                  shouldDisableDate={shouldDisableDate}
                  slotProps={{
                    textField: {
                      size: 'small',
                      sx: { minWidth: 180 }
                    }
                  }}
                />
              </Stack>
            </LocalizationProvider>
          </Box>

          {/* Chart Type */}
          <ToggleButtonGroup
            value={chartType}
            exclusive
            onChange={(e, newType) => { if (newType) setChartType(newType); }}
            size="small"
          >
            <ToggleButton value="line"><Tooltip title="Line"><ShowChartIcon /></Tooltip></ToggleButton>
            <ToggleButton value="bar"><Tooltip title="Bar"><BarChartIcon /></Tooltip></ToggleButton>
            <ToggleButton value="area"><Tooltip title="Area"><AreaChartIcon /></Tooltip></ToggleButton>
          </ToggleButtonGroup>

          {/* Action Button */}
          <Button
            variant="contained"
            onClick={handleGenerate}
            disabled={loading || selectedSensors.length === 0}
            sx={{ minWidth: 120, height: 40 }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : "Generate"}
          </Button>
        </Stack>

        {/* Feedback Messages */}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {warning && <Alert severity="warning" sx={{ mt: 2 }}>{warning}</Alert>}

        {/* Available Range Info */}
        {dateRange && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Available Range: {dateRange.minDate} to {dateRange.maxDate}
          </Alert>
        )}
      </Paper>

      {/* CHART AREA */}
      <Box sx={{ height: '65vh', width: '100%' }}>
        <DynamicChart
          data={chartData}
          config={{
            title: "Sensor Analysis",
            type: "multi",
            chartType: chartType,
            series: selectedSensors.map((s, i) => ({
              dataKey: s.label,
              color: COLORS[i]
            }))
          }}
          // Pass warning to show specific empty state message
          customEmptyMessage={warning ? "No data found for this range." : "Select sensors and click Generate to view data."}
        />
      </Box>
    </Container>
  );
};

export default CustomAnalytics;