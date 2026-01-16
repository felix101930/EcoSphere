// Monthly Usage Chart - Bar chart for natural gas consumption
import { useMemo } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { CHART_COLORS, DATA_CONFIG } from '../../lib/constants/naturalGas';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

function MonthlyUsageChart({ data, dataSource, count }) {
    // Prepare chart data
    const chartData = useMemo(() => {
        if (!data || data.length === 0) {
            return null;
        }

        return {
            labels: data.map(d => d.monthLabel),
            datasets: [
                {
                    label: `Usage (${DATA_CONFIG.UNIT})`,
                    data: data.map(d => d.value),
                    backgroundColor: CHART_COLORS.PRIMARY + '80',
                    borderColor: CHART_COLORS.PRIMARY,
                    borderWidth: 1
                }
            ]
        };
    }, [data]);

    // Chart options
    const chartOptions = useMemo(() => ({
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
    }), []);

    if (!chartData) {
        return null;
    }

    return (
        <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
                Monthly Natural Gas Usage
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
                {dataSource} | {count} months of data
            </Typography>
            <Box sx={{ height: 400 }}>
                <Bar data={chartData} options={chartOptions} />
            </Box>
        </Paper>
    );
}

export default MonthlyUsageChart;
