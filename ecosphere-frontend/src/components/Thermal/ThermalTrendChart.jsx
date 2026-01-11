// Thermal Trend Chart - Display temperature trends for multiple sensors
import { Box, Typography } from '@mui/material';
import { Line } from 'react-chartjs-2';
import ThermalService from '../../services/ThermalService';
import { SENSOR_COLORS, getSensorColor, getSensorName } from '../../lib/constants/thermal';

const ThermalTrendChart = ({ data, outdoorTemperature, onTimeClick }) => {
  // Get available sensor IDs from data
  const availableSensorIds = Object.keys(data).filter(key => data[key] && data[key].length > 0);

  // Get labels from first available sensor
  const firstSensorId = availableSensorIds[0];
  const labels = firstSensorId ? data[firstSensorId].map(record => ThermalService.parseTime(record.ts)) : [];

  // Calculate average indoor temperature for color determination
  let avgIndoorTemp = null;
  if (availableSensorIds.length > 0 && data[firstSensorId]) {
    const allTemps = availableSensorIds.flatMap(sensorId =>
      data[sensorId].map(record => record.value)
    );
    avgIndoorTemp = allTemps.reduce((sum, temp) => sum + temp, 0) / allTemps.length;
  }

  // Create datasets dynamically
  const datasets = availableSensorIds.map(sensorId => {
    const sensorNumber = sensorId.replace('_TL2', '');
    const rgb = getSensorColor(sensorId, 'rgb');

    return {
      label: `${sensorNumber} Temperature`,
      data: data[sensorId].map(record => record.value),
      borderColor: `rgb(${rgb})`,
      backgroundColor: `rgba(${rgb}, 0.1)`,
      tension: 0.4,
      pointRadius: 2,
      pointHoverRadius: 5,
      yAxisID: 'y'
    };
  });

  // Add outdoor temperature as horizontal line if available
  if (outdoorTemperature && outdoorTemperature.length > 0 && labels.length > 0) {
    const outdoorTemp = outdoorTemperature[0].temperature;

    // Determine color based on comparison with indoor average
    let outdoorColor;
    if (avgIndoorTemp !== null) {
      outdoorColor = outdoorTemp > avgIndoorTemp ? '#F44336' : '#2196F3'; // Red : Blue
    } else {
      outdoorColor = '#FF9800'; // Orange fallback
    }

    datasets.push({
      label: 'Outdoor Temperature',
      data: Array(labels.length).fill(outdoorTemp),
      borderColor: outdoorColor,
      backgroundColor: outdoorColor,
      borderWidth: 2,
      borderDash: [5, 5],
      pointRadius: 0,
      pointHoverRadius: 3,
      tension: 0,
      yAxisID: 'y'
    });
  }

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
          label: function (context) {
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
          callback: function (value) {
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
