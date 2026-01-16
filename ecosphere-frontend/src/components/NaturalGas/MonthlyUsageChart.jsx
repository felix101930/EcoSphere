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
import NoDataMessage from '../Common/NoDataMessage';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

function MonthlyUsageChart({ data, dataSource, dateFrom, dateTo }) {
    // Prepare chart data with strict year filtering based on date range
    const { chartData, actualCount, hasValidData } = useMemo(() => {
        if (!data || data.length === 0) {
            return { chartData: null, actualCount: 0, hasValidData: false };
        }

        // Get expected year range from dateFrom and dateTo
        const fromDate = new Date(dateFrom);
        const toDate = new Date(dateTo);
        const expectedFromYear = fromDate.getFullYear();
        const expectedToYear = toDate.getFullYear();

        // Strict filter: only include data within the expected year range
        const filteredData = data.filter(item => {
            const year = parseInt(item.month.split('-')[0]);
            return year >= expectedFromYear && year <= expectedToYear;
        });

        // If no data matches the expected year range, return no data
        if (filteredData.length === 0) {
            return { chartData: null, actualCount: 0, hasValidData: false };
        }

        // Check if there's any valid data (non-zero values)
        const hasValidData = filteredData.some(item => item.value > 0);

        return {
            chartData: {
                labels: filteredData.map(d => d.monthLabel),
                datasets: [
                    {
                        label: `Usage (${DATA_CONFIG.UNIT})`,
                        data: filteredData.map(d => d.value),
                        backgroundColor: CHART_COLORS.PRIMARY + '80',
                        borderColor: CHART_COLORS.PRIMARY,
                        borderWidth: 1
                    }
                ]
            },
            actualCount: filteredData.length,
            hasValidData
        };
    }, [data, dateFrom, dateTo]);

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

    if (!chartData || !hasValidData) {
        return (
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Monthly Natural Gas Usage
                </Typography>
                <NoDataMessage message="No natural gas usage data available for the selected time period. Data will be available after the next meter reading." />
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
                Monthly Natural Gas Usage
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
                {dataSource} | {actualCount} months of data
            </Typography>
            <Box sx={{ height: 400 }}>
                <Bar data={chartData} options={chartOptions} />
            </Box>
        </Paper>
    );
}

export default MonthlyUsageChart;
