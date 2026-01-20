import { 
  Card, CardContent, Typography, Box, Chip, Alert, 
  CircularProgress, Divider, Tooltip, Grid, LinearProgress, Button
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PsychologyIcon from '@mui/icons-material/Psychology';
import CloudIcon from '@mui/icons-material/Cloud';

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

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PsychologyIcon fontSize="small" />
                AI Solar Forecast with Weather Data
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
            label={`${data.length} ${data.length === 1 ? 'hour' : 'hours'}`}
            size="small"
            sx={{ backgroundColor: '#e3f2fd', color: '#1976d2' }}
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

        {/* Weather Conditions Summary for Requested Hours */}
        {model_info?.weather_integrated && weatherData.length > 0 && (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              🌤️ Weather Conditions Summary (Next {data.length} Hours)
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    ☀️ UV Index
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {weatherData.length > 0 ? (weatherData.reduce((sum, d) => sum + (d.weather.uv_index || 0), 0) / weatherData.length).toFixed(1) : 'N/A'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    🌡️ Temperature
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {weatherData.length > 0 ? (weatherData.reduce((sum, d) => sum + (d.weather.temperature_c || 0), 0) / weatherData.length).toFixed(1) : 'N/A'}°C
                  </Typography>
                </Box>
              </Grid>
                
              <Grid item xs={12} sm={6} md={4}>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    ☁️ Cloud Cover
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {weatherData.length > 0 ? (weatherData.reduce((sum, d) => sum + (d.weather.clouds_pct || 0), 0) / weatherData.length).toFixed(0) : 'N/A'}%
                  </Typography>
                </Box>
              </Grid>
                
              <Grid item xs={12} sm={6} md={4}>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    📝 Conditions
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {weatherData.length > 0 && weatherData[0].weather?.weather_description 
                      ? weatherData[0].weather.weather_description 
                      : 'N/A'}
                  </Typography>
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
            This forecast uses a <strong>{model_info?.name || 'machine learning'}</strong> model 
            trained specifically for <strong>daylight hours only (6 AM - 9 PM)</strong>.
            <br/>
            Model accuracy (R²): <strong>{model_info?.r2_score?.toFixed(3) || '0.693'}</strong>
            <br/>
            Features used: <strong>{model_info?.features_used || 17}</strong> including real-time weather data.
          </Typography>
          {/* Add explanation about daylight-only predictions */}
          {model_info?.daylight_only && (
            <Alert severity="info" sx={{ mt: 1, mb: 1 }}>
              <Typography variant="body2">
                <strong>📅 Daylight-Only Predictions:</strong> This model was trained on and 
                predicts only for daylight hours (6 AM to 9 PM). Nighttime hours are excluded 
                as solar generation is minimal during those hours.
              </Typography>
            </Alert>
          )}
          {model_info?.weather_integrated ? (
            <Typography variant="caption" color="text.secondary" display="block">
            Using real weather data from OpenWeather API
            </Typography>
            ) : (
            <Typography variant="caption" color="text.secondary" display="block">
            Using default weather values (API unavailable or disabled)
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
          Important Notice
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
            Forecast is limited to 48 hours max.
            Data cached for 10 minutes to reduce API calls.
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default MLForecastCard;