// Solar Source Breakdown Chart - Pie chart for solar generation by source
import { useMemo } from 'react';
import { Card, CardContent, Typography, Box, CircularProgress, Alert } from '@mui/material';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { SOLAR_SOURCE_LABELS } from '../../lib/constants/electricity';

// Register ChartJS components (WITHOUT datalabels - we'll use it locally)
ChartJS.register(ArcElement, Tooltip, Legend);

const SolarSourceBreakdownChart = ({ data, loading }) => {
  const chartData = useMemo(() => {
    if (!data || !data.data) {
      return null;
    }

    const { carport, rooftop } = data.data;

    if (!carport || !rooftop) {
      return null;
    }

    // Calculate total generation for each source
    const carportTotal = carport.reduce((sum, item) => sum + Math.abs(item.value), 0);
    const rooftopTotal = rooftop.reduce((sum, item) => sum + Math.abs(item.value), 0);

    return {
      labels: [SOLAR_SOURCE_LABELS.carport, SOLAR_SOURCE_LABELS.rooftop],
      datasets: [{
        data: [carportTotal, rooftopTotal],
        backgroundColor: [
          '#DA291C',  // SAIT Red - Carport
          '#005EB8'   // SAIT Blue - Rooftop
        ],
        borderColor: '#ffffff',
        borderWidth: 2
      }]
    };
  }, [data]);

  const chartOptions = useMemo(() => ({
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
            return `${label}: ${value.toFixed(2)} W (${percentage}%)`;
          }
        }
      },
      datalabels: {
        color: '#fff',
        font: {
          weight: 'bold',
          size: 14
        },
        formatter: (value, context) => {
          const total = context.dataset.data.reduce((a, b) => a + b, 0);
          const percentage = ((value / total) * 100).toFixed(1);
          const valueInW = value.toFixed(0);
          return `${percentage}%\n${valueInW} W`;
        }
      }
    }
  }), []);

  if (loading) {
    return (
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!chartData) {
    return (
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Alert severity="info">No solar source data available for the selected date range</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Electricity Generation by Source
        </Typography>
        {data.warning && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {data.warning}
          </Alert>
        )}
        <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Pie data={chartData} options={chartOptions} plugins={[ChartDataLabels]} />
        </Box>
      </CardContent>
    </Card>
  );
};

export default SolarSourceBreakdownChart;
