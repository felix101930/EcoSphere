// Thermal Trend Chart - Display temperature trends for multiple sensors
import { Box, Typography } from '@mui/material';
import { Line } from 'react-chartjs-2';
import ThermalService from '../../services/ThermalService';

const ThermalTrendChart = ({ data, onTimeClick }) => {
  // Prepare chart data
  const chartData = {
    labels: data['20004_TL2']?.map(record => ThermalService.parseTime(record.ts)) || [],
    datasets: [
      {
        label: '20004 Temperature',
        data: data['20004_TL2']?.map(record => record.value) || [],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5
      },
      {
        label: '20005 Temperature',
        data: data['20005_TL2']?.map(record => record.value) || [],
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5
      },
      {
        label: '20006 Temperature',
        data: data['20006_TL2']?.map(record => record.value) || [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5
      }
    ]
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

  const recordCount = data['20004_TL2']?.length || 0;

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
