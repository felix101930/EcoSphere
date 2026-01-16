// Forecast Chart - Displays consumption, generation, and ML predictions
import { Box, Card, CardContent, Typography, Alert } from '@mui/material';
import { Line } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
    FORECAST_COLORS,
    CHART_HEIGHT
} from '../../lib/constants/forecast';

const ForecastChart = ({
    consumptionData,
    generationData,
    outdoorTemperatureData,
    mlForecastData, // NEW: Add ML forecast data prop
    yAxisLabel = 'Daily Energy (Wh/day)',
    unit = 'Wh',
    consumptionLabel = 'Consumption Forecast',
    generationLabel = 'Generation Forecast',
    mlForecastLabel = 'AI Solar Forecast', // NEW: ML forecast label
    outdoorTemperatureLabel = 'Outdoor Temperature',
    showTotal = true,
    decimalPlaces = 0,
    forecastType = 'historical' // NEW: 'historical' or 'ml'
}) => {
    // Check if we have any data
    const hasConsumption = consumptionData && consumptionData.predictions && consumptionData.predictions.length > 0;
    const hasGeneration = generationData && generationData.predictions && generationData.predictions.length > 0;
    const hasOutdoorTemp = outdoorTemperatureData && outdoorTemperatureData.length > 0;
    const hasMLForecast = mlForecastData && mlForecastData.data && mlForecastData.data.length > 0; // NEW

    // If ML forecast type but no ML data, show message
    if (forecastType === 'ml' && !hasMLForecast) {
        return (
            <Card>
                <CardContent>
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Alert severity="info" sx={{ mb: 2 }}>
                            No ML forecast data available. Please generate forecast.
                        </Alert>
                    </Box>
                </CardContent>
            </Card>
        );
    }

    // For ML forecasts, we only need ML data
    if (forecastType === 'ml' && hasMLForecast) {
        return renderMLForecast();
    }

    // Original logic for historical forecasts
    if (!hasConsumption && !hasGeneration) {
        return null;
    }

    // Prepare labels (use whichever dataset is available)
    const labels = hasConsumption
        ? consumptionData.predictions.map(p => p.date)
        : generationData.predictions.map(p => p.date);

    // Prepare datasets (original logic)
    const datasets = [];

    if (hasConsumption) {
        // Use green for indoor temperature forecast (comfortable/controlled)
        const indoorColor = hasOutdoorTemp ? '#4CAF50' : FORECAST_COLORS.PREDICTED_CONSUMPTION;

        datasets.push({
            label: consumptionLabel,
            data: consumptionData.predictions.map(p => p.value),
            borderColor: indoorColor,
            backgroundColor: indoorColor,
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.1,
            yAxisID: 'y',
            datalabels: {
                display: true,
                align: 'top',
                anchor: 'end',
                formatter: (value) => decimalPlaces > 0 ? value.toFixed(decimalPlaces) : Math.round(value),
                font: {
                    size: 10,
                    weight: 'bold'
                },
                color: indoorColor
            }
        });
    }

    if (hasGeneration) {
        datasets.push({
            label: generationLabel,
            data: generationData.predictions.map(p => p.value),
            borderColor: FORECAST_COLORS.PREDICTED_GENERATION,
            backgroundColor: FORECAST_COLORS.PREDICTED_GENERATION,
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.1,
            yAxisID: 'y',
            datalabels: {
                display: true,
                align: 'bottom',
                anchor: 'start',
                formatter: (value) => decimalPlaces > 0 ? value.toFixed(decimalPlaces) : Math.round(value),
                font: {
                    size: 10,
                    weight: 'bold'
                },
                color: FORECAST_COLORS.PREDICTED_GENERATION
            }
        });
    }

    // Add outdoor temperature as a separate line (if available)
    // Use dynamic colors: red for hot (above indoor), blue for cold (below indoor)
    if (hasOutdoorTemp && hasConsumption) {
        // Calculate average indoor and outdoor temperatures to determine color
        const avgIndoor = consumptionData.predictions.reduce((sum, p) => sum + p.value, 0) / consumptionData.predictions.length;
        const avgOutdoor = outdoorTemperatureData.reduce((sum, p) => sum + p.value, 0) / outdoorTemperatureData.length;

        // Red if outdoor is hotter, blue if outdoor is colder
        const outdoorColor = avgOutdoor > avgIndoor ? '#F44336' : '#2196F3'; // Red : Blue

        datasets.push({
            label: outdoorTemperatureLabel,
            data: outdoorTemperatureData.map(p => p.value),
            borderColor: outdoorColor,
            backgroundColor: outdoorColor,
            borderWidth: 2,
            borderDash: [5, 5], // Dashed line to differentiate
            pointRadius: 3,
            pointHoverRadius: 5,
            tension: 0.1,
            yAxisID: 'y',
            datalabels: {
                display: false // Don't show labels for outdoor temp to avoid clutter
            }
        });
    }

    const chartData = {
        labels,
        datasets
    };

    const options = getChartOptions(yAxisLabel, unit, forecastType);

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    📈 {forecastType === 'ml' ? 'AI Forecast Results' : 'Forecast Results'}
                </Typography>

                {forecastType === 'ml' && hasMLForecast && (
                    <Alert 
                        severity="warning" 
                        icon={<WarningAmberIcon />}
                        sx={{ mb: 3 }}
                    >
                        ⚠️ <strong>For reference only:</strong> AI forecast results. Actual generation may vary.
                    </Alert>
                )}

                <Box sx={{ height: CHART_HEIGHT, position: 'relative' }}>
                    <Line
                        data={chartData}
                        options={options}
                        plugins={[ChartDataLabels]}
                    />
                </Box>

                {/* Summary Statistics */}
                {renderSummaryStatistics()}
            </CardContent>
        </Card>
    );

    // NEW: Function to render ML forecast
    function renderMLForecast() {
        const { data, summary, model_info } = mlForecastData;
        
        // Convert hourly data for chart
        const chartData = {
            labels: data.slice(0, 24).map(p => 
                new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit' })
            ),
            datasets: [
                {
                    label: mlForecastLabel,
                    data: data.slice(0, 24).map(p => p.predicted_kw),
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    borderWidth: 3,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.3,
                    fill: true,
                    datalabels: {
                        display: false
                    }
                }
            ]
        };

        const options = getChartOptions('Power Output (kW)', 'kW', 'ml');

        return (
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        📈 AI Solar Forecast (24-hour)
                    </Typography>

                    <Alert 
                        severity="warning" 
                        icon={<WarningAmberIcon />}
                        sx={{ mb: 3 }}
                    >
                        <Box>
                            <Typography variant="body2" fontWeight="bold" gutterBottom>
                                ⚠️ Important Notice
                            </Typography>
                            <Typography variant="body2">
                                This AI forecast is for <strong>reference purposes only</strong>. 
                                Actual solar generation may vary due to real-time conditions.
                            </Typography>
                        </Box>
                    </Alert>

                    <Box sx={{ height: CHART_HEIGHT, position: 'relative', mb: 3 }}>
                        <Line
                            data={chartData}
                            options={options}
                            plugins={[ChartDataLabels]}
                        />
                    </Box>

                    {/* ML Summary Statistics */}
                    <Box sx={{ 
                        display: 'grid', 
                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                        gap: 2,
                        mt: 3
                    }}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Total Energy
                            </Typography>
                            <Typography variant="h6" fontWeight="bold" color="primary">
                                {summary?.total_kwh?.toFixed(1) || '0.0'} kWh
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Next 24 hours
                            </Typography>
                        </Box>
                        
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Peak Power
                            </Typography>
                            <Typography variant="h6" fontWeight="bold" color="secondary">
                                {summary?.peak_kw?.toFixed(2) || '0.00'} kW
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Maximum output
                            </Typography>
                        </Box>
                        
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Average Output
                            </Typography>
                            <Typography variant="h6" fontWeight="bold" color="info.main">
                                {summary?.total_kwh && data.length 
                                    ? (summary.total_kwh / data.length).toFixed(2) 
                                    : '0.00'} kW
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Per hour average
                            </Typography>
                        </Box>
                        
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Model
                            </Typography>
                            <Typography variant="h6" fontWeight="bold" color="warning.main">
                                {model_info?.name || 'ML Model'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                R²: {(model_info?.r2_score || 0).toFixed(3)}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Model Details */}
                    {model_info && (
                        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                🤖 Model Information
                            </Typography>
                            <Typography variant="body2" paragraph>
                                Using <strong>{model_info.name}</strong> with {model_info.features_used || 17} weather and time features.
                                Model accuracy (R²): <strong>{model_info.r2_score?.toFixed(3) || '0.693'}</strong>
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Forecast limited to 24 hours for maximum prediction accuracy.
                            </Typography>
                        </Box>
                    )}
                </CardContent>
            </Card>
        );
    }

    // NEW: Function to get chart options based on forecast type
    function getChartOptions(yLabel, unit, type = 'historical') {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    enabled: true,
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (type === 'ml') {
                                label += context.parsed.y.toFixed(2) + ' kW';
                            } else {
                                label += Math.round(context.parsed.y).toLocaleString() + ' ' + unit;
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: type === 'ml' ? 'Hour of Day' : 'Date'
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: yLabel
                    },
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        callback: function (value) {
                            if (type === 'ml') {
                                return value.toFixed(1) + ' kW';
                            }
                            return value.toLocaleString() + ' ' + unit;
                        }
                    }
                }
            }
        };
    }

    // NEW: Function to render summary statistics
    function renderSummaryStatistics() {
        return (
            <Box sx={{ mt: 3, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                {hasConsumption && (
                    <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                            Consumption Forecast
                        </Typography>
                        {showTotal ? (
                            <>
                                <Typography variant="body2">
                                    Total: {Math.round(consumptionData.predictions.reduce((sum, p) => sum + p.value, 0)).toLocaleString()} {unit}
                                </Typography>
                                <Typography variant="body2">
                                    Avg/day: {Math.round(consumptionData.predictions.reduce((sum, p) => sum + p.value, 0) / consumptionData.predictions.length).toLocaleString()} {unit}
                                </Typography>
                            </>
                        ) : (
                            <>
                                <Typography variant="body2">
                                    Average: {(consumptionData.predictions.reduce((sum, p) => sum + p.value, 0) / consumptionData.predictions.length).toFixed(decimalPlaces)} {unit}
                                </Typography>
                                <Typography variant="body2">
                                    Range: {Math.min(...consumptionData.predictions.map(p => p.value)).toFixed(decimalPlaces)} - {Math.max(...consumptionData.predictions.map(p => p.value)).toFixed(decimalPlaces)} {unit}
                                </Typography>
                            </>
                        )}
                        <Typography variant="caption" color="text.secondary">
                            Strategy: {consumptionData.metadata.strategyName}
                        </Typography>
                    </Box>
                )}

                {hasGeneration && (
                    <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                            Generation Forecast
                        </Typography>
                        {showTotal ? (
                            <>
                                <Typography variant="body2">
                                    Total: {Math.round(generationData.predictions.reduce((sum, p) => sum + p.value, 0)).toLocaleString()} {unit}
                                </Typography>
                                <Typography variant="body2">
                                    Avg/day: {Math.round(generationData.predictions.reduce((sum, p) => sum + p.value, 0) / generationData.predictions.length).toLocaleString()} {unit}
                                </Typography>
                            </>
                        ) : (
                            <>
                                <Typography variant="body2">
                                    Average: {(generationData.predictions.reduce((sum, p) => sum + p.value, 0) / generationData.predictions.length).toFixed(decimalPlaces)} {unit}
                                </Typography>
                                <Typography variant="body2">
                                    Range: {Math.min(...generationData.predictions.map(p => p.value)).toFixed(decimalPlaces)} - {Math.max(...generationData.predictions.map(p => p.value)).toFixed(decimalPlaces)} {unit}
                                </Typography>
                            </>
                        )}
                        <Typography variant="caption" color="text.secondary">
                            Strategy: {generationData.metadata.strategyName}
                        </Typography>
                    </Box>
                )}

                {hasConsumption && hasGeneration && showTotal && (
                    <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                            Net Energy
                        </Typography>
                        <Typography variant="body2">
                            Total: {Math.round(
                                consumptionData.predictions.reduce((sum, p) => sum + p.value, 0) -
                                generationData.predictions.reduce((sum, p) => sum + p.value, 0)
                            ).toLocaleString()} {unit}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            (Consumption - Generation)
                        </Typography>
                    </Box>
                )}

                {hasOutdoorTemp && hasConsumption && (
                    <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                            Outdoor Temperature
                        </Typography>
                        <Typography variant="body2">
                            Average: {(outdoorTemperatureData.reduce((sum, p) => sum + p.value, 0) / outdoorTemperatureData.length).toFixed(decimalPlaces)} {unit}
                        </Typography>
                        <Typography variant="body2">
                            Range: {Math.min(...outdoorTemperatureData.map(p => p.value)).toFixed(decimalPlaces)} - {Math.max(...outdoorTemperatureData.map(p => p.value)).toFixed(decimalPlaces)} {unit}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {(() => {
                                const avgIndoor = consumptionData.predictions.reduce((sum, p) => sum + p.value, 0) / consumptionData.predictions.length;
                                const avgOutdoor = outdoorTemperatureData.reduce((sum, p) => sum + p.value, 0) / outdoorTemperatureData.length;
                                const diff = Math.abs(avgIndoor - avgOutdoor).toFixed(1);
                                return avgOutdoor > avgIndoor
                                    ? `🔴 ${diff}°C warmer than indoor`
                                    : `🔵 ${diff}°C colder than indoor`;
                            })()}
                        </Typography>
                    </Box>
                )}
            </Box>
        );
    }
};

export default ForecastChart;