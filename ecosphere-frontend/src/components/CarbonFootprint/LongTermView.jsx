// Long-term View Component - Display 12 months data
import { Box, Typography } from '@mui/material';
import { Line } from 'react-chartjs-2';

const LongTermView = ({ data, chartData, chartOptions, totalEnergy, carbonFootprint }) => {
  return (
    <Box sx={{ mb: 3, p: 2, bgcolor: 'white', borderRadius: 1, boxShadow: 1 }}>
      <Typography variant="h5" gutterBottom>
        Long-term View (Last 12 Months)
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Records: {data.length} | 
        Total Energy: {totalEnergy.toFixed(2)} kWh | 
        Carbon Footprint: {carbonFootprint.toFixed(2)} kg CO2
      </Typography>
      <Box sx={{ height: 300, mt: 2 }}>
        {data.length > 0 ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <Typography variant="body2" color="text.secondary">No data available</Typography>
        )}
      </Box>
    </Box>
  );
};

export default LongTermView;
