// Thermal Range Area Chart - Display temperature range for multiple days
import { Box, Typography } from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend
);

const ThermalCandlestickChart = ({ data, onDateClick }) => {
  // Extract dates and prepare chart data
  const dates = Object.keys(data).sort();
  
  // Prepare datasets for each sensor - High/Low range + Average line
  const datasets = [
    // Sensor 20004 - Low boundary (draw first)
    {
      label: 'Sensor 20004 Low',
      data: dates.map(date => data[date]['20004_TL2']?.low || null),
      borderColor: 'rgba(218, 41, 28, 0.3)',
      backgroundColor: 'rgba(218, 41, 28, 0)',
      borderWidth: 1,
      borderDash: [2, 2],
      pointRadius: 0,
      pointHoverRadius: 0,
      tension: 0.3,
      fill: false,
      order: 3
    },
    // Sensor 20004 - High boundary (fill down to Low)
    {
      label: 'Sensor 20004 High',
      data: dates.map(date => data[date]['20004_TL2']?.high || null),
      borderColor: 'rgba(218, 41, 28, 0.3)',
      backgroundColor: 'rgba(218, 41, 28, 0.15)',
      borderWidth: 1,
      borderDash: [2, 2],
      pointRadius: 0,
      pointHoverRadius: 0,
      tension: 0.3,
      fill: '-1', // Fill to previous dataset (Low)
      order: 3
    },
    // Sensor 20004 - Average line
    {
      label: 'Sensor 20004 Avg',
      data: dates.map(date => data[date]['20004_TL2']?.avg || null),
      borderColor: 'rgb(218, 41, 28)',
      backgroundColor: 'rgb(218, 41, 28)',
      borderWidth: 2.5,
      pointRadius: 4,
      pointHoverRadius: 6,
      tension: 0.3,
      fill: false,
      order: 1
    },
    
    // Sensor 20005 - Low boundary
    {
      label: 'Sensor 20005 Low',
      data: dates.map(date => data[date]['20005_TL2']?.low || null),
      borderColor: 'rgba(0, 94, 184, 0.3)',
      backgroundColor: 'rgba(0, 94, 184, 0)',
      borderWidth: 1,
      borderDash: [2, 2],
      pointRadius: 0,
      pointHoverRadius: 0,
      tension: 0.3,
      fill: false,
      order: 3
    },
    // Sensor 20005 - High boundary
    {
      label: 'Sensor 20005 High',
      data: dates.map(date => data[date]['20005_TL2']?.high || null),
      borderColor: 'rgba(0, 94, 184, 0.3)',
      backgroundColor: 'rgba(0, 94, 184, 0.15)',
      borderWidth: 1,
      borderDash: [2, 2],
      pointRadius: 0,
      pointHoverRadius: 0,
      tension: 0.3,
      fill: '-1',
      order: 3
    },
    // Sensor 20005 - Average line
    {
      label: 'Sensor 20005 Avg',
      data: dates.map(date => data[date]['20005_TL2']?.avg || null),
      borderColor: 'rgb(0, 94, 184)',
      backgroundColor: 'rgb(0, 94, 184)',
      borderWidth: 2.5,
      pointRadius: 4,
      pointHoverRadius: 6,
      tension: 0.3,
      fill: false,
      order: 1
    },
    
    // Sensor 20006 - Low boundary
    {
      label: 'Sensor 20006 Low',
      data: dates.map(date => data[date]['20006_TL2']?.low || null),
      borderColor: 'rgba(109, 32, 119, 0.3)',
      backgroundColor: 'rgba(109, 32, 119, 0)',
      borderWidth: 1,
      borderDash: [2, 2],
      pointRadius: 0,
      pointHoverRadius: 0,
      tension: 0.3,
      fill: false,
      order: 3
    },
    // Sensor 20006 - High boundary
    {
      label: 'Sensor 20006 High',
      data: dates.map(date => data[date]['20006_TL2']?.high || null),
      borderColor: 'rgba(109, 32, 119, 0.3)',
      backgroundColor: 'rgba(109, 32, 119, 0.15)',
      borderWidth: 1,
      borderDash: [2, 2],
      pointRadius: 0,
      pointHoverRadius: 0,
      tension: 0.3,
      fill: '-1',
      order: 3
    },
    // Sensor 20006 - Average line
    {
      label: 'Sensor 20006 Avg',
      data: dates.map(date => data[date]['20006_TL2']?.avg || null),
      borderColor: 'rgb(109, 32, 119)',
      backgroundColor: 'rgb(109, 32, 119)',
      borderWidth: 2.5,
      pointRadius: 4,
      pointHoverRadius: 6,
      tension: 0.3,
      fill: false,
      order: 1
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
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12
          },
          filter: function(item) {
            // Only show Average lines in legend, hide High/Low/Range
            return item.text.includes('Avg');
          }
        },
        onClick: function(e, legendItem, legend) {
          const chart = legend.chart;
          const clickedLabel = legendItem.text; // e.g., "Sensor 20004 Avg"
          
          // Extract sensor identifier (e.g., "20004")
          let sensorId = '';
          if (clickedLabel.includes('20004')) sensorId = '20004';
          else if (clickedLabel.includes('20005')) sensorId = '20005';
          else if (clickedLabel.includes('20006')) sensorId = '20006';
          
          // Get the current visibility state of the Avg line (the clicked item)
          const avgDatasetIndex = chart.data.datasets.findIndex(ds => ds.label === clickedLabel);
          const avgMeta = chart.getDatasetMeta(avgDatasetIndex);
          const newHiddenState = avgMeta.hidden === null ? true : null;
          
          // Apply the same state to all datasets of this sensor
          chart.data.datasets.forEach((dataset, index) => {
            if (dataset.label.includes(sensorId)) {
              const meta = chart.getDatasetMeta(index);
              meta.hidden = newHiddenState;
            }
          });
          
          chart.update();
        }
      },
      title: {
        display: false
      },
      tooltip: {
        callbacks: {
          title: function(context) {
            return context[0].label;
          },
          label: function(context) {
            const datasetLabel = context.dataset.label;
            const value = context.parsed.y;
            
            // Only show tooltip for Average lines
            if (datasetLabel.includes('Avg')) {
              const sensorName = datasetLabel.replace(' Avg', '');
              const dateIndex = context.dataIndex;
              const date = dates[dateIndex];
              const sensorId = sensorName.includes('20004') ? '20004_TL2' : 
                              sensorName.includes('20005') ? '20005_TL2' : '20006_TL2';
              const sensorData = data[date][sensorId];
              
              return [
                `${sensorName}:`,
                `High: ${sensorData.high.toFixed(1)}°C`,
                `Avg: ${sensorData.avg.toFixed(1)}°C`,
                `Low: ${sensorData.low.toFixed(1)}°C`,
                `Open: ${sensorData.open.toFixed(1)}°C`,
                `Close: ${sensorData.close.toFixed(1)}°C`
              ];
            }
            return null;
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
    }
  };

  return (
    <Box sx={{ mb: 3, p: 2, bgcolor: 'white', borderRadius: 1, boxShadow: 1 }}>
      <Typography variant="h5" gutterBottom>
        Temperature Range Chart
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Days: {dates.length} | Shaded area = High-Low range | Line = Average temperature | Click to select a day
      </Typography>
      <Box sx={{ height: 400, mt: 2 }}>
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
          📊 Range Chart: Shaded areas show daily temperature range (High-Low). Solid lines show average temperature. Hover for details.
        </Typography>
      </Box>
    </Box>
  );
};

export default ThermalCandlestickChart;
