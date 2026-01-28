// Overall Trend Chart Component - Line chart for consumption/generation/net energy
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
import { CHART_COLORS } from '../../lib/constants/electricity';
import {
  detectDailyPeaksAndValleys,
  createPeakPointAnnotation,
  createPeakLabelAnnotation,
  createValleyPointAnnotation,
  createValleyLabelAnnotation,
  createDayViewPointAnnotation
} from '../../lib/utils/chartAnnotations';

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

const OverallTrendChart = ({
  data,
  title,
  dataLabel,
  color = CHART_COLORS.PRIMARY,
  preserveSign = false,
  unit = 'Wh',
  yAxisLabel = 'Energy (Wh)'
}) => {
  // State for showing/hiding peak and valley annotations
  const [showAnnotations, setShowAnnotations] = useState(true);

  // State for tracking if we're in 26-hour view (to show/hide day navigation buttons)
  const [isInDayView, setIsInDayView] = useState(false);

  // Reference to chart instance for zoom controls
  const chartRef = React.useRef(null);

  // Detect daily peaks and valleys
  const peaksAndValleys = useMemo(() => {
    if (!data || data.length === 0) return { peaks: [], valleys: [] };
    return detectDailyPeaksAndValleys(data);
  }, [data]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return null;
    }

    return {
      labels: data.map(d => new Date(d.ts)),
      datasets: [
        {
          label: dataLabel,
          data: data.map(d => preserveSign ? d.value : Math.abs(d.value)),
          borderColor: color,
          backgroundColor: color + '20',
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.1
        }
      ]
    };
  }, [data, dataLabel, color, preserveSign]);

  // Chart options (without annotations - they are added dynamically)
  const options = useMemo(() => {
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
            // Only detect day view state, do NOT auto-align to prevent infinite loop
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

              // DO NOT auto-align here - it causes infinite loop
              // Alignment only happens when user clicks Previous/Next Day buttons
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
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                label += context.parsed.y.toFixed(2) + ' ' + unit;
              }
              return label;
            }
          }
        },
        annotation: {
          clip: false,
          animations: {
            numbers: { duration: 0 },
            colors: { duration: 0 }
          },
          annotations: {} // Empty initially, will be updated dynamically
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
          beginAtZero: false,
          title: {
            display: true,
            text: yAxisLabel
          },
          ticks: {
            callback: function (value) {
              return value.toLocaleString() + ' ' + unit;
            }
          }
        }
      },
      layout: {
        padding: {
          top: 50,
          bottom: 50,
          left: 20,
          right: 20
        }
      }
    };
  }, [unit, yAxisLabel]); // Only depend on unit and yAxisLabel, not on showAnnotations or peaks

  // Update chart annotations when showAnnotations, isInDayView changes
  React.useEffect(() => {
    if (chartRef.current && chartRef.current.options) {
      // Rebuild annotations based on current state
      const annotations = {};

      // In day view, show all data points (no date range restriction)
      if (isInDayView && data && showAnnotations) {
        // Create a set of peak and valley timestamps for quick lookup
        const peakTimestamps = new Set(peaksAndValleys.peaks.map(p => p.timestamp));
        const valleyTimestamps = new Set(peaksAndValleys.valleys.map(v => v.timestamp));

        // Show all data points in day view using utility function
        data.forEach((point, index) => {
          const isPeak = peakTimestamps.has(point.ts);
          const isValley = valleyTimestamps.has(point.ts);

          // Skip if it's a peak or valley (they're handled separately below)
          if (!isPeak && !isValley) {
            Object.assign(annotations, createDayViewPointAnnotation(point, index, preserveSign, unit));
          }
        });
      }

      // Add peak annotations using utility functions
      peaksAndValleys.peaks.forEach((peak, index) => {
        Object.assign(annotations, createPeakPointAnnotation(peak, index));
        if (showAnnotations) {
          Object.assign(annotations, createPeakLabelAnnotation(peak, index, unit));
        }
      });

      // Add valley annotations using utility functions
      peaksAndValleys.valleys.forEach((valley, index) => {
        Object.assign(annotations, createValleyPointAnnotation(valley, index));
        if (showAnnotations) {
          Object.assign(annotations, createValleyLabelAnnotation(valley, index, unit));
        }
      });

      // Update annotations without recreating the chart
      chartRef.current.options.plugins.annotation.annotations = annotations;
      chartRef.current.update('none');
    }
  }, [showAnnotations, peaksAndValleys, unit, isInDayView, data, preserveSign]);

  // Zoom control handlers
  const handleZoomIn = () => {
    if (chartRef.current) {
      chartRef.current.zoom(1.2);

      // Manually check if we're in day view after zoom
      setTimeout(() => {
        if (chartRef.current) {
          const xScale = chartRef.current.scales.x;
          const currentMin = xScale.min;
          const currentMax = xScale.max;
          const currentRange = currentMax - currentMin;
          const minRange = 26 * 60 * 60 * 1000; // 26 hours

          const inDayView = currentRange <= minRange + (60 * 60 * 1000);
          setIsInDayView(inDayView);
        }
      }, 0);
    }
  };

  const handleZoomOut = () => {
    if (chartRef.current) {
      chartRef.current.zoom(0.8);

      // Manually check if we're still in day view after zoom
      setTimeout(() => {
        if (chartRef.current) {
          const xScale = chartRef.current.scales.x;
          const currentMin = xScale.min;
          const currentMax = xScale.max;
          const currentRange = currentMax - currentMin;
          const minRange = 26 * 60 * 60 * 1000; // 26 hours

          const inDayView = currentRange <= minRange + (60 * 60 * 1000);
          setIsInDayView(inDayView);
        }
      }, 0);
    }
  };

  const handleResetZoom = () => {
    if (chartRef.current) {
      chartRef.current.resetZoom();
      setIsInDayView(false); // Reset to full view, hide day navigation buttons
    }
  };

  // Day navigation handlers (shift by 24 hours, aligned to day boundaries)
  const handlePreviousDay = () => {
    if (chartRef.current) {
      const xScale = chartRef.current.scales.x;
      const currentMin = xScale.min;
      const currentMax = xScale.max;
      const currentRange = currentMax - currentMin;

      // Get original data range
      const originalMin = data && data.length > 0 ? new Date(data[0].ts).getTime() : null;

      // 26 hours in milliseconds
      const minRange = 26 * 60 * 60 * 1000;

      // If we're at the 26-hour minimum range, shift by aligned days
      if (currentRange <= minRange + (60 * 60 * 1000)) {
        // Find current center date
        const centerTime = currentMin + (currentRange / 2);
        const centerDate = new Date(centerTime);

        // Move to previous day
        const targetDate = new Date(centerDate);
        targetDate.setDate(targetDate.getDate() - 1);
        targetDate.setHours(0, 0, 0, 0);

        // Calculate aligned range: previous day 23:00 to next day 01:00
        const alignedMin = new Date(targetDate);
        alignedMin.setHours(-1, 0, 0, 0); // Previous day 23:00

        const alignedMax = new Date(targetDate);
        alignedMax.setDate(alignedMax.getDate() + 1);
        alignedMax.setHours(1, 0, 0, 0); // Next day 01:00

        // Don't go before the original data start
        if (!originalMin || alignedMin.getTime() >= originalMin) {
          chartRef.current.zoomScale('x', { min: alignedMin.getTime(), max: alignedMax.getTime() }, 'none');
        }
      } else {
        // For larger ranges, just shift by 24 hours using pan
        const shiftAmount = 24 * 60 * 60 * 1000;

        if (!originalMin || (currentMin - shiftAmount) >= originalMin) {
          chartRef.current.pan({ x: shiftAmount }, undefined, 'none');
        }
      }
    }
  };

  const handleNextDay = () => {
    if (chartRef.current) {
      const xScale = chartRef.current.scales.x;
      const currentMin = xScale.min;
      const currentMax = xScale.max;
      const currentRange = currentMax - currentMin;

      // Get original data range
      const originalMax = data && data.length > 0 ? new Date(data[data.length - 1].ts).getTime() : null;

      // 26 hours in milliseconds
      const minRange = 26 * 60 * 60 * 1000;

      // If we're at the 26-hour minimum range, shift by aligned days
      if (currentRange <= minRange + (60 * 60 * 1000)) {
        // Find current center date
        const centerTime = currentMin + (currentRange / 2);
        const centerDate = new Date(centerTime);

        // Move to next day
        const targetDate = new Date(centerDate);
        targetDate.setDate(targetDate.getDate() + 1);
        targetDate.setHours(0, 0, 0, 0);

        // Calculate aligned range: previous day 23:00 to next day 01:00
        const alignedMin = new Date(targetDate);
        alignedMin.setHours(-1, 0, 0, 0); // Previous day 23:00

        const alignedMax = new Date(targetDate);
        alignedMax.setDate(alignedMax.getDate() + 1);
        alignedMax.setHours(1, 0, 0, 0); // Next day 01:00

        // Don't go beyond the original data end
        if (!originalMax || alignedMax.getTime() <= originalMax) {
          chartRef.current.zoomScale('x', { min: alignedMin.getTime(), max: alignedMax.getTime() }, 'none');
        }
      } else {
        // For larger ranges, just shift by 24 hours using pan
        const shiftAmount = 24 * 60 * 60 * 1000;

        if (!originalMax || (currentMax + shiftAmount) <= originalMax) {
          chartRef.current.pan({ x: -shiftAmount }, undefined, 'none');
        }
      }
    }
  };

  if (!chartData) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {title}
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
          {title}
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
            label="Show Peak/Valley Labels"
          />
        </Box>
      </Box>
      <Box sx={{ height: 400, position: 'relative' }}>
        <Line ref={chartRef} data={chartData} options={options} />

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

export default OverallTrendChart;
