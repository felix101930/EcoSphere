// Net Energy with Self-Sufficiency Rate Chart - Dual Y-axis chart
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
    TimeScale
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
    TimeScale
);

// Chart colors
const CHART_COLORS = {
    NET_ENERGY: '#9C27B0',
    SELF_SUFFICIENCY: '#2196F3',
    THRESHOLD: '#FF9800'
};

const SELF_SUFFICIENCY_THRESHOLD = 100;

const NetEnergyWithSelfSufficiencyChart = ({ netEnergyData, selfSufficiencyData }) => {
    // Prepare chart data
    const chartData = useMemo(() => {
        if (!netEnergyData || netEnergyData.length === 0) {
            return null;
        }

        return {
            labels: netEnergyData.map(d => new Date(d.ts)),
            datasets: [
                {
                    label: 'Net Energy (Wh)',
                    data: netEnergyData.map(d => d.value),
                    borderColor: CHART_COLORS.NET_ENERGY,
                    backgroundColor: CHART_COLORS.NET_ENERGY + '20',
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    tension: 0.1,
                    yAxisID: 'y-net-energy'
                },
                {
                    label: 'Self-Sufficiency Rate (%)',
                    data: selfSufficiencyData?.map(d => d.value) || [],
                    borderColor: CHART_COLORS.SELF_SUFFICIENCY,
                    backgroundColor: CHART_COLORS.SELF_SUFFICIENCY + '20',
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    tension: 0.1,
                    yAxisID: 'y-self-sufficiency'
                }
            ]
        };
    }, [netEnergyData, selfSufficiencyData]);

    // Chart options with dual Y-axis
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
                        const datasetLabel = context.dataset.label || '';
                        const value = context.parsed.y;

                        if (datasetLabel.includes('Self-Sufficiency')) {
                            const status = value >= SELF_SUFFICIENCY_THRESHOLD ? 'Self-sufficient' : 'Grid dependent';
                            return `${datasetLabel}: ${value.toFixed(2)}% (${status})`;
                        } else {
                            return `${datasetLabel}: ${value.toFixed(2)} Wh`;
                        }
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
            'y-net-energy': {
                type: 'linear',
                position: 'left',
                title: {
                    display: true,
                    text: 'Net Energy (Wh)',
                    color: CHART_COLORS.NET_ENERGY
                },
                ticks: {
                    color: CHART_COLORS.NET_ENERGY,
                    callback: function (value) {
                        return value.toLocaleString() + ' Wh';
                    }
                },
                grid: {
                    drawOnChartArea: true,
                }
            },
            'y-self-sufficiency': {
                type: 'linear',
                position: 'right',
                title: {
                    display: true,
                    text: 'Self-Sufficiency Rate (%)',
                    color: CHART_COLORS.SELF_SUFFICIENCY
                },
                ticks: {
                    color: CHART_COLORS.SELF_SUFFICIENCY,
                    callback: function (value) {
                        return value.toFixed(0) + '%';
                    }
                },
                grid: {
                    drawOnChartArea: false,
                },
                min: 0
            }
        }
    }), []);

    // Chart plugins for 100% threshold line on right Y-axis
    const plugins = useMemo(() => [{
        id: 'thresholdLine',
        afterDatasetsDraw: (chart) => {
            const { ctx, chartArea: { left, right }, scales } = chart;
            const yScale = scales['y-self-sufficiency'];

            if (!yScale) return;

            const yPos = yScale.getPixelForValue(SELF_SUFFICIENCY_THRESHOLD);

            // Draw threshold line
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
            ctx.textAlign = 'right';
            ctx.fillText('100% (Self-sufficient)', right - 10, yPos - 5);
            ctx.restore();
        }
    }], []);

    if (!chartData) {
        return (
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Net Energy & Electricity Self-Supply Rate Trend (Daily)
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
                Net Energy & Electricity Self-Supply Rate Trend (Daily)
            </Typography>
            <Box sx={{ height: 400 }}>
                <Line data={chartData} options={options} plugins={plugins} />
            </Box>
        </Paper>
    );
};

export default NetEnergyWithSelfSufficiencyChart;
