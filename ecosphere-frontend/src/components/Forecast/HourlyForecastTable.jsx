import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Chip,
  Tooltip,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import CloudIcon from '@mui/icons-material/Cloud';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import OpacityIcon from '@mui/icons-material/Opacity';
import WarningIcon from '@mui/icons-material/Warning';

const HourlyForecastTable = ({ forecastData, title = "Hourly Forecast Details" }) => {
  const [tabValue, setTabValue] = React.useState(0);
  
  if (!forecastData || !forecastData.data || forecastData.data.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          No hourly forecast data available
        </Typography>
      </Box>
    );
  }

  // Separate data: hours WITH weather vs hours WITHOUT weather
  const hoursWithWeather = forecastData.data.filter(hour => 
    hour.weather && (hour.weather.uv_index !== undefined || hour.weather.clouds_pct !== undefined)
  );
  
  const hoursWithoutWeather = forecastData.data.filter(hour => 
    !hour.weather || (hour.weather.uv_index === undefined && hour.weather.clouds_pct === undefined)
  );

  // Get weather icon
  const getWeatherIcon = (weatherMain) => {
    switch (weatherMain?.toLowerCase()) {
      case 'clear':
        return <WbSunnyIcon fontSize="small" sx={{ color: '#FF9800' }} />;
      case 'clouds':
        return <CloudIcon fontSize="small" sx={{ color: '#9E9E9E' }} />;
      case 'rain':
      case 'drizzle':
        return <OpacityIcon fontSize="small" sx={{ color: '#2196F3' }} />;
      case 'snow':
        return <span>❄️</span>;
      default:
        return <WbSunnyIcon fontSize="small" sx={{ color: '#757575' }} />;
    }
  };

  // Get power level chip
  const getPowerLevelChip = (power) => {
    if (power > 5) return <Chip label="High" size="small" color="success" />;
    if (power > 2) return <Chip label="Medium" size="small" color="warning" />;
    return <Chip label="Low" size="small" color="default" />;
  };

  // Render table rows
  const renderTableRows = (hours) => {
    return hours.map((hour, index) => {
      const time = new Date(hour.timestamp);
      const formattedTime = time.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
      const dateStr = time.toLocaleDateString([], { 
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });

      const hasWeatherData = hour.weather && (
        hour.weather.uv_index !== undefined || 
        hour.weather.clouds_pct !== undefined || 
        hour.weather.temperature_c !== undefined
      );

      return (
        <TableRow 
          key={index}
          sx={{ 
            '&:nth-of-type(odd)': { backgroundColor: hasWeatherData ? 'white' : 'action.hover' },
            '&:hover': { backgroundColor: 'action.selected' }
          }}
        >
          <TableCell>
            <Box>
              <Typography variant="body2" fontWeight="medium">
                {formattedTime}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {dateStr}
              </Typography>
            </Box>
          </TableCell>
          
          <TableCell align="center">
            <Typography variant="body1" fontWeight="bold" color="primary">
              {hour.predicted_kw.toFixed(2)} kW
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {hour.is_daylight ? '☀️ Day' : '🌙 Night'}
            </Typography>
          </TableCell>
          
          <TableCell align="center">
            {getPowerLevelChip(hour.predicted_kw)}
          </TableCell>
          
          {/* UV Index */}
          <TableCell align="center">
            {hasWeatherData && hour.weather.uv_index !== undefined ? (
              <Tooltip title={`UV Index: ${hour.weather.uv_index.toFixed(1)}`}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                  <WbSunnyIcon fontSize="small" sx={{ 
                    color: hour.weather.uv_index > 5 ? '#F44336' : 
                           hour.weather.uv_index > 3 ? '#FF9800' : '#4CAF50'
                  }} />
                  <Typography variant="body2">
                    {hour.weather.uv_index.toFixed(1)}
                  </Typography>
                </Box>
              </Tooltip>
            ) : (
              <Tooltip title="Weather data not available for this hour">
                <Typography variant="body2" color="text.disabled" fontStyle="italic">
                  —
                </Typography>
              </Tooltip>
            )}
          </TableCell>
          
          {/* Cloud Cover */}
          <TableCell align="center">
            {hasWeatherData && hour.weather.clouds_pct !== undefined ? (
              <Tooltip title={`Cloud Cover: ${hour.weather.clouds_pct}%`}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                  <CloudIcon fontSize="small" sx={{ 
                    color: hour.weather.clouds_pct > 80 ? '#616161' : 
                           hour.weather.clouds_pct > 50 ? '#9E9E9E' : '#BDBDBD'
                  }} />
                  <Typography variant="body2">
                    {hour.weather.clouds_pct}%
                  </Typography>
                </Box>
              </Tooltip>
            ) : (
              <Tooltip title="Weather data not available for this hour">
                <Typography variant="body2" color="text.disabled" fontStyle="italic">
                  —
                </Typography>
              </Tooltip>
            )}
          </TableCell>
          
          {/* Temperature */}
          <TableCell align="center">
            {hasWeatherData && hour.weather.temperature_c !== undefined ? (
              <Tooltip title={`Temperature: ${hour.weather.temperature_c.toFixed(1)}°C`}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                  <ThermostatIcon fontSize="small" sx={{ 
                    color: hour.weather.temperature_c > 25 ? '#F44336' : 
                           hour.weather.temperature_c > 15 ? '#4CAF50' : '#2196F3'
                  }} />
                  <Typography variant="body2">
                    {hour.weather.temperature_c.toFixed(1)}°C
                  </Typography>
                </Box>
              </Tooltip>
            ) : (
              <Tooltip title="Weather data not available for this hour">
                <Typography variant="body2" color="text.disabled" fontStyle="italic">
                  —
                </Typography>
              </Tooltip>
            )}
          </TableCell>
          
          {/* Weather Description */}
          <TableCell align="center">
            {hasWeatherData && hour.weather.weather_main ? (
              <Tooltip title={hour.weather.weather_description || hour.weather.weather_main}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getWeatherIcon(hour.weather.weather_main)}
                  <Typography variant="body2">
                    {hour.weather.weather_main}
                  </Typography>
                </Box>
              </Tooltip>
            ) : (
              <Tooltip title="Weather data not available">
                <Typography variant="body2" color="text.disabled" fontStyle="italic">
                  —
                </Typography>
              </Tooltip>
            )}
          </TableCell>
        </TableRow>
      );
    });
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AccessTimeIcon />
        {title}
      </Typography>
      
      {/* Warning if some hours lack weather data */}
      {hoursWithoutWeather.length > 0 && (
        <Alert 
          severity="info" 
          icon={<WarningIcon />}
          sx={{ mb: 2 }}
        >
          <Typography variant="body2">
            <strong>Note:</strong> {hoursWithoutWeather.length} out of {forecastData.data.length} hours 
            don't have weather data. Showing power predictions only.
          </Typography>
        </Alert>
      )}
      
      {/* Tabs for toggling between all hours and hours with weather */}
      {hoursWithoutWeather.length > 0 && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="forecast tabs">
            <Tab 
              label={`All Hours (${forecastData.data.length})`}
              sx={{ minWidth: 'auto', px: 2 }}
            />
            <Tab 
              label={`With Weather Data (${hoursWithWeather.length})`}
              sx={{ minWidth: 'auto', px: 2 }}
            />
          </Tabs>
        </Box>
      )}
      
      <TableContainer 
        component={Paper} 
        sx={{ 
          maxHeight: 400, 
          overflow: 'auto',
          border: hoursWithoutWeather.length > 0 ? '1px solid #e0e0e0' : 'none'
        }}
      >
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Time</strong></TableCell>
              <TableCell align="center"><strong>Power (kW)</strong></TableCell>
              <TableCell align="center"><strong>Level</strong></TableCell>
              <TableCell align="center">
                <Tooltip title="Ultraviolet Index">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                    <WbSunnyIcon fontSize="small" /> UV
                  </Box>
                </Tooltip>
              </TableCell>
              <TableCell align="center">
                <Tooltip title="Cloud Cover">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                    <CloudIcon fontSize="small" /> Clouds
                  </Box>
                </Tooltip>
              </TableCell>
              <TableCell align="center">
                <Tooltip title="Temperature">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                    <ThermostatIcon fontSize="small" /> Temp
                  </Box>
                </Tooltip>
              </TableCell>
              <TableCell align="center"><strong>Weather</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tabValue === 0 
              ? renderTableRows(forecastData.data) // All hours
              : renderTableRows(hoursWithWeather)   // Only hours with weather
            }
          </TableBody>
        </Table>
      </TableContainer>

      {/* Summary Statistics */}
      <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Hourly Summary
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }, gap: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Total Energy</Typography>
            <Typography variant="body2" fontWeight="bold">
              {forecastData.summary?.total_kwh?.toFixed(1) || '0.0'} kWh
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Peak Power</Typography>
            <Typography variant="body2" fontWeight="bold">
              {forecastData.summary?.peak_kw?.toFixed(2) || '0.00'} kW
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Avg per Hour</Typography>
            <Typography variant="body2" fontWeight="bold">
              {forecastData.data.length > 0 
                ? (forecastData.summary?.total_kwh / forecastData.data.length).toFixed(2) 
                : '0.00'} kW
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Hours with Weather</Typography>
            <Typography variant="body2" fontWeight="bold">
              {hoursWithWeather.length} / {forecastData.data.length}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default HourlyForecastTable;