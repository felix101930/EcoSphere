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
    yAxisLabel = 'Daily Energy (Wh/day)',
    unit = 'Wh',
    consumptionLabel = 'Consumption Forecast',
    generationLabel = 'Generation Forecast'
}) => {
    // Check if we have any data
    const hasConsumption = consumptionData && consumptionData.predictions && consumptionData.predictions.length > 0;
    const hasGeneration = generationData && generationData.predictions && generationData.predictions.length > 0;

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
        datasets.push({
            label: consumptionLabel,
            data: consumptionData.predictions.map(p => p.value),
            borderColor: FORECAST_COLORS.PREDICTED_CONSUMPTION,
            backgroundColor: FORECAST_COLORS.PREDICTED_CONSUMPTION,
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.1,
            datalabels: {
                display: true,
                align: 'top',
                anchor: 'end',
                formatter: (value) => Math.round(value),
                font: {
                    size: 10,
                    weight: 'bold'
                },
                color: FORECAST_COLORS.PREDICTED_CONSUMPTION
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
            datalabels: {
                display: true,
                align: 'bottom',
                anchor: 'start',
                formatter: (value) => Math.round(value),
                font: {
                    size: 10,
                    weight: 'bold'
                },
                color: FORECAST_COLORS.PREDICTED_GENERATION
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
                    📈 Forecast Results
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
                            <Typography variant="body2">
                                Total: {Math.round(consumptionData.predictions.reduce((sum, p) => sum + p.value, 0)).toLocaleString()} {unit}
                            </Typography>
                            <Typography variant="body2">
                                Avg/day: {Math.round(consumptionData.predictions.reduce((sum, p) => sum + p.value, 0) / consumptionData.predictions.length).toLocaleString()} {unit}
                            </Typography>
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
                            <Typography variant="body2">
                                Total: {Math.round(generationData.predictions.reduce((sum, p) => sum + p.value, 0)).toLocaleString()} {unit}
                            </Typography>
                            <Typography variant="body2">
                                Avg/day: {Math.round(generationData.predictions.reduce((sum, p) => sum + p.value, 0) / generationData.predictions.length).toLocaleString()} {unit}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Strategy: {generationData.metadata.strategyName}
                            </Typography>
                        </Box>
                    )}

                    {hasConsumption && hasGeneration && (
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
                </Box>
            </CardContent>
        </Card>
    );
};

export default ForecastChart;
