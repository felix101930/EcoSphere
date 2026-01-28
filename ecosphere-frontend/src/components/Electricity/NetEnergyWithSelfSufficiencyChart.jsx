// Net Energy with Consumption & Generation Chart - Three-line chart with interactive features
import { useMemo, useState } from 'react';
import React from 'react';
import { Box, Paper, Typography, FormControlLabel, Switch, Button, ButtonGroup } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
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
import annotationPlugin from 'chartjs-plugin-annotation';
import zoomPlugin from 'chartjs-plugin-zoom';
import 'chartjs-adapter-date-fns';
import { detectDailyPeaksAndValleys, formatTimeLabel } from '../../lib/utils/chartAnnotations';
import { useChartZoom } from '../../lib/hooks/useChartZoom';

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
    annotationPlugin,
    zoomPlugin
);

// Chart colors - matching Consumption and Generation tabs
const CHART_COLORS = {
    CONSUMPTION: '#DA291C',  // SAIT Red
    GENERATION: '#4CAF50',   // Green
    NET_ENERGY: '#9C27B0',   // Purple
    SELF_SUFFICIENCY: '#2196F3',  // Blue
    THRESHOLD: '#FF9800'     // Orange for 100% threshold line
};

const SELF_SUFFICIENCY_THRESHOLD = 100;

