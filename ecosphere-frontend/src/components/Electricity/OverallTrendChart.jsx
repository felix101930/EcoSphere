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

/**
 * Detect daily peaks and valleys in time series data
 * Finds the highest and lowest value for each day
 * @param {Array} data - Array of {ts, value} objects
 * @returns {Object} - {peaks: [], valleys: []}
 */
const detectDailyPeaksAndValleys = (data) => {
  if (!data || data.length === 0) return { peaks: [], valleys: [] };

  // Group data by date
  const dailyData = {};

  data.forEach((item, index) => {
    const date = item.ts.split(' ')[0]; // Extract date part (YYYY-MM-DD)
    const value = Math.abs(item.value);

    if (!dailyData[date]) {
      dailyData[date] = {
        peak: { value: -Infinity, timestamp: null, index: -1 },
        valley: { value: Infinity, timestamp: null, index: -1 }
      };
    }

    // Update peak
    if (value > dailyData[date].peak.value) {
      dailyData[date].peak = {
        value: value,
        timestamp: item.ts,
        index: index
      };
    }

    // Update valley
    if (value < dailyData[date].valley.value) {
      dailyData[date].valley = {
        value: value,
        timestamp: item.ts,
        index: index
      };
    }
  });

  // Convert to arrays
  const peaks = [];
  const valleys = [];

  Object.keys(dailyData).sort().forEach(date => {
    const dayData = dailyData[date];

    if (dayData.peak.timestamp) {
      peaks.push({
        date: date,
        value: dayData.peak.value,
        timestamp: dayData.peak.timestamp,
        index: dayData.peak.index
      });
    }

    if (dayData.valley.timestamp) {
      valleys.push({
        date: date,
        value: dayData.valley.value,
        timestamp: dayData.valley.timestamp,
        index: dayData.valley.index
      });
    }
  });

  return { peaks, valleys };
};

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

  // Chart options with annotations
  const options = useMemo(() => {
    const annotations = {};

    // Always add point markers
    peaksAndValleys.peaks.forEach((peak, index) => {
      const timestamp = new Date(peak.timestamp);

      // Add point marker (always visible)
      annotations[`peakPoint${index}`] = {
        type: 'point',
        xValue: timestamp,
        yValue: peak.value,
        backgroundColor: 'rgba(255, 99, 132, 0.8)',
        borderColor: 'rgb(255, 99, 132)',
        borderWidth: 2,
        radius: 5
      };

      // Add label (conditionally visible)
      if (showAnnotations) {
        const hour = timestamp.getHours();
        const timeLabel = hour === 0 ? '12 a.m.' :
          hour < 12 ? `${hour} a.m.` :
            hour === 12 ? '12 p.m.' :
              `${hour - 12} p.m.`;

        annotations[`peak${index}`] = {
          type: 'label',
          xValue: timestamp,
          yValue: peak.value,
          yAdjust: -25,
          backgroundColor: 'rgba(255, 99, 132, 0.9)',
          borderColor: 'rgb(255, 99, 132)',
          borderWidth: 2,
          borderRadius: 4,
          color: 'white',
          content: [`${timeLabel}`, `${peak.value.toFixed(0)} ${unit}`],
          font: {
            size: 10,
            weight: 'bold'
          },
          padding: 6
        };
      }
    });

    // Always add valley point markers
    peaksAndValleys.valleys.forEach((valley, index) => {
      const timestamp = new Date(valley.timestamp);

      // Add point marker (always visible)
      annotations[`valleyPoint${index}`] = {
        type: 'point',
        xValue: timestamp,
        yValue: valley.value,
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 2,
        radius: 5
      };

      // Add label (conditionally visible)
      if (showAnnotations) {
        const hour = timestamp.getHours();
        const timeLabel = hour === 0 ? '12 a.m.' :
          hour < 12 ? `${hour} a.m.` :
            hour === 12 ? '12 p.m.' :
              `${hour - 12} p.m.`;

        annotations[`valley${index}`] = {
          type: 'label',
          xValue: timestamp,
          yValue: valley.value,
          yAdjust: 25,
          backgroundColor: 'rgba(54, 162, 235, 0.9)',
          borderColor: 'rgb(54, 162, 235)',
          borderWidth: 2,
          borderRadius: 4,
          color: 'white',
          content: [`${timeLabel}`, `${valley.value.toFixed(0)} ${unit}`],
          font: {
            size: 10,
            weight: 'bold'
          },
          padding: 6
        };
      }
    });

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
            // Auto-align to day boundaries when reaching 26-hour limit
            onZoomComplete: ({ chart }) => {
              const xScale = chart.scales.x;
              const currentMin = xScale.min;
              const currentMax = xScale.max;
              const currentRange = currentMax - currentMin;

              // 26 hours in milliseconds
              const minRange = 26 * 60 * 60 * 1000;

              // If we're at or near the minimum range (within 1 hour tolerance)
              if (currentRange <= minRange + (60 * 60 * 1000)) {
                // Find the center date of current view
                const centerTime = currentMin + (currentRange / 2);
                const centerDate = new Date(centerTime);

                // Get the date at midnight
                const targetDate = new Date(centerDate);
                targetDate.setHours(0, 0, 0, 0);

                // Calculate aligned range: previous day 23:00 to next day 01:00
                const alignedMin = new Date(targetDate);
                alignedMin.setHours(-1, 0, 0, 0); // Previous day 23:00

                const alignedMax = new Date(targetDate);
                alignedMax.setDate(alignedMax.getDate() + 1);
                alignedMax.setHours(1, 0, 0, 0); // Next day 01:00

                // Apply aligned range using zoomScale (doesn't lock the view)
                const alignedMinTime = alignedMin.getTime();
                const alignedMaxTime = alignedMax.getTime();

                // Only align if the difference is significant (more than 30 minutes off)
                if (Math.abs(currentMin - alignedMinTime) > 30 * 60 * 1000 ||
                  Math.abs(currentMax - alignedMaxTime) > 30 * 60 * 1000) {
                  chart.zoomScale('x', { min: alignedMinTime, max: alignedMaxTime }, 'none');
                }
              }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit, yAxisLabel, peaksAndValleys]);

  // Update chart annotations when showAnnotations changes without resetting zoom
  React.useEffect(() => {
    if (chartRef.current && chartRef.current.options) {
      // Rebuild annotations based on current showAnnotations state
      const annotations = {};

      peaksAndValleys.peaks.forEach((peak, index) => {
        const timestamp = new Date(peak.timestamp);

        annotations[`peakPoint${index}`] = {
          type: 'point',
          xValue: timestamp,
          yValue: peak.value,
          backgroundColor: 'rgba(255, 99, 132, 0.8)',
          borderColor: 'rgb(255, 99, 132)',
          borderWidth: 2,
          radius: 5
        };

        if (showAnnotations) {
          const hour = timestamp.getHours();
          const timeLabel = hour === 0 ? '12 a.m.' :
            hour < 12 ? `${hour} a.m.` :
              hour === 12 ? '12 p.m.' :
                `${hour - 12} p.m.`;

          annotations[`peak${index}`] = {
            type: 'label',
            xValue: timestamp,
            yValue: peak.value,
            yAdjust: -25,
            backgroundColor: 'rgba(255, 99, 132, 0.9)',
            borderColor: 'rgb(255, 99, 132)',
            borderWidth: 2,
            borderRadius: 4,
            color: 'white',
            content: [`${timeLabel}`, `${peak.value.toFixed(0)} ${unit}`],
            font: {
              size: 10,
              weight: 'bold'
            },
            padding: 6
          };
        }
      });

      peaksAndValleys.valleys.forEach((valley, index) => {
        const timestamp = new Date(valley.timestamp);

        annotations[`valleyPoint${index}`] = {
          type: 'point',
          xValue: timestamp,
          yValue: valley.value,
          backgroundColor: 'rgba(54, 162, 235, 0.8)',
          borderColor: 'rgb(54, 162, 235)',
          borderWidth: 2,
          radius: 5
        };

        if (showAnnotations) {
          const hour = timestamp.getHours();
          const timeLabel = hour === 0 ? '12 a.m.' :
            hour < 12 ? `${hour} a.m.` :
              hour === 12 ? '12 p.m.' :
                `${hour - 12} p.m.`;

          annotations[`valley${index}`] = {
            type: 'label',
            xValue: timestamp,
            yValue: valley.value,
            yAdjust: 25,
            backgroundColor: 'rgba(54, 162, 235, 0.9)',
            borderColor: 'rgb(54, 162, 235)',
            borderWidth: 2,
            borderRadius: 4,
            color: 'white',
            content: [`${timeLabel}`, `${valley.value.toFixed(0)} ${unit}`],
            font: {
              size: 10,
              weight: 'bold'
            },
            padding: 6
          };
        }
      });

      // Update annotations without recreating the chart
      chartRef.current.options.plugins.annotation.annotations = annotations;
      chartRef.current.update('none');
    }
  }, [showAnnotations, peaksAndValleys, unit]);

  // Zoom control handlers
  const handleZoomIn = () => {
    if (chartRef.current) {
      chartRef.current.zoom(1.2);
    }
  };

  const handleZoomOut = () => {
    if (chartRef.current) {
      chartRef.current.zoom(0.8);
    }
  };

  const handleResetZoom = () => {
    if (chartRef.current) {
      chartRef.current.resetZoom();
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
      <Box sx={{ height: 400 }}>
        <Line ref={chartRef} data={chartData} options={options} />
      </Box>

      {/* Day Navigation Buttons - Below Chart */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        mt: 2,
        gap: 2
      }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<ArrowBackIcon />}
          onClick={handlePreviousDay}
        >
          Previous Day
        </Button>
        <Button
          variant="outlined"
          size="small"
          endIcon={<ArrowForwardIcon />}
          onClick={handleNextDay}
        >
          Next Day
        </Button>
      </Box>
    </Paper>
  );
};

export default OverallTrendChart;
