// Equipment Breakdown Chart Component - Pie chart for equipment consumption
import { useMemo } from 'react';
import { Box, Paper, Typography, Alert } from '@mui/material';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { EQUIPMENT_LABELS } from '../../lib/constants/electricity';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

const EquipmentBreakdownChart = ({ data, loading }) => {
  // Prepare chart data
  const chartData = useMemo(() => {
    if (!data || !data.metrics) {
      return null;
    }

    const { metrics } = data;

    // Calculate totals for each equipment
    const equipmentData = [
      { label: EQUIPMENT_LABELS.panel2A1, value: Math.abs(metrics.panel2A1?.total || 0) },
      { label: EQUIPMENT_LABELS.ventilation, value: Math.abs(metrics.ventilation?.total || 0) },
      { label: EQUIPMENT_LABELS.lighting, value: Math.abs(metrics.lighting?.total || 0) },
      { label: EQUIPMENT_LABELS.equipment, value: Math.abs(metrics.equipment?.total || 0) },
      { label: EQUIPMENT_LABELS.appliances, value: Math.abs(metrics.appliances?.total || 0) }
    ].filter(item => item.value > 0);

    if (equipmentData.length === 0) {
      return null;
    }

    return {
      labels: equipmentData.map(item => item.label),
      datasets: [
        {
          data: equipmentData.map(item => item.value),
          backgroundColor: [
            '#DA291C',  // SAIT Red
            '#005EB8',  // SAIT Blue
            '#FF9800',  // Orange
            '#4CAF50',  // Green
            '#9C27B0'   // Purple
          ],
          borderColor: '#ffffff',
          borderWidth: 2
        }
      ]
    };
  }, [data]);

  // Chart options
  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'right',
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value.toFixed(2)} Wh (${percentage}%)`;
          }
        }
      }
    }
  }), []);

  if (loading) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Electricity Consumption Trend by Equipment
        </Typography>
        <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography color="text.secondary">
            Loading equipment data...
          </Typography>
        </Box>
      </Paper>
    );
  }

  if (!chartData) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Electricity Consumption Trend by Equipment
        </Typography>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Equipment data has different time ranges for different categories
        </Alert>
        <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography color="text.secondary">
            No equipment data available for selected date range
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Electricity Consumption Trend by Equipment
      </Typography>
      {data.warning && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {data.warning}
        </Alert>
      )}
      <Box sx={{ height: 400, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Box sx={{ width: '100%', maxWidth: 500 }}>
          <Pie data={chartData} options={options} />
        </Box>
      </Box>
    </Paper>
  );
};

export default EquipmentBreakdownChart;
