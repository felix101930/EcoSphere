// Overall Trend Chart Component - Line chart for consumption/generation/net energy
import { useMemo, useState } from 'react';
import { Box, Paper, Typography, FormControlLabel, Switch } from '@mui/material';
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
  annotationPlugin
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
  }, [unit, yAxisLabel, peaksAndValleys, showAnnotations]);

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
      <Box sx={{ height: 400 }}>
        <Line data={chartData} options={options} />
      </Box>
    </Paper>
  );
};

export default OverallTrendChart;
