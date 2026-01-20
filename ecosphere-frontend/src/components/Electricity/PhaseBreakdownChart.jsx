// Phase Breakdown Chart Component - Stacked bar chart for three-phase power
import { useMemo } from 'react';
import { Box, Paper, Typography, Alert } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { CHART_COLORS, PHASE_LABELS } from '../../lib/constants/electricity';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const PhaseBreakdownChart = ({ data, loading }) => {
  // Aggregate hourly data to daily data
  const aggregatedData = useMemo(() => {
    if (!data || !data.data) {
      return null;
    }

    const { phaseA, phaseB, phaseC } = data.data;

    if (!phaseA || phaseA.length === 0) {
      return null;
    }

    // Group data by date
    const dailyData = {};

    // Process Phase A
    phaseA.forEach(item => {
      const date = item.ts.split(' ')[0]; // Extract date part (YYYY-MM-DD)
      if (!dailyData[date]) {
        dailyData[date] = { phaseA: 0, phaseB: 0, phaseC: 0 };
      }
      dailyData[date].phaseA += Math.abs(item.value);
    });

    // Process Phase B
    phaseB.forEach(item => {
      const date = item.ts.split(' ')[0];
      if (!dailyData[date]) {
        dailyData[date] = { phaseA: 0, phaseB: 0, phaseC: 0 };
      }
      dailyData[date].phaseB += Math.abs(item.value);
    });

    // Process Phase C
    phaseC.forEach(item => {
      const date = item.ts.split(' ')[0];
      if (!dailyData[date]) {
        dailyData[date] = { phaseA: 0, phaseB: 0, phaseC: 0 };
      }
      dailyData[date].phaseC += Math.abs(item.value);
    });

    // Convert to arrays sorted by date
    const dates = Object.keys(dailyData).sort();

    return {
      dates: dates,
      phaseA: dates.map(date => dailyData[date].phaseA),
      phaseB: dates.map(date => dailyData[date].phaseB),
      phaseC: dates.map(date => dailyData[date].phaseC)
    };
  }, [data]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!aggregatedData) {
      return null;
    }

    return {
      labels: aggregatedData.dates,
      datasets: [
        {
          label: PHASE_LABELS.phaseA,
          data: aggregatedData.phaseA,
          backgroundColor: CHART_COLORS.PHASE_A + '80',
          borderColor: CHART_COLORS.PHASE_A,
          borderWidth: 1
        },
        {
          label: PHASE_LABELS.phaseB,
          data: aggregatedData.phaseB,
          backgroundColor: CHART_COLORS.PHASE_B + '80',
          borderColor: CHART_COLORS.PHASE_B,
          borderWidth: 1
        },
        {
          label: PHASE_LABELS.phaseC,
          data: aggregatedData.phaseC,
          backgroundColor: CHART_COLORS.PHASE_C + '80',
          borderColor: CHART_COLORS.PHASE_C,
          borderWidth: 1
        }
      ]
    };
  }, [aggregatedData]);

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
      },
      title: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toLocaleString() + ' Wh';
            }
            return label;
          },
          footer: function (tooltipItems) {
            let sum = 0;
            tooltipItems.forEach(function (tooltipItem) {
              sum += tooltipItem.parsed.y;
            });
            return 'Total: ' + sum.toLocaleString() + ' Wh';
          }
        }
      }
    },
    scales: {
      x: {
        stacked: true,
        title: {
          display: true,
          text: 'Date'
        }
      },
      y: {
        stacked: true,
        beginAtZero: true,
        title: {
          display: true,
          text: 'Energy (Wh)'
        },
        ticks: {
          callback: function (value) {
            return value.toLocaleString() + ' Wh';
          }
        }
      }
    }
  }), []);

  if (loading) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Electricity Consumption Trend by Phase (Daily)
        </Typography>
        <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography color="text.secondary">
            Loading phase data...
          </Typography>
        </Box>
      </Paper>
    );
  }

  if (!chartData) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Electricity Consumption Trend by Phase (Daily)
        </Typography>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Phase data is only available from 2020-11-01 to 2020-11-08 (7 days)
        </Alert>
        <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography color="text.secondary">
            No phase data available for selected date range
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Electricity Consumption Trend by Phase (Daily)
      </Typography>
      {data.warning && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {data.warning}
        </Alert>
      )}
      <Box sx={{ height: 400 }}>
        <Bar data={chartData} options={options} />
      </Box>

      {/* Phase Distribution Summary */}
      {data.metrics && (
        <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Phase A Total
            </Typography>
            <Typography variant="body1" sx={{ color: CHART_COLORS.PHASE_A, fontWeight: 'bold' }}>
              {Math.abs(data.metrics.phaseA.total).toFixed(2)} Wh
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Phase B Total
            </Typography>
            <Typography variant="body1" sx={{ color: CHART_COLORS.PHASE_B, fontWeight: 'bold' }}>
              {Math.abs(data.metrics.phaseB.total).toFixed(2)} Wh
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Phase C Total
            </Typography>
            <Typography variant="body1" sx={{ color: CHART_COLORS.PHASE_C, fontWeight: 'bold' }}>
              {Math.abs(data.metrics.phaseC.total).toFixed(2)} Wh
            </Typography>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default PhaseBreakdownChart;
