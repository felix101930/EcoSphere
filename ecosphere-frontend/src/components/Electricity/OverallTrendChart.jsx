// Overall Trend Chart Component - Line chart for consumption/generation/net energy
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
  TimeScale
);

const OverallTrendChart = ({ data, title, dataLabel, color = CHART_COLORS.PRIMARY }) => {
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
          data: data.map(d => Math.abs(d.value)),
          borderColor: color,
          backgroundColor: color + '20',
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.1
        }
      ]
    };
  }, [data, dataLabel, color]);

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
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(2) + ' Wh';
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
          text: 'Energy (Wh)'
        },
        ticks: {
          callback: function(value) {
            return value.toLocaleString() + ' Wh';
          }
        }
      }
    }
  }), []);

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
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Box sx={{ height: 400 }}>
        <Line data={chartData} options={options} />
      </Box>
    </Paper>
  );
};

export default OverallTrendChart;
