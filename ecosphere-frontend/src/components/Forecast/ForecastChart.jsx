// ForecastChart.jsx - Updated for weather data
import { Box, Card, CardContent, Typography, Alert, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { Line } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
    FORECAST_COLORS,
    CHART_HEIGHT
} from '../../lib/constants/forecast';
import { useState } from 'react';

const ForecastChart = ({
    consumptionData,
    generationData,
    mlForecastData,
    forecastType = 'historical',
    yAxisLabel = 'Daily Energy (Wh/day)',
    unit = 'Wh',
    consumptionLabel = 'Consumption Forecast',
    generationLabel = 'Generation Forecast',
    mlForecastLabel = 'AI Solar Forecast',
    outdoorTemperatureLabel = 'Outdoor Temperature',
    showTotal = true,
    decimalPlaces = 0,
    title = '📈 Forecast Chart' // Add customizable title prop
}) => {
    const [chartView, setChartView] = useState('solar'); // 'solar' or 'weather'

    // Check if we have ML forecast data
    const hasMLForecast = mlForecastData && mlForecastData.data && mlForecastData.data.length > 0;

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

    // For ML forecasts
    if (forecastType === 'ml' && hasMLForecast) {
        return renderMLForecast();
    }

    // Original logic for historical forecasts
    if (!consumptionData && !generationData) {
        return null;
    }

    // Prepare labels for historical forecast
    const labels = consumptionData
        ? consumptionData.predictions.map(p => p.date)
        : generationData.predictions.map(p => p.date);

    // Prepare datasets for historical forecast
    const datasets = [];

    if (consumptionData) {
        datasets.push({
            label: consumptionLabel,
            data: consumptionData.predictions.map(p => p.value),
            borderColor: '#005EB8', // SAIT Blue
            backgroundColor: 'rgba(0, 94, 184, 0.1)',
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.1,
            yAxisID: 'y',
            fill: true,
        });
    }

    if (generationData) {
        datasets.push({
            label: generationLabel,
            data: generationData.predictions.map(p => p.value),
            borderColor: '#4CAF50', // Green
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.1,
            yAxisID: 'y',
            fill: true,
        });
    }

    const chartData = {
        labels,
        datasets
    };

    const options = getChartOptions(yAxisLabel, unit, 'historical');

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    {title}
                </Typography>

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

    // Function to render ML forecast with weather data
    function renderMLForecast() {
        const { data, summary, model_info } = mlForecastData;
        
        // Prepare data for charts
        const chartData = {
            labels: data.slice(0, 48).map(p => 
                new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit' })
            ),
            datasets: [
                {
                    label: mlForecastLabel,
                    data: data.slice(0, 48).map(p => p.predicted_kw),
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    borderWidth: 3,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    tension: 0.3,
                    fill: true,
                    yAxisID: 'solar',
                }
            ]
        };

        // Add weather data if available
        const weatherData = data.filter(d => d.weather);
        if (weatherData.length > 0 && chartView === 'weather') {
            // UV Index
            chartData.datasets.push({
                label: 'UV Index',
                data: weatherData.map(p => p.weather.uv_index || 0),
                borderColor: '#FF9800',
                backgroundColor: 'rgba(255, 152, 0, 0.1)',
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 2,
                tension: 0.2,
                yAxisID: 'weather',
            });

            // Cloud Cover
            chartData.datasets.push({
                label: 'Cloud Cover %',
                data: weatherData.map(p => p.weather.clouds_pct || 0),
                borderColor: '#9E9E9E',
                backgroundColor: 'rgba(158, 158, 158, 0.1)',
                borderWidth: 2,
                borderDash: [3, 3],
                pointRadius: 2,
                tension: 0.2,
                yAxisID: 'weather',
            });
        }

        const options = getChartOptions(
            chartView === 'weather' ? 'Weather Factors' : 'Power Output (kW)',
            chartView === 'weather' ? '' : 'kW',
            'ml',
            chartView
        );

        return (
            <Card>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            📈 AI Solar Forecast Results
                        </Typography>
                        
                        {model_info?.weather_integrated && weatherData.length > 0 && (
                            <ToggleButtonGroup
                                value={chartView}
                                exclusive
                                onChange={(e, newView) => newView && setChartView(newView)}
                                size="small"
                            >
                                <ToggleButton value="solar">
                                    Solar Output
                                </ToggleButton>
                                <ToggleButton value="weather">
                                    Weather Data
                                </ToggleButton>
                            </ToggleButtonGroup>
                        )}
                    </Box>

                    <Alert 
                        severity="warning" 
                        icon={<WarningAmberIcon />}
                        sx={{ mb: 3 }}
                    >
                        <Box>
                            <Typography variant="body2" fontWeight="bold" gutterBottom>
                                ⚠️ AI Forecast Disclaimer
                            </Typography>
                            <Typography variant="body2">
                                This forecast is for <strong>reference purposes only</strong>. 
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

                    {/* Weather Data Summary */}
                    {model_info?.weather_integrated && weatherData.length > 0 && (
                        <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                🌤️ Weather Data Summary
                            </Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, 1fr)' }, gap: 2 }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Data Points</Typography>
                                    <Typography variant="body2" fontWeight="bold">{weatherData.length}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Avg UV Index</Typography>
                                    <Typography variant="body2" fontWeight="bold">
                                        {(weatherData.reduce((sum, d) => sum + (d.weather.uv_index || 0), 0) / weatherData.length).toFixed(1)}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Avg Cloud Cover</Typography>
                                    <Typography variant="body2" fontWeight="bold">
                                        {(weatherData.reduce((sum, d) => sum + (d.weather.clouds_pct || 0), 0) / weatherData.length).toFixed(0)}%
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Weather Quality</Typography>
                                    <Typography variant="body2" fontWeight="bold">
                                        {getWeatherQualityLabel(weatherData)}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    )}
                </CardContent>
            </Card>
        );
    }

    function getWeatherQualityLabel(weatherData) {
        const avgUV = weatherData.reduce((sum, d) => sum + (d.weather.uv_index || 0), 0) / weatherData.length;
        const avgClouds = weatherData.reduce((sum, d) => sum + (d.weather.clouds_pct || 0), 0) / weatherData.length;
        
        if (avgUV > 5 && avgClouds < 20) return 'Excellent ☀️';
        if (avgUV > 3 && avgClouds < 40) return 'Good ⛅';
        if (avgUV > 1 && avgClouds < 60) return 'Fair 🌥️';
        return 'Poor ☁️';
    }

    function getChartOptions(yLabel, unit, type = 'historical', view = 'solar') {
        const isML = type === 'ml';
        const isWeatherView = view === 'weather';
        
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
                            
                            if (isML && isWeatherView) {
                                if (context.dataset.label === 'UV Index') {
                                    label += context.parsed.y.toFixed(1);
                                } else if (context.dataset.label === 'Cloud Cover %') {
                                    label += context.parsed.y.toFixed(0) + '%';
                                }
                            } else if (isML) {
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
                        text: isML ? 'Hour of Day' : 'Date'
                    },
                    grid: {
                        display: false
                    }
                },
                solar: {
                    display: !isWeatherView,
                    position: 'left',
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
                            if (isML && !isWeatherView) {
                                return value.toFixed(1) + ' kW';
                            }
                            return value.toLocaleString() + ' ' + unit;
                        }
                    }
                },
                weather: {
                    display: isWeatherView,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Weather Factors'
                    },
                    beginAtZero: true,
                    grid: {
                        drawOnChartArea: false,
                    },
                    ticks: {
                        callback: function (value) {
                            return value.toFixed(1);
                        }
                    }
                }
            }
        };
    }

    function renderSummaryStatistics() {
        // Original summary statistics logic
        return (
            <Box sx={{ mt: 3, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                {consumptionData && (
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
                    </Box>
                )}

                {generationData && (
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
                    </Box>
                )}
            </Box>
        );
    }
};

export default ForecastChart;