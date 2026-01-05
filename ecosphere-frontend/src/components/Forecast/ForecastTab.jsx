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
    Alert
} from '@mui/material';
import DataAvailabilityCard from './DataAvailabilityCard';
import ForecastChart from './ForecastChart';
import { useForecastData } from '../../lib/hooks/useForecastData';
import { FORECAST_PERIODS, FORECAST_PERIOD_LABELS } from '../../lib/constants/forecast';

const ForecastTab = ({ dateTo }) => {
    // State
    const [forecastDays, setForecastDays] = useState(FORECAST_PERIODS.SEVEN_DAYS);

    // Custom hook
    const { loading, error, forecastData, loadElectricityForecast } = useForecastData();

    // Handle generate forecast
    const handleGenerateForecast = async () => {
        if (!dateTo) return;

        try {
            await loadElectricityForecast(dateTo, forecastDays);
        } catch (err) {
            console.error('Failed to generate forecast:', err);
        }
    };

    // Auto-generate forecast when dateTo changes
    useEffect(() => {
        if (dateTo) {
            handleGenerateForecast();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateTo, forecastDays]);

    return (
        <Box>
            {/* Configuration Card */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        ⚙️ Forecast Configuration
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end', mt: 2 }}>
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
                            disabled={loading || !dateTo}
                            sx={{ height: 56 }}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Generate Forecast'}
                        </Button>
                    </Box>

                    {/* Info Alert */}
                    <Alert severity="info" sx={{ mt: 2 }}>
                        ℹ️ The forecast will predict the next {forecastDays} days starting from the selected end date above.
                        Using historical data from 2019-2020 for demonstration.
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
            {!loading && forecastData && (
                <>
                    {/* Data Availability Card */}
                    <DataAvailabilityCard metadata={forecastData.metadata} />

                    {/* Forecast Chart */}
                    <ForecastChart
                        predictions={forecastData.predictions}
                        targetDate={forecastData.targetDate}
                    />
                </>
            )}

            {/* No Data State */}
            {!loading && !forecastData && !error && (
                <Card>
                    <CardContent>
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                📊 Ready to Generate Forecast
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Select a date range above and forecast period, then click "Generate Forecast" button
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
};

export default ForecastTab;
