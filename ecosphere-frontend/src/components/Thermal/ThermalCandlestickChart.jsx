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
  // Define colors for sensors (SAIT colors + additional colors)
  const sensorColors = {
    '20004_TL2': { rgb: '218, 41, 28', name: 'Sensor 20004' },      // Red
    '20005_TL2': { rgb: '0, 94, 184', name: 'Sensor 20005' },       // Blue
    '20006_TL2': { rgb: '109, 32, 119', name: 'Sensor 20006' },     // Purple
    '20007_TL2': { rgb: '0, 166, 81', name: 'Sensor 20007' },       // Green
    '20008_TL2': { rgb: '255, 105, 0', name: 'Sensor 20008' },      // Orange
    '20009_TL2': { rgb: '255, 193, 7', name: 'Sensor 20009' },      // Yellow
    '20010_TL2': { rgb: '156, 39, 176', name: 'Sensor 20010' },     // Magenta
    '20011_TL2': { rgb: '0, 188, 212', name: 'Sensor 20011' },      // Cyan
    '20012_TL2': { rgb: '233, 30, 99', name: 'Sensor 20012' },      // Pink
    '20013_TL2': { rgb: '103, 58, 183', name: 'Sensor 20013' },     // Deep Purple
    '20014_TL2': { rgb: '63, 81, 181', name: 'Sensor 20014' },      // Indigo
    '20015_TL2': { rgb: '0, 150, 136', name: 'Sensor 20015' },      // Teal
    '20016_TL2': { rgb: '205, 220, 57', name: 'Sensor 20016' }      // Lime
  };

  // Extract dates and prepare chart data
  const dates = Object.keys(data).sort();
  
  // Get available sensor IDs from first date
  const availableSensorIds = dates.length > 0 ? Object.keys(data[dates[0]]) : [];
  
  // Create datasets dynamically for each sensor
  const datasets = [];
  
  availableSensorIds.forEach(sensorId => {
    const colorInfo = sensorColors[sensorId] || { rgb: '128, 128, 128', name: `Sensor ${sensorId}` };
    const rgb = colorInfo.rgb;
    
    // Low boundary (draw first)
    datasets.push({
      label: `${colorInfo.name} Low`,
      data: dates.map(date => data[date][sensorId]?.low || null),
      borderColor: `rgba(${rgb}, 0.3)`,
      backgroundColor: `rgba(${rgb}, 0)`,
      borderWidth: 1,
      borderDash: [2, 2],
      pointRadius: 0,
      pointHoverRadius: 0,
      tension: 0.3,
      fill: false,
      order: 3
    });
    
    // High boundary (fill down to Low)
    datasets.push({
      label: `${colorInfo.name} High`,
      data: dates.map(date => data[date][sensorId]?.high || null),
      borderColor: `rgba(${rgb}, 0.3)`,
      backgroundColor: `rgba(${rgb}, 0.15)`,
      borderWidth: 1,
      borderDash: [2, 2],
      pointRadius: 0,
      pointHoverRadius: 0,
      tension: 0.3,
      fill: '-1', // Fill to previous dataset (Low)
      order: 3
    });
    
    // Average line
    datasets.push({
      label: `${colorInfo.name} Avg`,
      data: dates.map(date => data[date][sensorId]?.avg || null),
      borderColor: `rgb(${rgb})`,
      backgroundColor: `rgb(${rgb})`,
      borderWidth: 2.5,
      pointRadius: 4,
      pointHoverRadius: 6,
      tension: 0.3,
      fill: false,
      order: 1
    });
  });

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
    onClick: (_event, elements) => {
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
        onClick: function(_e, legendItem, legend) {
          const chart = legend.chart;
          const clickedLabel = legendItem.text; // e.g., "Sensor 20004 Avg"
          
          // Extract sensor identifier from label
          const match = clickedLabel.match(/Sensor (\d+)/);
          if (!match) return;
          
          const sensorNumber = match[1];
          
          // Get the current visibility state of the Avg line (the clicked item)
          const avgDatasetIndex = chart.data.datasets.findIndex(ds => ds.label === clickedLabel);
          const avgMeta = chart.getDatasetMeta(avgDatasetIndex);
          const newHiddenState = avgMeta.hidden === null ? true : null;
          
          // Apply the same state to all datasets of this sensor
          chart.data.datasets.forEach((dataset, index) => {
            if (dataset.label.includes(`Sensor ${sensorNumber}`)) {
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
            
            // Only show tooltip for Average lines
            if (datasetLabel.includes('Avg')) {
              const sensorName = datasetLabel.replace(' Avg', '');
              const dateIndex = context.dataIndex;
              const date = dates[dateIndex];
              
              // Extract sensor ID from label
              const match = sensorName.match(/Sensor (\d+)/);
              if (!match) return null;
              
              const sensorId = `${match[1]}_TL2`;
              const sensorData = data[date][sensorId];
              
              if (!sensorData) return null;
              
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
