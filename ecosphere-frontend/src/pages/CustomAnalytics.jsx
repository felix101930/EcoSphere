// Path: ecosphere-frontend/src/pages/CustomAnalytics.jsx
import React, { useState } from 'react';
import { 
  Container, Paper, Typography, Box, Button, 
  Autocomplete, TextField, CircularProgress, Alert, Chip,
  Stack, ToggleButton, ToggleButtonGroup, Tooltip
} from '@mui/material';
import TimelineIcon from '@mui/icons-material/Timeline';
import BarChartIcon from '@mui/icons-material/BarChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import AreaChartIcon from '@mui/icons-material/ssidChart'; // Proxy for Area
import DynamicChart from '../components/DynamicChart';
import { SENSORS } from '../data/sensorList';

const CustomAnalytics = () => {
  // State
  const [selectedSensors, setSelectedSensors] = useState([]);
  const [dates, setDates] = useState({ start: '', end: '' });
  const [chartType, setChartType] = useState('line');
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [error, setError] = useState(null);

  // Constants
  const COLORS = ['#DA291C', '#00A3E0', '#6D2077', '#F1C40F'];

  const handleGenerate = async () => {
    if (selectedSensors.length === 0) {
      setError("Please select at least one sensor.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Send empty strings as null to trigger Anchor Strategy in backend
      const payload = {
        sensors: selectedSensors,
        startDate: dates.start || null,
        endDate: dates.end || null
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
        if(series.data) {
            series.data.forEach(point => {
                allPoints.push({
                    ts: point.ts,
                    [series.name]: parseFloat(point.value)
                });
            });
        }
    });
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
          
          {/* 1. Sensor Selector (Flex Grow) */}
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

          {/* 2. Date Pickers (Native) */}
          <Stack direction="row" spacing={1}>
            <TextField
                label="Start Date"
                type="date"
                size="small"
                InputLabelProps={{ shrink: true }}
                value={dates.start}
                onChange={(e) => setDates({ ...dates, start: e.target.value })}
                sx={{ width: 150 }}
            />
            <TextField
                label="End Date"
                type="date"
                size="small"
                InputLabelProps={{ shrink: true }}
                value={dates.end}
                onChange={(e) => setDates({ ...dates, end: e.target.value })}
                sx={{ width: 150 }}
            />
          </Stack>

          {/* 3. Chart Type Toggle */}
          <ToggleButtonGroup
            value={chartType}
            exclusive
            onChange={(e, newType) => { if(newType) setChartType(newType); }}
            size="small"
          >
            <ToggleButton value="line">
                <Tooltip title="Line Chart"><ShowChartIcon /></Tooltip>
            </ToggleButton>
            <ToggleButton value="bar">
                <Tooltip title="Bar Chart"><BarChartIcon /></Tooltip>
            </ToggleButton>
            <ToggleButton value="area">
                <Tooltip title="Area Chart"><AreaChartIcon /></Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>

          {/* 4. Action Button */}
          <Button 
            variant="contained" 
            onClick={handleGenerate}
            disabled={loading || selectedSensors.length === 0}
            sx={{ minWidth: 120, height: 40 }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : "Generate"}
          </Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Paper>

      {/* CHART AREA - TALLER */}
      <Box sx={{ height: '65vh', width: '100%' }}>
        <DynamicChart 
            data={chartData} 
            config={{ 
                title: "Sensor Analysis",
                type: "multi",
                chartType: chartType, // Pass the selected visual style
                series: selectedSensors.map((s, i) => ({ 
                    dataKey: s.label, 
                    color: COLORS[i] 
                }))
            }} 
        />
      </Box>
    </Container>
  );
};

export default CustomAnalytics;