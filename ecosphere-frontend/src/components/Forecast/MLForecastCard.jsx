import { 
  Card, CardContent, Typography, Box, Chip, Alert, 
  CircularProgress, Divider, Tooltip, Grid, LinearProgress, Button
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PsychologyIcon from '@mui/icons-material/Psychology';
import CloudIcon from '@mui/icons-material/Cloud';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import ThermostatIcon from '@mui/icons-material/Thermostat';

const MLForecastCard = ({ forecast, loading, apiStats, forecastHours, mlForecast }) => {
  if (loading) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading AI forecast with weather data...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (!forecast || !forecast.data) {
    return null;
  }

  const { summary, model_info, data, ui_metadata, api_stats } = forecast;
  
  // Calculate weather stats
  const weatherData = data.filter(d => d.weather);
  const avgUV = weatherData.length > 0 
    ? weatherData.reduce((sum, d) => sum + (d.weather.uv_index || 0), 0) / weatherData.length 
    : 0;
  const avgClouds = weatherData.length > 0
    ? weatherData.reduce((sum, d) => sum + (d.weather.clouds_pct || 0), 0) / weatherData.length
    : 0;
  const avgTemp = weatherData.length > 0
    ? weatherData.reduce((sum, d) => sum + (d.weather.temperature_c || 0), 0) / weatherData.length
    : 0;

  // Weather quality indicator
  const getWeatherQuality = () => {
    if (!model_info?.weather_integrated) return { label: "No Weather Data", color: "default", icon: "❓" };
    
    if (avgUV > 5 && avgClouds < 20) return { label: "Excellent", color: "success", icon: "☀️" };
    if (avgUV > 3 && avgClouds < 40) return { label: "Good", color: "info", icon: "⛅" };
    if (avgUV > 1 && avgClouds < 60) return { label: "Fair", color: "warning", icon: "🌥️" };
    return { label: "Poor", color: "error", icon: "☁️" };
  };

  const weatherQuality = getWeatherQuality();

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        {/* Header with Weather Integration */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PsychologyIcon fontSize="small" />
              🤖 AI Solar Forecast with Weather Data
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1, flexWrap: 'wrap' }}>
              <Chip 
                label={model_info?.name || 'ML Model'} 
                size="small" 
                color="primary" 
                variant="outlined"
              />
              {model_info?.r2_score && (
                <Chip 
                  label={`R²: ${model_info.r2_score.toFixed(3)}`}
                  size="small"
                  color="secondary"
                  variant="outlined"
                />
              )}
              <Chip 
                label={`${data.length} hours`}
                size="small"
                sx={{ backgroundColor: '#e3f2fd', color: '#1976d2' }}
              />
              <Chip 
                label={weatherQuality.label}
                size="small"
                color={weatherQuality.color}
                icon={<span>{weatherQuality.icon}</span>}
              />
            </Box>
          </Box>
          <Chip 
            icon={<WarningAmberIcon fontSize="small" />}
            label="For Reference Only"
            size="small"
            color="warning"
            variant="outlined"
          />
        </Box>

        {/* Hours shown and daytime info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Chip 
            label={`${data.length} hours shown`}
            size="small"
            sx={{ backgroundColor: '#e3f2fd', color: '#1976d2' }}
          />
          {forecastHours && forecastHours > data.length && (
            <Tooltip title={`${forecastHours - data.length} nighttime hours excluded`}>
              <Chip 
                label="Daytime only" 
                size="small" 
                color="info"
                variant="outlined"
              />
            </Tooltip>
          )}
        </Box>

        {/* Full dataset availability alert */}
        {mlForecast && mlForecast.data && mlForecast.data.length > data.length && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2">
                Full 48-hour dataset available ({mlForecast.data.length} predictions)
              </Typography>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => {
                  // You can add a function to show full dataset
                  console.log('Full dataset:', mlForecast.data);
                }}
              >
                View All
              </Button>
            </Box>
          </Alert>
        )}

        {/* API Usage Stats */}
        {apiStats && (
    <Box sx={{ mb: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
            📊 API Usage Today
        </Typography>
        {apiStats.success ? (
            <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {/* Progress bar */}
                    <Box sx={{ flexGrow: 1 }}>
                        {/* Progress logic here */}
                    </Box>
                    <Typography variant="caption">
                        {apiStats.calls_today}/{apiStats.max_calls_per_day} calls
                    </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                    {apiStats.remaining_calls} calls remaining • Resets daily
                </Typography>
            </>
        ) : (
            <Typography variant="caption" color="text.secondary">
                ⚠️ API stats unavailable
            </Typography>
        )}
    </Box>
)}

        {/* Weather Summary */}
        {model_info?.weather_integrated && weatherData.length > 0 && (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              🌤️ Weather Conditions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <WbSunnyIcon fontSize="small" sx={{ color: '#FF9800', mb: 0.5 }} />
                  <Typography variant="caption" display="block" color="text.secondary">
                    UV Index
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {avgUV.toFixed(1)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <CloudIcon fontSize="small" sx={{ color: '#9E9E9E', mb: 0.5 }} />
                  <Typography variant="caption" display="block" color="text.secondary">
                    Cloud Cover
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {avgClouds.toFixed(0)}%
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <ThermostatIcon fontSize="small" sx={{ color: '#F44336', mb: 0.5 }} />
                  <Typography variant="caption" display="block" color="text.secondary">
                    Temperature
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {avgTemp.toFixed(1)}°C
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" display="block" color="text.secondary">
                    Data Quality
                  </Typography>
                  <Chip 
                    label={weatherQuality.label}
                    size="small"
                    sx={{ 
                      mt: 0.5,
                      bgcolor: weatherQuality.color === 'success' ? '#e8f5e9' :
                               weatherQuality.color === 'warning' ? '#fff3e0' :
                               weatherQuality.color === 'error' ? '#ffebee' : '#f5f5f5',
                      color: weatherQuality.color === 'success' ? '#2e7d32' :
                             weatherQuality.color === 'warning' ? '#f57c00' :
                             weatherQuality.color === 'error' ? '#d32f2f' : '#616161'
                    }}
                  />
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Key Metrics */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
  <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, textAlign: 'center', height: '100%' }}>
    <Typography variant="subtitle2" color="text.secondary">
      Total Generation
    </Typography>
    <Typography variant="h5" fontWeight="bold" color="primary">
      {forecast?.summary?.total_kwh?.toFixed(1) || '0.0'} kWh
    </Typography>
    <Typography variant="caption" color="text.secondary">
      Next {forecast?.summary?.actual_hours_shown || forecast?.summary?.prediction_count || 0} hours
      {forecast?.summary?.excluded_night_hours > 0 && (
        <Tooltip title={`${forecast.summary.excluded_night_hours} nighttime hours excluded`}>
          <Chip 
            label="Daytime only" 
            size="small" 
            sx={{ ml: 1, height: 18 }} 
          />
        </Tooltip>
      )}
    </Typography>
  </Box>
</Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, textAlign: 'center', height: '100%' }}>
              <Typography variant="subtitle2" color="text.secondary">
                Peak Output
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="secondary">
                {summary?.peak_kw?.toFixed(2) || '0.00'} kW
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Maximum power
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, textAlign: 'center', height: '100%' }}>
              <Typography variant="subtitle2" color="text.secondary">
                Avg Hourly
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="info.main">
                {summary?.total_kwh && data.length 
                  ? (summary.total_kwh / data.length).toFixed(2) 
                  : '0.00'} kW
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Per hour average
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, textAlign: 'center', height: '100%' }}>
              <Typography variant="subtitle2" color="text.secondary">
                Weather Data
              </Typography>
              <Typography variant="h5" fontWeight="bold" color={model_info?.weather_integrated ? "success.main" : "warning.main"}>
                {model_info?.weather_integrated ? 'Yes' : 'No'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {weatherData.length} points
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Model Details */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            🤖 Model Details
          </Typography>
          <Typography variant="body2" paragraph>
            This forecast uses a <strong>{model_info?.name || 'machine learning'}</strong> model with 
            <strong> {model_info?.features_used || 17} features</strong> including real-time weather data.
            Model accuracy (R²): <strong>{model_info?.r2_score?.toFixed(3) || '0.693'}</strong>
          </Typography>
          {model_info?.weather_integrated ? (
            <Typography variant="caption" color="text.secondary" display="block">
              ✅ Using real weather data from OpenWeather API
            </Typography>
          ) : (
            <Typography variant="caption" color="text.secondary" display="block">
              ⚠️ Using default weather values (API unavailable or disabled)
            </Typography>
          )}
        </Box>

        {/* Important Disclaimer */}
        <Alert 
          severity="warning" 
          icon={<WarningAmberIcon />}
          sx={{ mt: 2 }}
        >
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            ⚠️ Important Notice
          </Typography>
          <Typography variant="body2">
            This AI forecast is for <strong>reference purposes only</strong>. Actual solar generation may vary due to:
          </Typography>
          <Box component="ul" sx={{ pl: 2, mt: 1, mb: 0 }}>
            <li><Typography variant="body2">Real-time weather changes</Typography></li>
            <li><Typography variant="body2">Equipment performance variations</Typography></li>
            <li><Typography variant="body2">Panel maintenance status</Typography></li>
            <li><Typography variant="body2">Environmental factors (shading, dust, etc.)</Typography></li>
          </Box>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Forecast is limited to {data.length} hours ({data.length > 24 ? '48' : '24'}-hour max for accuracy).
            Data cached for 10 minutes to reduce API calls.
          </Typography>
        </Alert>

        {/* Sample Data Preview */}
        {data && data.length > 0 && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Sample Predictions (First 6 hours)
            </Typography>
            <Grid container spacing={1} sx={{ mt: 1 }}>
              {data.slice(0, 6).map((pred, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Box 
                    sx={{ 
                      p: 1.5, 
                      bgcolor: pred.predicted_kw > 5 ? '#e8f5e9' : 
                              pred.predicted_kw > 2 ? '#fff3e0' : '#f5f5f5',
                      borderRadius: 1,
                      borderLeft: `4px solid ${
                        pred.predicted_kw > 5 ? '#4caf50' : 
                        pred.predicted_kw > 2 ? '#ff9800' : '#9e9e9e'
                      }`,
                      height: '100%'
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" display="block">
                      {new Date(pred.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {pred.predicted_kw.toFixed(2)} kW
                    </Typography>
                    {pred.weather && (
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          ☀️ UV: {pred.weather.uv_index?.toFixed(1) || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          ☁️ Clouds: {pred.weather.clouds_pct?.toFixed(0) || 'N/A'}%
                        </Typography>
                      </Box>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {pred.predicted_kw > 5 ? 'Good ☀️' : 
                       pred.predicted_kw > 2 ? 'Moderate ⛅' : 'Low 🌤️'}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default MLForecastCard;