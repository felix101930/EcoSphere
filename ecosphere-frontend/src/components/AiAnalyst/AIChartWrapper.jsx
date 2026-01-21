// AI Chart Wrapper - Chart.js based chart for AI Analyst
// Supports single and multiple data series with consistent styling
import { useMemo } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { Line, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    TimeScale
} from 'chart.js';
import 'chartjs-adapter-date-fns';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    TimeScale
);

const AIChartWrapper = ({ data, config }) => {
    // Prepare chart data - must be called unconditionally
    const chartData = useMemo(() => {
        if (!data || data.length === 0) {
            return null;
        }

        const color = config?.color || '#1976d2';
        const title = config?.title || 'Value';

        return {
            labels: data.map(d => new Date(d.ts)),
            datasets: [
                {
                    label: title,
                    data: data.map(d => d.value),
                    borderColor: color,
                    backgroundColor: color + '20',
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    tension: 0.1,
                    fill: config?.type === 'area'
                }
            ]
        };
    }, [data, config]);

    // Chart options - must be called unconditionally
    const options = useMemo(() => {
        const unit = config?.unit || '';

        return {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: false,
                        boxWidth: 40,
                        boxHeight: 3
                    }
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
                                label += context.parsed.y.toFixed(2);
                                if (unit) {
                                    label += ' ' + unit;
                                }
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day',
                        displayFormats: {
                            day: 'MMM dd',
                            hour: 'MMM dd HH:mm'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Date/Time'
                    }
                },
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: config?.yAxisLabel || (config?.title + (unit ? ` (${unit})` : ''))
                    },
                    ticks: {
                        callback: function (value) {
                            return value.toLocaleString() + (unit ? ' ' + unit : '');
                        }
                    }
                }
            }
        };
    }, [config]);

    // Render appropriate chart type
    const renderChart = () => {
        if (!chartData) {
            return null;
        }

        switch (config?.type) {
            case 'bar':
                return <Bar data={chartData} options={options} />;
            case 'area':
            case 'line':
            default:
                return <Line data={chartData} options={options} />;
        }
    };

    // Handle empty state
    if (!data || data.length === 0 || !chartData) {
        return (
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    {config?.title || 'Analysis Result'}
                </Typography>
                <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography color="text.secondary">
                        No data available
                    </Typography>
                </Box>
            </Paper>
        );
    }

    return (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: config?.color || '#1976d2' }}>
                {config?.title || 'Analysis Result'}
            </Typography>
            <Box sx={{ height: 400 }}>
                {renderChart()}
            </Box>
        </Paper>
    );
};

export default AIChartWrapper;
