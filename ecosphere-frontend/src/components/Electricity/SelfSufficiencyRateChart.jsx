// Self-Sufficiency Rate Chart Component - Line chart showing energy self-sufficiency percentage
import { useMemo } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale,
    Filler
} from 'chart.js';
import 'chartjs-adapter-date-fns';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale,
    Filler
);

// Chart colors
const CHART_COLORS = {
    SELF_SUFFICIENCY: '#2196F3',
    THRESHOLD: '#FF9800'
};

const SELF_SUFFICIENCY_THRESHOLD = 100;

const SelfSufficiencyRateChart = ({ data }) => {
    // Prepare chart data
    const chartData = useMemo(() => {
        if (!data || data.length === 0) {
            return null;
        }

        return {
            labels: data.map(d => new Date(d.ts)),
            datasets: [
                {
                    label: 'Self-Sufficiency Rate (%)',
                    data: data.map(d => d.value),
                    borderColor: CHART_COLORS.SELF_SUFFICIENCY,
                    backgroundColor: CHART_COLORS.SELF_SUFFICIENCY + '20',
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    tension: 0.1,
                    fill: true
                }
            ]
        };
    }, [data]);

    // Chart options
    const options = useMemo(() => ({
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
                        const value = context.parsed.y;
                        let status = '';

                        if (value >= SELF_SUFFICIENCY_THRESHOLD) {
                            status = ' (Self-sufficient)';
                        } else {
                            status = ' (Grid dependent)';
                        }

                        return `Self-Sufficiency Rate: ${value.toFixed(2)}%${status}`;
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
                        day: 'MMM dd'
                    }
                },
                title: {
                    display: true,
                    text: 'Date'
                }
            },
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Self-Sufficiency Rate (%)'
                },
                ticks: {
                    callback: function (value) {
                        return value.toFixed(0) + '%';
                    }
                }
            }
        }
    }), []);

    // Chart plugins for threshold line
    const plugins = useMemo(() => [{
        id: 'thresholdLine',
        afterDatasetsDraw: (chart) => {
            const { ctx, chartArea: { left, right }, scales: { y } } = chart;
            const yPos = y.getPixelForValue(SELF_SUFFICIENCY_THRESHOLD);

            ctx.save();
            ctx.strokeStyle = CHART_COLORS.THRESHOLD;
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(left, yPos);
            ctx.lineTo(right, yPos);
            ctx.stroke();
            ctx.restore();

            // Add label
            ctx.save();
            ctx.fillStyle = CHART_COLORS.THRESHOLD;
            ctx.font = 'bold 12px Arial';
            ctx.fillText('100% (Self-sufficient)', right - 150, yPos - 5);
            ctx.restore();
        }
    }], []);

    if (!chartData) {
        return (
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Self-Sufficiency Rate Trend
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
        <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
                Self-Sufficiency Rate Trend
            </Typography>
            <Box sx={{ height: 400 }}>
                <Line data={chartData} options={options} plugins={plugins} />
            </Box>
        </Paper>
    );
};

export default SelfSufficiencyRateChart;
