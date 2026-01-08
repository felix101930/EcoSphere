// Hot Water Forecast View - Display hot water consumption forecast
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
import DataAvailabilityCard from '../Forecast/DataAvailabilityCard';
import AlgorithmTiersGrid from '../Forecast/AlgorithmTiersGrid';
import ForecastChart from '../Forecast/ForecastChart';
import {
    FORECAST_PERIODS,
    FORECAST_PERIOD_LABELS
} from '../../lib/constants/forecast';

const HotWaterForecastView = ({ dateTo, loading, error, forecast, onLoadForecast }) => {
    const [forecastDays, setForecastDays] = useState(FORECAST_PERIODS.SEVEN_DAYS);

    // Handle generate forecast
    const handleGenerateForecast = async () => {
        if (!dateTo) return;

        try {
            await onLoadForecast(dateTo, forecastDays);
        } catch (err) {
            console.error('Failed to generate forecast:', err);
        }
    };

    // Auto-generate forecast when dateTo or forecastDays changes
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
                        The forecast will predict the next {forecastDays} days of hot water consumption
                        based on historical usage patterns.
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
                    {/* Data Availability Card */}
                    <DataAvailabilityCard
                        metadata={forecast.metadata}
                        title="Hot Water Consumption Forecast"
                    />

                    {/* Forecast Chart */}
                    <ForecastChart
                        consumptionData={forecast}
                        generationData={null}
                        yAxisLabel="Hot Water Consumption (L/h)"
                        unit="L/h"
                        consumptionLabel="Hot Water Consumption Forecast"
                        decimalPlaces={2}
                    />
                </>
            )}

            {/* No Data State */}
            {!loading && !forecast && !error && (
                <Card>
                    <CardContent>
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                📊 Ready to Generate Forecast
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

export default HotWaterForecastView;
