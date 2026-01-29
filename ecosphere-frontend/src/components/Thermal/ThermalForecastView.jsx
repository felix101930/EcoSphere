// Thermal Forecast View - Display thermal forecast
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
    Alert
} from '@mui/material';
import ThermalForecastInfo from '../Forecast/ThermalForecastInfo';
import ForecastChart from '../Forecast/ForecastChart';
import {
    FORECAST_PERIODS,
    FORECAST_PERIOD_LABELS
} from '../../lib/constants/forecast';

const ThermalForecastView = ({
    selectedFloor,
    dateTo,
    loading,
    error,
    forecast,
    onLoadForecast
}) => {
    const [forecastDays, setForecastDays] = useState(FORECAST_PERIODS.SEVEN_DAYS);

    // Handle generate forecast
    const handleGenerateForecast = async () => {
        if (!dateTo || !selectedFloor) return;

        try {
            await onLoadForecast(selectedFloor, dateTo, forecastDays);
        } catch (err) {
            console.error('Failed to generate forecast:', err);
        }
    };

    // Auto-generate forecast when dateTo, floor, or forecastDays changes
    useEffect(() => {
        if (dateTo && selectedFloor) {
            handleGenerateForecast();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateTo, selectedFloor, forecastDays]);

    return (
        <Box>
            {/* Configuration Card */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        ⚙️ Forecast Configuration
                    </Typography>

                    {/* Hide configuration controls in export */}
                    <Box data-hide-in-export="true" sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end', mt: 2 }}>
                        {/* Forecast Period Selector */}
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
                            disabled={loading || !dateTo || !selectedFloor}
                            sx={{ height: 56 }}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Generate Forecast'}
                        </Button>
                    </Box>

                    {/* Info Alert */}
                    <Alert severity="info" sx={{ mt: 2 }}>
                        The forecast will predict the next {forecastDays} days of indoor temperature
                        for {selectedFloor === 'basement' ? 'Basement' : selectedFloor === 'level1' ? 'Level 1' : 'Level 2'}
                        {' '}based on historical patterns and weather forecast.
                    </Alert>
                </CardContent>
            </Card>

            {/* Error Display */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    Forecast generation failed: {error}
                </Alert>
            )}

            {/* Loading State */}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                    <CircularProgress />
                </Box>
            )}

            {/* Forecast Results */}
            {!loading && forecast && (
                <>
                    {/* Model Information Card */}
                    <ThermalForecastInfo metadata={forecast.metadata} />

                    {/* Forecast Chart */}
                    <ForecastChart
                        consumptionData={forecast}
                        generationData={null}
                        outdoorTemperatureData={forecast.outdoorTemperature}
                        yAxisLabel="Indoor Temperature (°C)"
                        unit="°C"
                        consumptionLabel="Temperature Forecast"
                        outdoorTemperatureLabel="Outdoor Temperature"
                        showTotal={false}
                        decimalPlaces={1}
                        title="📈 Temperature Forecast"
                    />
                </>
            )}

            {/* No Data State */}
            {!loading && !forecast && !error && (
                <Card>
                    <CardContent>
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                🌡️ Ready to Generate Forecast
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Select forecast period and click "Generate Forecast" button
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
};

export default ThermalForecastView;
