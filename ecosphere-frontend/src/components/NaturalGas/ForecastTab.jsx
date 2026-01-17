// Natural Gas Forecast Tab - Display forecast predictions
import { useState } from 'react';
import { Box, Paper, Typography, Button, FormControl, InputLabel, Select, MenuItem, Alert, CircularProgress, Chip, Grid } from '@mui/material';
import { Info, TrendingUp, CheckCircle, Warning } from '@mui/icons-material';
import { Bar } from 'react-chartjs-2';
import NaturalGasService from '../../services/NaturalGasService';
import AlgorithmTiersGrid from './AlgorithmTiersGrid';
import { CHART_COLORS, DATA_CONFIG, FORECAST_PERIODS, FORECAST_PERIOD_LABELS } from '../../lib/constants/naturalGas';

function ForecastTab() {
    const [forecastMonths, setForecastMonths] = useState(FORECAST_PERIODS.SIX_MONTHS);
    const [forecast, setForecast] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleGenerateForecast = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Get the last available data point to determine forecast start date
            // Forecast should start from the month after the last available data
            const allData = await NaturalGasService.getAllData();

            console.log('=== Natural Gas Forecast Debug ===');
            console.log('All data length:', allData?.length);

            if (!allData || allData.length === 0) {
                throw new Error('No historical data available for forecast');
            }

            // Get the last data point
            const lastDataPoint = allData[allData.length - 1];
            console.log('Last data point:', lastDataPoint);

            // Parse the last month (format: "YYYY-MM")
            const [lastYear, lastMonth] = lastDataPoint.month.split('-').map(Number);
            console.log('Last data year:', lastYear, 'month:', lastMonth);

            // Calculate the NEXT month after the last data point
            // This is where the forecast should start
            let nextMonth = lastMonth + 1;
            let nextYear = lastYear;
            if (nextMonth > 12) {
                nextMonth = 1;
                nextYear += 1;
            }
            console.log('Next month (forecast start):', nextYear, '-', nextMonth);

            // Create target date for the NEXT month (forecast start)
            // Use month-1 because JavaScript Date uses 0-based months
            const targetDate = new Date(nextYear, nextMonth - 1, 1);
            console.log('Target date:', targetDate.toISOString());
            console.log('Forecast months:', forecastMonths);

            const result = await NaturalGasService.getForecast(targetDate, forecastMonths);
            console.log('Forecast result:', result);
            console.log('First prediction:', result?.predictions?.[0]);

            setForecast(result);
        } catch (err) {
            console.error('Error generating forecast:', err);
            setError('Failed to generate forecast. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Prepare chart data
    const chartData = forecast ? {
        labels: forecast.predictions.map(p => p.monthLabel),
        datasets: [
            {
                label: `Predicted Usage (${DATA_CONFIG.UNIT})`,
                data: forecast.predictions.map(p => p.value),
                backgroundColor: CHART_COLORS.FORECAST + '80',
                borderColor: CHART_COLORS.FORECAST,
                borderWidth: 2
            }
        ]
    } : null;

    // Chart options
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top'
            },
            title: {
                display: false
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += context.parsed.y.toFixed(2) + ' ' + DATA_CONFIG.UNIT;
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Month'
                },
                ticks: {
                    maxRotation: 45,
                    minRotation: 45
                }
            },
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: `Usage (${DATA_CONFIG.UNIT})`
                },
                ticks: {
                    callback: function (value) {
                        return value.toFixed(0) + ' ' + DATA_CONFIG.UNIT;
                    }
                }
            }
        }
    };

    return (
        <Box>
            {/* Configuration Card */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    ⚙️ Forecast Configuration
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    Generate natural gas consumption forecast based on historical seasonal patterns
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 2, flexWrap: 'wrap' }}>
                    <FormControl sx={{ minWidth: 150 }}>
                        <InputLabel>Forecast Period</InputLabel>
                        <Select
                            value={forecastMonths}
                            label="Forecast Period"
                            onChange={(e) => setForecastMonths(e.target.value)}
                        >
                            <MenuItem value={FORECAST_PERIODS.THREE_MONTHS}>
                                {FORECAST_PERIOD_LABELS[FORECAST_PERIODS.THREE_MONTHS]}
                            </MenuItem>
                            <MenuItem value={FORECAST_PERIODS.SIX_MONTHS}>
                                {FORECAST_PERIOD_LABELS[FORECAST_PERIODS.SIX_MONTHS]}
                            </MenuItem>
                            <MenuItem value={FORECAST_PERIODS.TWELVE_MONTHS}>
                                {FORECAST_PERIOD_LABELS[FORECAST_PERIODS.TWELVE_MONTHS]}
                            </MenuItem>
                        </Select>
                    </FormControl>

                    <Button
                        variant="contained"
                        startIcon={<TrendingUp />}
                        onClick={handleGenerateForecast}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Generating...' : 'Generate Forecast'}
                    </Button>
                </Box>

                <Alert severity="info" icon={<Info />} sx={{ mt: 2 }}>
                    The forecast uses a 3-tier algorithm system optimized for monthly natural gas data.
                    The system automatically selects the best algorithm based on available historical data (2023-2025).
                </Alert>
            </Paper>

            {/* Loading State */}
            {isLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                </Box>
            )}

            {/* Error State */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Forecast Results */}
            {forecast && !isLoading && (
                <>
                    {/* Algorithm Selection Info */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            📊 Algorithm Selection & Data Availability
                        </Typography>

                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Selected Algorithm
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                    {forecast.metadata.strategyName}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Confidence Level
                                </Typography>
                                <Chip
                                    label={`${forecast.metadata.confidence}%`}
                                    color={
                                        forecast.metadata.confidence >= 70 ? 'success' :
                                            forecast.metadata.confidence >= 50 ? 'warning' : 'error'
                                    }
                                    icon={forecast.metadata.confidence >= 70 ? <CheckCircle /> : <Warning />}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Accuracy Rating
                                </Typography>
                                <Typography variant="body1" sx={{ fontSize: '1.2rem' }}>
                                    {forecast.metadata.accuracy}
                                </Typography>
                            </Grid>
                        </Grid>

                        {forecast.metadata.warning && (
                            <Alert severity="warning" icon={<Warning />} sx={{ mb: 2 }}>
                                {forecast.metadata.warning}
                            </Alert>
                        )}

                        {/* Data Availability Checks */}
                        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1.5 }}>
                                Data Availability Checks
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {forecast.metadata.dataAvailability.hasTwoYears ?
                                            <CheckCircle color="success" fontSize="small" /> :
                                            <Warning color="warning" fontSize="small" />
                                        }
                                        <Typography variant="caption">
                                            Two Years Data: {forecast.metadata.dataAvailability.hasTwoYears ? 'Yes' : 'No'}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {forecast.metadata.dataAvailability.hasSixMonths ?
                                            <CheckCircle color="success" fontSize="small" /> :
                                            <Warning color="warning" fontSize="small" />
                                        }
                                        <Typography variant="caption">
                                            Six Months Data: {forecast.metadata.dataAvailability.hasSixMonths ? 'Yes' : 'No'}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {forecast.metadata.dataAvailability.hasThreeMonths ?
                                            <CheckCircle color="success" fontSize="small" /> :
                                            <Warning color="warning" fontSize="small" />
                                        }
                                        <Typography variant="caption">
                                            Three Months Data: {forecast.metadata.dataAvailability.hasThreeMonths ? 'Yes' : 'No'}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="caption" color="text.secondary">
                                        Total Data Points: <strong>{forecast.metadata.dataAvailability.totalDataPoints} months</strong>
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Algorithm Tiers Grid */}
                        <AlgorithmTiersGrid activeStrategy={forecast.metadata.strategy} />
                    </Paper>

                    {/* Forecast Chart */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            📈 Predicted Natural Gas Usage
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            {forecast.predictions.length} months forecast using {forecast.metadata.strategyName}
                        </Typography>
                        <Box sx={{ height: 400, mt: 2 }}>
                            <Bar data={chartData} options={chartOptions} />
                        </Box>
                    </Paper>

                    {/* Forecast Data Table */}
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            📋 Forecast Details
                        </Typography>
                        <Box sx={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #E0E0E0' }}>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Month</th>
                                        <th style={{ padding: '12px', textAlign: 'right' }}>Predicted Usage ({DATA_CONFIG.UNIT})</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {forecast.predictions.map((pred, index) => (
                                        <tr key={index} style={{ borderBottom: '1px solid #F0F0F0' }}>
                                            <td style={{ padding: '12px' }}>{pred.monthLabel}</td>
                                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>
                                                {pred.value.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Box>
                    </Paper>
                </>
            )}

            {/* Initial State */}
            {!forecast && !isLoading && !error && (
                <Paper sx={{ p: 3 }}>
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            📊 Ready to Generate Forecast
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Select the forecast period and click "Generate Forecast" to see predictions based on historical seasonal patterns
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                            The system will automatically select the best algorithm from our 3-tier system based on available data
                        </Typography>
                    </Box>
                </Paper>
            )}
        </Box>
    );
}

export default ForecastTab;
