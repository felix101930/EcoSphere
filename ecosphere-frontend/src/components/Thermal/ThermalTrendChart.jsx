// Thermal Trend Chart - Display temperature trends for multiple sensors
import { Box, Typography } from '@mui/material';
import { Line } from 'react-chartjs-2';
import ThermalService from '../../services/ThermalService';

const ThermalTrendChart = ({ data, onTimeClick }) => {
  // Define colors for sensors (SAIT colors + additional colors)
  const sensorColors = {
    '20004_TL2': { border: 'rgb(218, 41, 28)', bg: 'rgba(218, 41, 28, 0.1)' },      // Red
    '20005_TL2': { border: 'rgb(0, 94, 184)', bg: 'rgba(0, 94, 184, 0.1)' },        // Blue
    '20006_TL2': { border: 'rgb(109, 32, 119)', bg: 'rgba(109, 32, 119, 0.1)' },    // Purple
    '20007_TL2': { border: 'rgb(0, 166, 81)', bg: 'rgba(0, 166, 81, 0.1)' },        // Green
    '20008_TL2': { border: 'rgb(255, 105, 0)', bg: 'rgba(255, 105, 0, 0.1)' },      // Orange
    '20009_TL2': { border: 'rgb(255, 193, 7)', bg: 'rgba(255, 193, 7, 0.1)' },      // Yellow
    '20010_TL2': { border: 'rgb(156, 39, 176)', bg: 'rgba(156, 39, 176, 0.1)' },    // Magenta
    '20011_TL2': { border: 'rgb(0, 188, 212)', bg: 'rgba(0, 188, 212, 0.1)' }       // Cyan
  };

  // Get available sensor IDs from data
  const availableSensorIds = Object.keys(data).filter(key => data[key] && data[key].length > 0);
  
  // Get labels from first available sensor
  const firstSensorId = availableSensorIds[0];
  const labels = firstSensorId ? data[firstSensorId].map(record => ThermalService.parseTime(record.ts)) : [];

  // Create datasets dynamically
  const datasets = availableSensorIds.map(sensorId => {
    const sensorNumber = sensorId.replace('_TL2', '');
    const colors = sensorColors[sensorId] || { border: 'rgb(128, 128, 128)', bg: 'rgba(128, 128, 128, 0.1)' };
    
    return {
      label: `${sensorNumber} Temperature`,
      data: data[sensorId].map(record => record.value),
      borderColor: colors.border,
      backgroundColor: colors.bg,
      tension: 0.4,
      pointRadius: 2,
      pointHoverRadius: 5
    };
  });

  // Prepare chart data
  const chartData = {
    labels,
    datasets
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (event, elements) => {
      if (elements.length > 0 && onTimeClick) {
        const index = elements[0].index;
        onTimeClick(index);
      }
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}°C`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: 'Temperature (°C)'
        },
        ticks: {
          callback: function(value) {
            return value.toFixed(1) + '°C';
          }
        }
      },
      x: {
        title: {
          display: true,
          text: 'Time'
        },
        ticks: {
          maxTicksLimit: 12,
          autoSkip: true
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  const recordCount = firstSensorId ? data[firstSensorId].length : 0;

  return (
    <Box sx={{ mb: 3, p: 2, bgcolor: 'white', borderRadius: 1, boxShadow: 1 }}>
      <Typography variant="h5" gutterBottom>
        📈 Temperature Trend (15-Min Overview)
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Records: {recordCount} | Click on the chart to jump to that time
      </Typography>
      <Box sx={{ height: 350, mt: 2 }}>
        {recordCount > 0 ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <Typography variant="body2" color="text.secondary">
            No data available for selected date
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default ThermalTrendChart;
