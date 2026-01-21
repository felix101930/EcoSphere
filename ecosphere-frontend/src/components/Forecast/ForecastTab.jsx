// ForecastTab.jsx - Updated with complete logic
import { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Alert,
    ToggleButtonGroup,
    ToggleButton,
    Tooltip,
    TextField,
    Grid,
    Chip,
    Stack
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PsychologyIcon from '@mui/icons-material/Psychology';
import RefreshIcon from '@mui/icons-material/Refresh';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DataAvailabilityCard from './DataAvailabilityCard';
import GenerationForecastInfo from './GenerationForecastInfo';
import MLForecastCard from './MLForecastCard';
import HourlyForecastTable from './HourlyForecastTable';
import ForecastChart from './ForecastChart';
import { useForecastData } from '../../lib/hooks/useForecastData';
import MLForecastService from '../../services/MLForecastService';
import {
    FORECAST_UI_TYPES,
    FORECAST_UI_TYPE_LABELS,
} from '../../lib/constants/forecast';

const ForecastTab = ({ dateTo }) => {
const [forecastType, setForecastType] = useState(FORECAST_UI_TYPES.ML_SOLAR);
const [mlForecast, setMlForecast] = useState(null);
const [filteredForecast, setFilteredForecast] = useState(null);
const [mlLoading, setMlLoading] = useState(false);
const [mlError, setMlError] = useState(null);
const [forecastHours, setForecastHours] = useState(24);
const [customHoursInput, setCustomHoursInput] = useState('');
const [showCustomInput, setShowCustomInput] = useState(false);
const [forceRefresh, setForceRefresh] = useState(false);
const [apiStats, setApiStats] = useState(null);
const [showHourlyTable, setShowHourlyTable] = useState(false);

    // Quick forecast options
    const quickForecastOptions = [
  { value: 1, label: "Next Hour", hours: 1 },
  { value: 5, label: "Next 5 Hours", hours: 5 },
  { value: 12, label: "Next 12 Hours", hours: 12 },
  { value: 24, label: "Next 24 Hours", hours: 24 },
  { value: 48, label: "Next 48 Hours", hours: 48 },
  { value: "custom", label: "Custom Hours (1-30)" },
];

    // Custom hook for historical forecasts
    const {
        loading,
        error,
        consumptionForecast,
        generationForecast,
        loadBothForecasts
    } = useForecastData();

    // Load API stats
    useEffect(() => {
        loadApiStats();
    }, []);

    const loadApiStats = async () => {
        try {
            const stats = await MLForecastService.getApiStats();
            setApiStats(stats);
        } catch (error) {
            console.error('Failed to load API stats:', error);
        }
    };

    // Handle custom hours change
    const handleCustomHoursInput = (e) => {
    const value = e.target.value;
    setCustomHoursInput(value);
    
    if (value && !isNaN(value) && value > 0) {
        // Limit to 30 hours maximum
        const hours = Math.min(Math.max(1, parseInt(value)), 30);
        setForecastHours(hours);
        // Apply filter if data exists
        if (mlForecast) {
        const filtered = MLForecastService.getFilteredForecast(hours, mlForecast);
        setFilteredForecast(filtered);
        }
    }
    };

    // Handle hours change (filtering)
    const handleHoursChange = (hours) => {
        setForecastHours(hours);
        
        // Apply filter to existing dataset if available
        if (mlForecast && mlForecast.data) {
            console.log(`🔄 Filtering to ${hours} hours`);
            const filtered = MLForecastService.getFilteredForecast(hours, mlForecast);
            setFilteredForecast(filtered);
        }
    };

    // Handle forecast type change
    const handleForecastTypeChange = (e, newType) => {
        if (newType) {
            setForecastType(newType);
            if (newType === FORECAST_UI_TYPES.ML_SOLAR) {
                // Reset ML state when switching to ML
                setMlForecast(null);
                setFilteredForecast(null);
            }
        }
    };

    // Handle generate forecast
    const handleGenerateForecast = async () => {
        if (forecastType === FORECAST_UI_TYPES.HISTORICAL) {
            // Historical forecast logic
            setMlLoading(true);
            try {
                await loadBothForecasts(dateTo, forecastHours / 24);
            } catch (err) {
                setMlError(`Historical forecast error: ${err.message}`);
            } finally {
                setMlLoading(false);
            }
        } else if (forecastType === FORECAST_UI_TYPES.ML_SOLAR) {
            // ML forecast logic
            setMlLoading(true);
            setMlError(null);
            
            try {
                const currentDate = new Date();
                const startDateStr = currentDate.toISOString().split('T')[0];
                
                // Calculate 48 hours ahead
                const endDate = new Date(currentDate);
                endDate.setHours(endDate.getHours() + 48);
                const endDateStr = endDate.toISOString().split('T')[0];
                
                console.log(`📅 Loading 48-hour ML forecast dataset`);
                console.log(`   From: ${startDateStr} (current date)`);
                console.log(`   To: ${endDateStr} (48 hours ahead)`);
                
                const forecast = await MLForecastService.getSolarForecast(
                    startDateStr,
                    endDateStr,
                    {
                        useWeather: true,
                        forceFresh: forceRefresh,
                        useCache: !forceRefresh,
                        coordinates: { lat: 51.0447, lon: -114.0719 }
                    }
                );
                
                if (forecast.success || forecast.data) {
                    setMlForecast(forecast);
                    
                    // Apply initial filter
                    const filtered = MLForecastService.getFilteredForecast(forecastHours, forecast);
                    setFilteredForecast(filtered);
                    
                    loadApiStats();
                    
                    console.log(`✅ 48-hour dataset loaded: ${forecast.data?.length || 0} predictions`);
                    if (forecast.model_info?.weather_integrated) {
                        console.log(`🌤️ Weather data: Integrated`);
                    }
                    
                    // Clear force refresh
                    setForceRefresh(false);
                } else {
                    setMlError('ML forecast service returned no data');
                }
            } catch (error) {
                console.error('Failed to load ML forecast:', error);
                setMlError(`ML forecast error: ${error.message}`);
            } finally {
                setMlLoading(false);
            }
        }
    };

    // Handle force refresh
    const handleForceRefresh = () => {
        setForceRefresh(true);
        handleGenerateForecast();
    };

    // Handle forecast hours dropdown change
    const handleForecastHoursChange = (e) => {
    const value = e.target.value;
    
    if (value === "custom") {
        setShowCustomInput(true);
        setCustomHoursInput("");
        setForecastHours(12); // Set a reasonable default
    } else {
        setShowCustomInput(false);
        const hours = parseInt(value);
        setForecastHours(hours);
        // Apply filter if data exists
        if (mlForecast) {
        const filtered = MLForecastService.getFilteredForecast(hours, mlForecast);
        setFilteredForecast(filtered);
        }
    }
    };

    // Parse date safely (if needed)
    const parseDateSafely = (dateInput) => {
        if (!dateInput) return null;
        
        if (typeof dateInput === 'string') {
            let date = new Date(dateInput);
            if (isNaN(date.getTime())) {
                date = new Date(dateInput + 'T12:00:00');
            }
            return isNaN(date.getTime()) ? null : date;
        }
        
        if (dateInput instanceof Date) {
            return isNaN(dateInput.getTime()) ? null : dateInput;
        }
        
        return null;
    };

    // Get the forecast data to display
    const displayForecast = filteredForecast || mlForecast;

    return (
        <Box>
            {/* Configuration Card */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        ⚙️ Forecast Configuration
                    </Typography>

                    {/* Forecast Type Toggle */}
                    <Box sx={{ width: '100%', mb: 3 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Forecast Type
                        </Typography>
                        <ToggleButtonGroup
                            value={forecastType}
                            exclusive
                            onChange={handleForecastTypeChange}
                            size="medium"
                            fullWidth
                        >
                            <ToggleButton 
                                value={FORECAST_UI_TYPES.HISTORICAL}
                                sx={{ 
                                    py: 1.5,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1
                                }}
                            >
                                📊 {FORECAST_UI_TYPE_LABELS[FORECAST_UI_TYPES.HISTORICAL]}
                            </ToggleButton>
                            <ToggleButton 
                                value={FORECAST_UI_TYPES.ML_SOLAR}
                                sx={{ 
                                    py: 1.5,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1
                                }}
                            >
                                <PsychologyIcon fontSize="small" />
                                {FORECAST_UI_TYPE_LABELS[FORECAST_UI_TYPES.ML_SOLAR]}
                                <Tooltip 
                                    title="AI-powered solar generation prediction with real-time weather data"
                                    placement="top"
                                >
                                    <InfoOutlinedIcon fontSize="small" sx={{ ml: 0.5 }} />
                                </Tooltip>
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Box>

                    {/* ML Forecast Configuration */}
                    {forecastType === FORECAST_UI_TYPES.ML_SOLAR && (
                        <>
                            {/* Daylight Hours Notice */}
                            <Alert severity="info" sx={{ mb: 2 }}>
                                <Typography variant="body2" gutterBottom>
                                    <strong>Daylight Hours Only:</strong> Forecast covers only daylight hours <strong>(6 AM to 9 PM)</strong>.
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Hours from 9 PM to 6 AM are excluded as solar generation is minimal during nighttime.
                                </Typography>
                            </Alert>

                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid item xs={12} sm={showCustomInput ? 6 : 6} md={showCustomInput ? 4 : 4}>
                                    <FormControl fullWidth>
                                        <InputLabel>Forecast Duration</InputLabel>
                                        <Select
                                            value={showCustomInput ? "custom" : forecastHours}
                                            label="Forecast Duration"
                                            onChange={handleForecastHoursChange}
                                            startAdornment={<AccessTimeIcon sx={{ mr: 1, color: 'action.active' }} />}
                                        >
                                            {quickForecastOptions.map((option) => (
                                                <MenuItem key={option.value} value={option.value}>
                                                    {option.label} {option.value !== "custom" && `(${option.hours}h)`}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>

                                {showCustomInput && (
                                <Grid item xs={12} sm={6} md={4}>
                                    <TextField
                                    label="Custom Hours (1-30)"
                                    type="number"
                                    value={customHoursInput}
                                    onChange={handleCustomHoursInput}
                                    fullWidth
                                    inputProps={{ 
                                        min: 1, 
                                        max: 30,
                                        step: 1 
                                    }}
                                    helperText={`Max 30 hours for meaningful results`}
                                    autoFocus
                                    error={customHoursInput && (parseInt(customHoursInput) < 1 || parseInt(customHoursInput) > 30)}
                                    />
                                </Grid>
                                )}

                                <Grid item xs={12} sm={6} md={4}>
                                    <Button
                                        variant="contained"
                                        onClick={handleGenerateForecast}
                                        disabled={mlLoading}
                                        fullWidth
                                        sx={{ height: '56px' }}
                                        startIcon={mlLoading ? <CircularProgress size={20} /> : <PsychologyIcon />}
                                    >
                                        {mlLoading ? 'Generating...' : 'Generate Forecast'}
                                    </Button>
                                </Grid>

                                <Grid item xs={12} sm={6} md={4}>
                                    <Tooltip title="Force refresh forecast and bypass cache">
                                        <Button
                                            variant="outlined"
                                            onClick={handleForceRefresh}
                                            disabled={mlLoading}
                                            fullWidth
                                            sx={{ height: '56px' }}
                                            startIcon={<RefreshIcon />}
                                        >
                                            Force Refresh
                                        </Button>
                                    </Tooltip>
                                </Grid>
                            </Grid>
                        </>
                    )}

                    {/* Historical Forecast Configuration */}
                    {forecastType === FORECAST_UI_TYPES.HISTORICAL && (
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end', mt: 2 }}>
                            <FormControl sx={{ minWidth: 150 }}>
                                <InputLabel>Forecast Period</InputLabel>
                                <Select
                                    value={forecastHours / 24}
                                    label="Forecast Period"
                                    onChange={(e) => setForecastHours(e.target.value * 24)}
                                >
                                    <MenuItem value={7}>7 Days</MenuItem>
                                    <MenuItem value={14}>14 Days</MenuItem>
                                    <MenuItem value={30}>30 Days</MenuItem>
                                </Select>
                            </FormControl>

                            <Button
                                variant="contained"
                                onClick={handleGenerateForecast}
                                disabled={loading || !dateTo}
                                sx={{ height: 56 }}
                            >
                                {loading ? <CircularProgress size={24} /> : 'Generate Forecast'}
                            </Button>
                        </Box>
                    )}

                    {/* API Stats */}
                    {apiStats && forecastType === FORECAST_UI_TYPES.ML_SOLAR && (
                        <Box sx={{ mt: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="caption" color="text.secondary">
                                    📊 API Usage Today: {apiStats.calls_today}/{apiStats.max_calls_per_day} calls
                                </Typography>
                                <Chip 
                                    label={`${apiStats.remaining_calls} calls remaining`}
                                    size="small"
                                    color={
                                        apiStats.remaining_calls > 500 ? "success" :
                                        apiStats.remaining_calls > 200 ? "warning" : "error"
                                    }
                                    variant="outlined"
                                />
                            </Stack>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                Data cached for 10 minutes • Resets daily at {new Date(apiStats.last_reset).toLocaleTimeString()}
                            </Typography>
                        </Box>
                    )}

                    {/* Info Alert */}
                    {forecastType === FORECAST_UI_TYPES.ML_SOLAR && displayForecast && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                            <Typography variant="body2">
                                <strong>Smart Caching:</strong> Showing {displayForecast.summary?.actual_hours_shown || 0} of 
                                requested {displayForecast.summary?.requested_hours || 0} hours. 
                                {displayForecast.summary?.actual_hours_shown < displayForecast.summary?.requested_hours && 
                                    " Night-time hours (9 PM - 6 AM) excluded."}
                                <br/>
                                <strong>48-hour dataset cached for 10 minutes.</strong>
                            </Typography>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* Error Display */}
            {(error || mlError) && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    Forecast generation failed: {error || mlError}
                </Alert>
            )}

            {/* Loading State */}
            {(loading || mlLoading) && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                    <CircularProgress />
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                        {forecastType === FORECAST_UI_TYPES.ML_SOLAR 
                            ? `Generating AI-powered solar forecast...`
                            : `Generating historical forecast...`}
                    </Typography>
                </Box>
            )}

            {/* Forecast Results */}
            {!loading && !mlLoading && (consumptionForecast || generationForecast || displayForecast) && (
                <>
                    {/* Show Enhanced ML Forecast Card */}
                    {forecastType === FORECAST_UI_TYPES.ML_SOLAR && displayForecast && (
                        <>
                            <MLForecastCard 
                                forecast={displayForecast} 
                                loading={mlLoading}
                                apiStats={apiStats}
                                forecastHours={forecastHours}
                            />
                            
                            {/* Toggle for hourly table */}
                            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                                <Button
                                    variant="outlined"
                                    onClick={() => setShowHourlyTable(!showHourlyTable)}
                                    startIcon={showHourlyTable ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                >
                                    {showHourlyTable ? 'Hide Hourly Details' : 'Show Hourly Details'}
                                </Button>
                            </Box>
                            
                            {/* Hourly table */}
                            {showHourlyTable && displayForecast && (
                                <Card sx={{ mb: 3 }}>
                                    <CardContent>
                                        <HourlyForecastTable 
                                            forecastData={displayForecast}
                                            title={`Hourly Forecast (${displayForecast.summary?.actual_hours_shown || 0} hours)`}
                                        />
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    )}
                    
                    {/* Show historical forecast cards */}
                    {forecastType === FORECAST_UI_TYPES.HISTORICAL && consumptionForecast && (
                        <DataAvailabilityCard
                            metadata={consumptionForecast.metadata}
                            title="Consumption Forecast"
                        />
                    )}
                    
                    {forecastType === FORECAST_UI_TYPES.HISTORICAL && generationForecast && (
                        <GenerationForecastInfo
                            metadata={generationForecast.metadata}
                        />
                    )}
                    
                    {/* Forecast Chart */}
                    <ForecastChart
                        consumptionData={forecastType === FORECAST_UI_TYPES.HISTORICAL ? consumptionForecast : null}
                        generationData={forecastType === FORECAST_UI_TYPES.HISTORICAL ? generationForecast : null}
                        mlForecastData={forecastType === FORECAST_UI_TYPES.ML_SOLAR ? displayForecast : null}
                        forecastType={forecastType}
                        yAxisLabel={forecastType === FORECAST_UI_TYPES.ML_SOLAR ? 'Power Output (kW)' : 'Daily Energy (Wh/day)'}
                        unit={forecastType === FORECAST_UI_TYPES.ML_SOLAR ? 'kW' : 'Wh'}
                    />
                </>
            )}

            {/* No Data State */}
            {!loading && !mlLoading && !consumptionForecast && !generationForecast && !displayForecast && !error && !mlError && (
                <Card>
                    <CardContent>
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                {forecastType === FORECAST_UI_TYPES.ML_SOLAR ? 
                                    '🤖 AI Solar Forecast Ready' : 
                                    '📊 Historical Forecast Ready'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                {forecastType === FORECAST_UI_TYPES.ML_SOLAR 
                                    ? `Select forecast duration and click "Generate Forecast"`
                                    : 'Select forecast period, then click "Generate Forecast" button'}
                            </Typography>
                            <Button
                                variant="contained"
                                onClick={handleGenerateForecast}
                                startIcon={forecastType === FORECAST_UI_TYPES.ML_SOLAR ? 
                                    <PsychologyIcon /> : 
                                    <RefreshIcon />}
                                sx={{ mt: 2 }}
                            >
                                Generate Forecast Now
                            </Button>
                            
                            {forecastType === FORECAST_UI_TYPES.ML_SOLAR && (
                                <Alert severity="info" sx={{ mt: 2, maxWidth: 600, mx: 'auto' }}>
                                    <Typography variant="body2">
                                        <strong>AI Solar Forecast Features:</strong>
                                        <br/>• 48-hour dataset with smart caching
                                        <br/>• Real-time weather integration
                                        <br/>• Fast filtering without API calls
                                        <br/>• Daytime-only predictions (6 AM - 9 PM)
                                        <br/>• 10-minute cache to reduce API usage
                                    </Typography>
                                </Alert>
                            )}
                        </Box>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
};

export default ForecastTab;