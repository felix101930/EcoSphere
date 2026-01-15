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
import { SENSOR_COLORS, getSensorDisplayName } from '../../lib/constants/thermal';

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

const ThermalCandlestickChart = ({ data, outdoorTemperature, onDateClick }) => {
  // Extract dates and prepare chart data
  const dates = Object.keys(data).sort();

  // Get available sensor IDs from first date
  const availableSensorIds = dates.length > 0 ? Object.keys(data[dates[0]]) : [];

  // Calculate average indoor temperature for color determination
  let avgIndoorTemp = null;
  if (dates.length > 0 && availableSensorIds.length > 0) {
    const allAvgs = dates.flatMap(date =>
      availableSensorIds.map(sensorId => data[date][sensorId]?.avg || 0)
    );
    avgIndoorTemp = allAvgs.reduce((sum, temp) => sum + temp, 0) / allAvgs.length;
  }

  // Create datasets dynamically for each sensor
  const datasets = [];

  availableSensorIds.forEach(sensorId => {
    const sensorNumber = sensorId.replace('_TL2', '');
    const colorInfo = SENSOR_COLORS[sensorId];
    const rgb = colorInfo ? colorInfo.rgb : '128, 128, 128';
    const displayName = getSensorDisplayName(sensorNumber);

    // Low boundary (draw first)
    datasets.push({
      label: `${displayName} Low`,
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
      label: `${displayName} High`,
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
      label: `${displayName} Avg`,
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

  // Add outdoor temperature line if available
  if (outdoorTemperature && outdoorTemperature.length > 0) {
    // Create a map for quick lookup
    const outdoorTempMap = {};
    outdoorTemperature.forEach(item => {
      outdoorTempMap[item.date] = {
        avg: item.avg || item.temperature,
        high: item.high,
        low: item.low
      };
    });

    // Calculate average outdoor temperature for color determination
    const avgOutdoorTemp = outdoorTemperature.reduce((sum, item) => sum + (item.avg || item.temperature), 0) / outdoorTemperature.length;

    // Determine color based on comparison with indoor average
    let outdoorColor;
    if (avgIndoorTemp !== null) {
      outdoorColor = avgOutdoorTemp > avgIndoorTemp ? '#F44336' : '#2196F3'; // Red : Blue
    } else {
      outdoorColor = '#FF9800'; // Orange fallback
    }

    // Extract RGB values from hex color for transparency
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };
    const rgb = hexToRgb(outdoorColor);
    const rgbString = rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : '255, 152, 0';

    // Low boundary (draw first)
    datasets.push({
      label: 'Outdoor Temperature Low',
      data: dates.map(date => {
        const temp = outdoorTempMap[date];
        return temp && temp.low !== undefined ? temp.low : null;
      }),
      borderColor: `rgba(${rgbString}, 0.3)`,
      backgroundColor: `rgba(${rgbString}, 0)`,
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
      label: 'Outdoor Temperature High',
      data: dates.map(date => {
        const temp = outdoorTempMap[date];
        return temp && temp.high !== undefined ? temp.high : null;
      }),
      borderColor: `rgba(${rgbString}, 0.3)`,
      backgroundColor: `rgba(${rgbString}, 0.15)`,
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
      label: 'Outdoor Temperature',
      data: dates.map(date => {
        const temp = outdoorTempMap[date];
        return temp ? temp.avg : null;
      }),
      outdoorTempData: outdoorTempMap, // Store full data for tooltip
      borderColor: outdoorColor,
      backgroundColor: outdoorColor,
      borderWidth: 2.5,
      borderDash: [5, 5],
      pointRadius: 4,
      pointHoverRadius: 6,
      tension: 0.3,
      fill: false,
      order: 2
    });
  }

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
          filter: function (item) {
            // Only show Average lines in legend, hide High/Low/Range
            return item.text.includes('Avg') || (item.text === 'Outdoor Temperature');
          }
        },
        onClick: function (_e, legendItem, legend) {
          const chart = legend.chart;
          const clickedLabel = legendItem.text;

          // Handle Outdoor Temperature
          if (clickedLabel === 'Outdoor Temperature') {
            // Get the current visibility state of the Avg line (the clicked item)
            const avgDatasetIndex = chart.data.datasets.findIndex(ds => ds.label === 'Outdoor Temperature');
            const avgMeta = chart.getDatasetMeta(avgDatasetIndex);
            const newHiddenState = avgMeta.hidden === null ? true : null;

            // Apply the same state to all outdoor temperature datasets
            chart.data.datasets.forEach((dataset, index) => {
              if (dataset.label.includes('Outdoor Temperature')) {
                const meta = chart.getDatasetMeta(index);
                meta.hidden = newHiddenState;
              }
            });

            chart.update();
            return;
          }

          // Handle sensor datasets (format: "West 1 (TL20012)")
          const match = clickedLabel.match(/\(TL(\d+)\)/);
          if (!match) return;

          const sensorNumber = match[1];

          // Get the current visibility state of the Avg line (the clicked item)
          const avgDatasetIndex = chart.data.datasets.findIndex(ds => ds.label === clickedLabel);
          const avgMeta = chart.getDatasetMeta(avgDatasetIndex);
          const newHiddenState = avgMeta.hidden === null ? true : null;

          // Apply the same state to all datasets of this sensor
          chart.data.datasets.forEach((dataset, index) => {
            if (dataset.label.includes(`(TL${sensorNumber})`)) {
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
          title: function (context) {
            return context[0].label;
          },
          label: function (context) {
            const datasetLabel = context.dataset.label;
            const dateIndex = context.dataIndex;
            const date = dates[dateIndex];

            // Handle Outdoor Temperature
            if (datasetLabel === 'Outdoor Temperature') {
              const outdoorData = context.dataset.outdoorTempData[date];
              if (outdoorData && outdoorData.high !== undefined && outdoorData.low !== undefined) {
                return [
                  'Outdoor Temperature:',
                  `Avg: ${outdoorData.avg.toFixed(1)}°C`,
                  `High: ${outdoorData.high.toFixed(1)}°C`,
                  `Low: ${outdoorData.low.toFixed(1)}°C`
                ];
              } else {
                // Fallback if high/low not available
                const temp = context.parsed.y;
                return [
                  'Outdoor Temperature:',
                  `Avg: ${temp.toFixed(1)}°C`
                ];
              }
            }

            // Handle sensor Average lines
            if (datasetLabel.includes('Avg')) {
              const sensorName = datasetLabel.replace(' Avg', '');

              // Extract sensor ID from label (format: "West 1 (TL20012)")
              const match = sensorName.match(/\(TL(\d+)\)/);
              if (!match) return null;

              const sensorId = `${match[1]}_TL2`;
              const sensorData = data[date][sensorId];

              if (!sensorData) return null;

              return [
                `${sensorName}:`,
                `Avg: ${sensorData.avg.toFixed(1)}°C`,
                `High: ${sensorData.high.toFixed(1)}°C`,
                `Low: ${sensorData.low.toFixed(1)}°C`
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
          callback: function (value) {
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
        Days: {dates.length} | Shaded area = High-Low range | Line = Average temperature | Hover to see the details
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
