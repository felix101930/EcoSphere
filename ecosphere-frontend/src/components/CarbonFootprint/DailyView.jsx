// Daily View Component - Display daily data with date range selector
import { Box, Typography, TextField, Button, CircularProgress } from '@mui/material';
import { Line } from 'react-chartjs-2';

const DailyView = ({ 
  data, 
  chartData, 
  chartOptions, 
  totalEnergy, 
  carbonFootprint,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onGenerate,
  loading,
  maxDate
}) => {
  return (
    <Box sx={{ mb: 3, p: 2, bgcolor: 'white', borderRadius: 1, boxShadow: 1 }}>
      <Typography variant="h5" gutterBottom>
        Daily View
      </Typography>
      
      {/* Date Range Selector */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2, 
        mb: 2,
        p: 2,
        bgcolor: '#F5F5F5',
        borderRadius: 1
      }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            From
          </Typography>
          <TextField
            type="date"
            value={fromDate}
            onChange={(e) => onFromDateChange(e.target.value)}
            size="small"
            fullWidth
            inputProps={{ max: maxDate }}
            slotProps={{
              input: {
                sx: {
                  bgcolor: 'white',
                  fontFamily: 'DM Sans, sans-serif'
                }
              }
            }}
          />
        </Box>
        
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            To
          </Typography>
          <TextField
            type="date"
            value={toDate}
            onChange={(e) => onToDateChange(e.target.value)}
            size="small"
            fullWidth
            inputProps={{ max: maxDate }}
            slotProps={{
              input: {
                sx: {
                  bgcolor: 'white',
                  fontFamily: 'DM Sans, sans-serif'
                }
              }
            }}
          />
        </Box>
        
        <Box sx={{ alignSelf: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={onGenerate}
            disabled={loading}
            sx={{
              bgcolor: '#DA291C',
              color: 'white',
              px: 4,
              py: 1,
              fontFamily: 'Titillium Web, sans-serif',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': {
                bgcolor: '#A6192E'
              },
              '&:disabled': {
                bgcolor: '#CCC',
                color: '#666'
              }
            }}
          >
            {loading ? 'Generating...' : 'Generate'}
          </Button>
        </Box>
      </Box>
      
      {/* Loading State */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300, mt: 2 }}>
          <CircularProgress sx={{ color: '#DA291C' }} />
        </Box>
      ) : (
        <>
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
        </>
      )}
    </Box>
  );
};

export default DailyView;
