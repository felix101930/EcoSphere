// Forecast Chart - Displays consumption and generation predictions
import { Box, Card, CardContent, Typography } from '@mui/material';
import { Line } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import {
    FORECAST_COLORS,
    CHART_HEIGHT
} from '../../lib/constants/forecast';

const ForecastChart = ({
    consumptionData,
    generationData,
    outdoorTemperatureData,
    yAxisLabel = 'Daily Energy (Wh/day)',
    unit = 'Wh',
    consumptionLabel = 'Consumption Forecast',
    generationLabel = 'Generation Forecast',
    outdoorTemperatureLabel = 'Outdoor Temperature',
    showTotal = true,
    decimalPlaces = 0
}) => {
    // Check if we have any data
    const hasConsumption = consumptionData && consumptionData.predictions && consumptionData.predictions.length > 0;
    const hasGeneration = generationData && generationData.predictions && generationData.predictions.length > 0;
    const hasOutdoorTemp = outdoorTemperatureData && outdoorTemperatureData.length > 0;

    if (!hasConsumption && !hasGeneration) {
        return null;
    }

    // Prepare labels (use whichever dataset is available)
    const labels = hasConsumption
        ? consumptionData.predictions.map(p => p.date)
        : generationData.predictions.map(p => p.date);

    // Prepare datasets
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

    const options = {
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
                        label += Math.round(context.parsed.y).toLocaleString() + ' ' + unit;
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
                    text: 'Date'
                },
                grid: {
                    display: false
                }
            },
            y: {
                display: true,
                title: {
                    display: true,
                    text: yAxisLabel
                },
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                },
                ticks: {
                    callback: function (value) {
                        return value.toLocaleString() + ' ' + unit;
                    }
                }
            }
        }
    };

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    📈 Temperature Forecast
                </Typography>

                <Box sx={{ height: CHART_HEIGHT, position: 'relative' }}>
                    <Line
                        data={chartData}
                        options={options}
                        plugins={[ChartDataLabels]}
                    />
                </Box>

                {/* Summary Statistics */}
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
            </CardContent>
        </Card>
    );
};

export default ForecastChart;