const NetEnergyWithSelfSufficiencyChart = ({ netEnergyData, consumptionData, generationData, selfSufficiencyData }) => {
    // State for showing/hiding peak annotations (default: true)
    const [showAnnotations, setShowAnnotations] = useState(true);

    // Reference to chart instance for zoom controls
    const chartRef = React.useRef(null);

    // Use custom hook for zoom and day navigation
    const {
        isInDayView,
        setIsInDayView,
        handleZoomIn,
        handleZoomOut,
        handleResetZoom,
        handlePreviousDay,
        handleNextDay
    } = useChartZoom(chartRef, netEnergyData);

    // Detect daily peaks for Self-Supply Rate where value > 100%
    const selfSufficiencyPeaks = useMemo(() => {
        if (!selfSufficiencyData || selfSufficiencyData.length === 0) return [];

        // Detect all peaks
        const allPeaks = detectDailyPeaksAndValleys(selfSufficiencyData).peaks;

        // Filter only peaks where value > 100%
        return allPeaks.filter(peak => peak.value > SELF_SUFFICIENCY_THRESHOLD);
    }, [selfSufficiencyData]);

    // Prepare chart data with four lines
    const chartData = useMemo(() => {
        if (!netEnergyData || netEnergyData.length === 0) {
            return null;
        }

        return {
            labels: netEnergyData.map(d => new Date(d.ts)),
            datasets: [
                {
                    label: 'Consumption (Wh)',
                    data: consumptionData?.map(d => Math.abs(d.value)) || [],
                    borderColor: CHART_COLORS.CONSUMPTION,
                    backgroundColor: CHART_COLORS.CONSUMPTION + '20',
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    tension: 0.1,
                    yAxisID: 'y-energy'
                },
                {
                    label: 'Generation (Wh)',
                    data: generationData?.map(d => Math.abs(d.value)) || [],
                    borderColor: CHART_COLORS.GENERATION,
                    backgroundColor: CHART_COLORS.GENERATION + '20',
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    tension: 0.1,
                    yAxisID: 'y-energy'
                },
                {
                    label: 'Net Energy (Wh)',
                    data: netEnergyData.map(d => d.value),
                    borderColor: CHART_COLORS.NET_ENERGY,
                    backgroundColor: CHART_COLORS.NET_ENERGY + '20',
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    tension: 0.1,
                    yAxisID: 'y-energy'
                },
                {
                    label: 'Self-Supply Rate (%)',
                    data: selfSufficiencyData?.map(d => d.value) || [],
                    borderColor: CHART_COLORS.SELF_SUFFICIENCY,
                    backgroundColor: CHART_COLORS.SELF_SUFFICIENCY + '20',
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    tension: 0.1,
                    yAxisID: 'y-percentage'
                }
            ]
        };
    }, [netEnergyData, consumptionData, generationData, selfSufficiencyData]);

    // Chart options with dual Y-axis and annotations
    const options = useMemo(() => {
        const annotations = {};

        // Add peak annotations for Self-Supply Rate > 100% (only if showAnnotations is true)
        if (showAnnotations) {
            selfSufficiencyPeaks.forEach((peak, index) => {
                const timestamp = new Date(peak.timestamp);
                const timeLabel = formatTimeLabel(timestamp);

                // Add point marker
                annotations[`selfSufficiencyPeakPoint${index}`] = {
                    type: 'point',
                    xValue: timestamp,
                    yValue: peak.value,
                    backgroundColor: 'rgba(33, 150, 243, 0.8)',
                    borderColor: 'rgb(33, 150, 243)',
                    borderWidth: 2,
                    radius: 5,
                    yScaleID: 'y-percentage'
                };

                // Add label
                annotations[`selfSufficiencyPeak${index}`] = {
                    type: 'label',
                    xValue: timestamp,
                    yValue: peak.value,
                    yAdjust: -25,
                    backgroundColor: 'rgba(33, 150, 243, 0.9)',
                    borderColor: 'rgb(33, 150, 243)',
                    borderWidth: 2,
                    borderRadius: 4,
                    color: 'white',
                    content: [`${timeLabel}`, `${peak.value.toFixed(1)}%`],
                    font: {
                        size: 10,
                        weight: 'bold'
                    },
                    padding: 6,
                    yScaleID: 'y-percentage'
                };
            });
        }

        return {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            transitions: {
                zoom: {
                    animation: {
                        duration: 0
                    }
                }
            },
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'x',
                        modifierKey: null
                    },
                    zoom: {
                        wheel: {
                            enabled: true,
                            speed: 0.02
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'x',
                        // Only detect day view state
                        onZoomComplete: ({ chart }) => {
                            const xScale = chart.scales.x;
                            const currentMin = xScale.min;
                            const currentMax = xScale.max;
                            const currentRange = currentMax - currentMin;

                            // 26 hours in milliseconds
                            const minRange = 26 * 60 * 60 * 1000;

                            // Check if we're in day view (26-hour range)
                            const inDayView = currentRange <= minRange + (60 * 60 * 1000);
                            setIsInDayView(inDayView);
                        }
                    },
                    limits: {
                        x: {
                            min: 'original',
                            max: 'original',
                            // Minimum zoom range: 26 hours (in milliseconds)
                            minRange: 26 * 60 * 60 * 1000
                        }
                    }
                },
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

                            if (datasetLabel.includes('Self-Supply')) {
                                const status = value >= SELF_SUFFICIENCY_THRESHOLD ? 'Self-sufficient' : 'Grid dependent';
                                return `${datasetLabel}: ${value.toFixed(2)}% (${status})`;
                            } else {
                                return `${datasetLabel}: ${value.toFixed(2)} Wh`;
                            }
                        }
                    }
                },
                annotation: {
                    clip: false,
                    animations: {
                        numbers: { duration: 0 },
                        colors: { duration: 0 }
                    },
                    annotations: annotations
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
                'y-energy': {
                    type: 'linear',
                    position: 'left',
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Energy (Wh)'
                    },
                    ticks: {
                        callback: function (value) {
                            return value.toLocaleString() + ' Wh';
                        }
                    },
                    grid: {
                        drawOnChartArea: true
                    }
                },
                'y-percentage': {
                    type: 'linear',
                    position: 'right',
                    min: 0,
                    title: {
                        display: true,
                        text: 'Self-Supply Rate (%)',
                        color: CHART_COLORS.SELF_SUFFICIENCY
                    },
                    ticks: {
                        color: CHART_COLORS.SELF_SUFFICIENCY,
                        callback: function (value) {
                            return value.toFixed(0) + '%';
                        }
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            },
            layout: {
                padding: {
                    top: 20,
                    bottom: 50,
                    left: 20,
                    right: 20
                }
            }
        };
    }, [selfSufficiencyPeaks, showAnnotations, setIsInDayView]);

    // Update chart annotations when showAnnotations changes
    React.useEffect(() => {
        if (chartRef.current && chartRef.current.options) {
            // Rebuild annotations based on current state
            const annotations = {};

            // Add peak annotations for Self-Supply Rate > 100% (only if showAnnotations is true)
            if (showAnnotations) {
                selfSufficiencyPeaks.forEach((peak, index) => {
                    const timestamp = new Date(peak.timestamp);
                    const timeLabel = formatTimeLabel(timestamp);

                    // Add point marker
                    annotations[`selfSufficiencyPeakPoint${index}`] = {
                        type: 'point',
                        xValue: timestamp,
                        yValue: peak.value,
                        backgroundColor: 'rgba(33, 150, 243, 0.8)',
                        borderColor: 'rgb(33, 150, 243)',
                        borderWidth: 2,
                        radius: 5,
                        yScaleID: 'y-percentage'
                    };

                    // Add label
                    annotations[`selfSufficiencyPeak${index}`] = {
                        type: 'label',
                        xValue: timestamp,
                        yValue: peak.value,
                        yAdjust: -25,
                        backgroundColor: 'rgba(33, 150, 243, 0.9)',
                        borderColor: 'rgb(33, 150, 243)',
                        borderWidth: 2,
                        borderRadius: 4,
                        color: 'white',
                        content: [`${timeLabel}`, `${peak.value.toFixed(1)}%`],
                        font: {
                            size: 10,
                            weight: 'bold'
                        },
                        padding: 6,
                        yScaleID: 'y-percentage'
                    };
                });
            }

            // Update annotations without recreating the chart
            chartRef.current.options.plugins.annotation.annotations = annotations;
            chartRef.current.update('none');
        }
    }, [showAnnotations, selfSufficiencyPeaks]);

    // Chart plugins for 100% threshold line on right Y-axis
    const plugins = useMemo(() => [{
        id: 'thresholdLine',
        afterDatasetsDraw: (chart) => {
            const { ctx, chartArea: { left, right }, scales } = chart;
            const yScale = scales['y-percentage'];

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
                    Net Energy Trend & Self-Supply Rate (Daily)
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                    Net Energy Trend & Self-Supply Rate (Daily)
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <ButtonGroup variant="outlined" size="small">
                        <Button onClick={handleZoomIn} startIcon={<ZoomInIcon />}>
                            Zoom In
                        </Button>
                        <Button onClick={handleZoomOut} startIcon={<ZoomOutIcon />}>
                            Zoom Out
                        </Button>
                        <Button onClick={handleResetZoom} startIcon={<RestartAltIcon />}>
                            Reset
                        </Button>
                    </ButtonGroup>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={showAnnotations}
                                onChange={(e) => setShowAnnotations(e.target.checked)}
                                color="primary"
                            />
                        }
                        label="Show Peak Labels (>100%)"
                    />
                </Box>
            </Box>
            <Box sx={{ height: 400, position: 'relative' }}>
                <Line ref={chartRef} data={chartData} options={options} plugins={plugins} />

                {/* Day Navigation Buttons - Only show in 26-hour day view */}
                {isInDayView && (
                    <Box sx={{
                        position: 'absolute',
                        bottom: 8,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 2,
                        zIndex: 10
                    }}>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<ArrowBackIcon />}
                            onClick={handlePreviousDay}
                            sx={{
                                backgroundColor: 'background.paper',
                                '&:hover': {
                                    backgroundColor: 'action.hover'
                                }
                            }}
                        >
                            Previous Day
                        </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            endIcon={<ArrowForwardIcon />}
                            onClick={handleNextDay}
                            sx={{
                                backgroundColor: 'background.paper',
                                '&:hover': {
                                    backgroundColor: 'action.hover'
                                }
                            }}
                        >
                            Next Day
                        </Button>
                    </Box>
                )}
            </Box>
        </Paper>
    );
};

export default NetEnergyWithSelfSufficiencyChart;
