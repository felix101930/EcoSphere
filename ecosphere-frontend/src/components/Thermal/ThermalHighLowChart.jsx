// Thermal High-Low Chart - Display temperature range for multiple days
import { Box, Typography } from '@mui/material';
import { Line } from 'react-chartjs-2';
import ThermalService from '../../services/ThermalService';

const ThermalHighLowChart = ({ data, onDateClick }) => {
  // Extract dates and prepare chart data
  const dates = Object.keys(data).sort();
  
  // Prepare datasets for each sensor
  const datasets = [
    {
      label: '20004 High',
      data: dates.map(date => data[date]['20004_TL2']?.high || null),
      borderColor: 'rgba(255, 99, 132, 0.5)',
      backgroundColor: 'rgba(255, 99, 132, 0.1)',
      borderDash: [5, 5],
      pointRadius: 3,
      pointHoverRadius: 6,
      tension: 0.4
    },
    {
      label: '20004 Avg',
      data: dates.map(date => data[date]['20004_TL2']?.avg || null),
      borderColor: 'rgb(255, 99, 132)',
      backgroundColor: 'rgba(255, 99, 132, 0.2)',
      pointRadius: 4,
      pointHoverRadius: 7,
      tension: 0.4,
      fill: '+1'
    },
    {
      label: '20004 Low',
      data: dates.map(date => data[date]['20004_TL2']?.low || null),
      borderColor: 'rgba(255, 99, 132, 0.5)',
      backgroundColor: 'rgba(255, 99, 132, 0.1)',
      borderDash: [5, 5],
      pointRadius: 3,
      pointHoverRadius: 6,
      tension: 0.4,
      fill: '-1'
    },
    {
      label: '20005 High',
      data: dates.map(date => data[date]['20005_TL2']?.high || null),
      borderColor: 'rgba(54, 162, 235, 0.5)',
      backgroundColor: 'rgba(54, 162, 235, 0.1)',
      borderDash: [5, 5],
      pointRadius: 3,
      pointHoverRadius: 6,
      tension: 0.4
    },
    {
      label: '20005 Avg',
      data: dates.map(date => data[date]['20005_TL2']?.avg || null),
      borderColor: 'rgb(54, 162, 235)',
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      pointRadius: 4,
      pointHoverRadius: 7,
      tension: 0.4,
      fill: '+1'
    },
    {
      label: '20005 Low',
      data: dates.map(date => data[date]['20005_TL2']?.low || null),
      borderColor: 'rgba(54, 162, 235, 0.5)',
      backgroundColor: 'rgba(54, 162, 235, 0.1)',
      borderDash: [5, 5],
      pointRadius: 3,
      pointHoverRadius: 6,
      tension: 0.4,
      fill: '-1'
    },
    {
      label: '20006 High',
      data: dates.map(date => data[date]['20006_TL2']?.high || null),
      borderColor: 'rgba(75, 192, 192, 0.5)',
      backgroundColor: 'rgba(75, 192, 192, 0.1)',
      borderDash: [5, 5],
      pointRadius: 3,
      pointHoverRadius: 6,
      tension: 0.4
    },
    {
      label: '20006 Avg',
      data: dates.map(date => data[date]['20006_TL2']?.avg || null),
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      pointRadius: 4,
      pointHoverRadius: 7,
      tension: 0.4,
      fill: '+1'
    },
    {
      label: '20006 Low',
      data: dates.map(date => data[date]['20006_TL2']?.low || null),
      borderColor: 'rgba(75, 192, 192, 0.5)',
      backgroundColor: 'rgba(75, 192, 192, 0.1)',
      borderDash: [5, 5],
      pointRadius: 3,
      pointHoverRadius: 6,
      tension: 0.4,
      fill: '-1'
    }
  ];

  const chartData = {
    labels: dates.map(date => {
      const d = new Date(date + 'T00:00:00');
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: datasets
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (event, elements) => {
      if (elements.length > 0 && onDateClick) {
        const index = elements[0].index;
        onDateClick(index);
      }
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 10,
          font: {
            size: 10
          },
          filter: function(item) {
            // Only show Avg labels in legend
            return item.text.includes('Avg');
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
          text: 'Date'
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  return (
    <Box sx={{ mb: 3, p: 2, bgcolor: 'white', borderRadius: 1, boxShadow: 1 }}>
      <Typography variant="h5" gutterBottom>
        Temperature Range (High-Low Chart)
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Days: {dates.length} | Showing daily High/Average/Low temperatures | Click to select a day
      </Typography>
      <Box sx={{ height: 350, mt: 2 }}>
        {dates.length > 0 ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <Typography variant="body2" color="text.secondary">
            No data available for selected date range
          </Typography>
        )}
      </Box>
      
      {/* Legend explanation */}
      <Box sx={{ mt: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Solid line = Average temperature | Dashed lines = High/Low range | Shaded area = Temperature variation
        </Typography>
      </Box>
    </Box>
  );
};

export default ThermalHighLowChart;
