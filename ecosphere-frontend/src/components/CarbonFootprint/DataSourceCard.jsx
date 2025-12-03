// Data Source Card Component - Display API status information
import { Box, Typography } from '@mui/material';

const DataSourceCard = ({ carbonIntensity }) => {
  return (
    <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
      <Typography variant="h6" gutterBottom>
        📊 Data Source
      </Typography>
      <Typography variant="body2">
        • Electricity Maps API
      </Typography>
      <Typography variant="body2">
        • Location: Alberta, Calgary
      </Typography>
      <Typography variant="body2">
        • Current Intensity: {carbonIntensity?.carbonIntensity || 'N/A'} g CO2/kWh
      </Typography>
      <Typography variant="body2">
        • Last Updated: {carbonIntensity?.fetchedAt ? new Date(carbonIntensity.fetchedAt).toLocaleTimeString() : 'N/A'}
      </Typography>
      <Typography variant="body2">
        • Status: {carbonIntensity?.isFallback ? '⚠️ Using Fallback' : '✅ Live Data'}
      </Typography>
    </Box>
  );
};

export default DataSourceCard;
