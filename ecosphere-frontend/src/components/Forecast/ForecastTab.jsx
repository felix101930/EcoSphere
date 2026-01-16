// Forecast Tab - Main forecast interface
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
    Tooltip
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PsychologyIcon from '@mui/icons-material/Psychology';
import DataAvailabilityCard from './DataAvailabilityCard';
import GenerationForecastInfo from './GenerationForecastInfo';
import MLForecastCard from './MLForecastCard';
import ForecastChart from './ForecastChart';
import { useForecastData } from '../../lib/hooks/useForecastData';
import MLForecastService from '../../services/MLForecastService';
import {
    FORECAST_PERIODS,
    FORECAST_PERIOD_LABELS,
    FORECAST_UI_TYPES,
    FORECAST_UI_TYPE_LABELS,
    ML_FORECAST
} from '../../lib/constants/forecast';

const ForecastTab = ({ dateTo }) => {
    // State
    const [forecastDays, setForecastDays] = useState(FORECAST_PERIODS.SEVEN_DAYS);
    const [forecastType, setForecastType] = useState(FORECAST_UI_TYPES.HISTORICAL);
    const [mlForecast, setMlForecast] = useState(null);
    const [mlLoading, setMlLoading] = useState(false);
    const [mlError, setMlError] = useState(null);

    // Custom hook for historical forecasts
    const {
        loading,
        error,
        consumptionForecast,
        generationForecast,
        loadBothForecasts
    } = useForecastData();

    // Handle generate forecast based on type
    const handleGenerateForecast = async () => {
        if (!dateTo) return;

        try {
            if (forecastType === FORECAST_UI_TYPES.HISTORICAL) {
                // Existing historical forecast
                await loadBothForecasts(dateTo, forecastDays);
                // Clear ML forecast when switching to historical
                setMlForecast(null);
            } else if (forecastType === FORECAST_UI_TYPES.ML_SOLAR) {
                await loadMLForecast();
            }
        } catch (err) {
            console.error('Failed to generate forecast:', err);
        }
    };

    // Helper function to safely parse date
const parseDateSafely = (dateInput) => {
    if (!dateInput) return null;
    
    if (typeof dateInput === 'string') {
        // Try parsing as ISO string first
        let date = new Date(dateInput);
        if (isNaN(date.getTime())) {
            // Try parsing as YYYY-MM-DD
            date = new Date(dateInput + 'T12:00:00');
        }
        return isNaN(date.getTime()) ? null : date;
    }
    
    if (dateInput instanceof Date) {
        return isNaN(dateInput.getTime()) ? null : dateInput;
    }
    
    return null;
};

    // Load ML forecast
    const loadMLForecast = async () => {
    const targetDate = parseDateSafely(dateTo);
    
    if (!targetDate) {
        setMlError('Invalid or missing date for forecast');
        return;
    }
    
    setMlLoading(true);
    setMlError(null);
    
    try {
        // Calculate date range (24 hours max from dateTo)
        const endDate = new Date(targetDate);
        endDate.setHours(12, 0, 0, 0); // Set to noon
        
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 1); 
        
        // Format dates as YYYY-MM-DD
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];
        
        console.log(`Loading ML forecast from ${startDateStr} to ${endDateStr}`);
        
        const forecast = await MLForecastService.getSolarForecast(
            startDateStr,
            endDateStr,
            false
        );
        
        if (forecast.success || forecast.data) {
            setMlForecast(forecast);
        } else {
            setMlError('ML forecast service returned no data');
        }
    } catch (error) {
        console.error('Failed to load ML forecast:', error);
        setMlError(`ML forecast error: ${error.message}`);
    } finally {
        setMlLoading(false);
    }
};

    // Auto-generate forecast when dateTo or type changes
    useEffect(() => {
        if (dateTo) {
            handleGenerateForecast();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateTo, forecastDays, forecastType]);

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
                            onChange={(e, newType) => newType && setForecastType(newType)}
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
                                    title="AI-powered solar generation prediction (24-hour max, for reference only)"
                                    placement="top"
                                >
                                    <InfoOutlinedIcon fontSize="small" sx={{ ml: 0.5 }} />
                                </Tooltip>
                            </ToggleButton>
                        </ToggleButtonGroup>
                        
                        {forecastType === FORECAST_UI_TYPES.ML_SOLAR && (
                            <Alert severity="info" sx={{ mt: 2 }}>
                                <Typography variant="body2">
                                    ⚠️ <strong>Note:</strong> AI forecast limited to {ML_FORECAST.MAX_HOURS} hours for accuracy. 
                                    Results are for reference only - actual generation may vary.
                                </Typography>
                            </Alert>
                        )}
                    </Box>

                    {/* Forecast Period Selector (only for historical) */}
                    {forecastType === FORECAST_UI_TYPES.HISTORICAL && (
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end', mt: 2 }}>
                            <FormControl sx={{ minWidth: 150 }}>
                                <InputLabel>Forecast Period</InputLabel>
                                <Select
                                    value={forecastDays}
                                    label="Forecast Period"
                                    onChange={(e) => setForecastDays(e.target.value)}
                                >
                                    <MenuItem value={FORECAST_PERIODS.SEVEN_DAYS}>
                                        {FORECAST_PERIOD_LABELS[FORECAST_PERIODS.SEVEN_DAYS]}
                                    </MenuItem>
                                    <MenuItem value={FORECAST_PERIODS.FOURTEEN_DAYS}>
                                        {FORECAST_PERIOD_LABELS[FORECAST_PERIODS.FOURTEEN_DAYS]}
                                    </MenuItem>
                                    <MenuItem value={FORECAST_PERIODS.THIRTY_DAYS}>
                                        {FORECAST_PERIOD_LABELS[FORECAST_PERIODS.THIRTY_DAYS]}
                                    </MenuItem>
                                </Select>
                            </FormControl>

                            {/* Generate Button */}
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

                    {/* Generate Button for ML (no period selector) */}
                    {forecastType === FORECAST_UI_TYPES.ML_SOLAR && (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                            <Button
                                variant="contained"
                                onClick={handleGenerateForecast}
                                disabled={mlLoading || !dateTo}
                                sx={{ height: 56, minWidth: 200 }}
                                startIcon={mlLoading ? <CircularProgress size={20} /> : <PsychologyIcon />}
                            >
                                {mlLoading ? 'Generating AI Forecast...' : 'Generate AI Forecast'}
                            </Button>
                        </Box>
                    )}

                    {/* Info Alert */}
                    <Alert severity="info" sx={{ mt: 2 }}>
                        {forecastType === FORECAST_UI_TYPES.HISTORICAL ? (
                            <>The forecast will predict the next {forecastDays} days starting from the last day available in the DB (2020-11-09).
                            Consumption forecast uses historical patterns, Generation forecast uses weather data from Open-Meteo API.</>
                        ) : (
                            <>🤖 <strong>AI-powered solar generation forecast</strong> (max {ML_FORECAST.MAX_HOURS} hours). 
                            Uses machine learning model trained on historical solar data.
                            <br/><br/>
                            <strong>⚠️ Disclaimer:</strong> Results are for reference only - actual generation may vary based on real-time conditions, equipment performance, and environmental factors.</>
                        )}
                    </Alert>
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
                        {forecastType === FORECAST_UI_TYPES.ML_SOLAR ? 
                            'Generating AI forecast...' : 
                            'Loading forecast data...'}
                    </Typography>
                </Box>
            )}

            {/* Forecast Results */}
            {!loading && !mlLoading && (consumptionForecast || generationForecast || mlForecast) && (
                <>
                    {/* Show ML Forecast Card if ML type selected */}
                    {forecastType === FORECAST_UI_TYPES.ML_SOLAR && mlForecast && (
                        <MLForecastCard forecast={mlForecast} />
                    )}
                    
                    {/* Show historical forecast cards if historical type selected */}
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
                    
                    {/* Forecast Chart - Single component handles both types */}
                    <ForecastChart
                        consumptionData={forecastType === FORECAST_UI_TYPES.HISTORICAL ? consumptionForecast : null}
                        generationData={forecastType === FORECAST_UI_TYPES.HISTORICAL ? generationForecast : null}
                        mlForecastData={forecastType === FORECAST_UI_TYPES.ML_SOLAR ? mlForecast : null}
                        forecastType={forecastType}
                        yAxisLabel={forecastType === FORECAST_UI_TYPES.ML_SOLAR ? 'Power Output (kW)' : 'Daily Energy (Wh/day)'}
                        unit={forecastType === FORECAST_UI_TYPES.ML_SOLAR ? 'kW' : 'Wh'}
                    />
                </>
            )}

            {/* No Data State */}
            {!loading && !mlLoading && !consumptionForecast && !generationForecast && !mlForecast && !error && !mlError && (
                <Card>
                    <CardContent>
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                {forecastType === FORECAST_UI_TYPES.ML_SOLAR ? 
                                    '🤖 Ready for AI Forecast' : 
                                    '📊 Ready to Generate Forecast'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                {forecastType === FORECAST_UI_TYPES.ML_SOLAR 
                                    ? 'Click "Generate AI Forecast" button for AI-powered solar predictions'
                                    : 'Select forecast period, then click "Generate Forecast" button'}
                            </Typography>
                            {forecastType === FORECAST_UI_TYPES.ML_SOLAR && (
                                <Alert severity="info" sx={{ maxWidth: 600, mx: 'auto' }}>
                                    <Typography variant="body2">
                                        <strong>AI Forecast Details:</strong>
                                        <br/>• Max {ML_FORECAST.MAX_HOURS}-hour forecast for accuracy
                                        <br/>• Uses machine learning model (R²: 0.693)
                                        <br/>• Trained on historical solar generation data
                                        <br/>• Results for reference only
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