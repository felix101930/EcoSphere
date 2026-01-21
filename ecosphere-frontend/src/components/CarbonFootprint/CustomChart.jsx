// Custom Chart Component - Displays the custom calculation chart
import { Box, Typography } from '@mui/material';
import { Line } from 'react-chartjs-2';
import { dualAxisChartOptions } from '../../utils/chartOptions';

const CustomChart = ({ chartData }) => {
  if (!chartData) return null;

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom sx={{ color: '#666' }}>
        Carbon Footprint (kg CO₂e) & Electricity Consumption (kWh)
      </Typography>
      <Box sx={{ height: 400, mt: 2 }}>
        <Line data={chartData} options={dualAxisChartOptions} />
      </Box>
    </Box>
  );
};

export default CustomChart;
