// Custom Entry Form Component - Handles user input for custom calculations
import { Box, Typography, TextField, Button, Select, MenuItem, FormControl } from '@mui/material';

const CustomEntryForm = ({ 
  customEntries, 
  onUpdateEntry, 
  onAddEntry,
  availableYears,
  getAvailableMonths 
}) => {
  return (
    <Box sx={{ p: 3, bgcolor: '#F9F9F9', borderRadius: 1, mb: 3 }}>
      {/* Header Row */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Typography variant="body2" sx={{ minWidth: 120, fontWeight: 600 }}>Year</Typography>
        <Typography variant="body2" sx={{ minWidth: 150, fontWeight: 600 }}>Month</Typography>
        <Typography variant="body2" sx={{ flex: 1, fontWeight: 600 }}>Electricity usage</Typography>
        <Box sx={{ width: 80 }}></Box>
      </Box>

      {/* Input Rows */}
      {customEntries.map((entry, index) => (
        <Box key={entry.id} sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={entry.year}
              onChange={(e) => onUpdateEntry(entry.id, 'year', e.target.value)}
              sx={{ bgcolor: 'white' }}
            >
              {availableYears.map(year => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={entry.month}
              onChange={(e) => onUpdateEntry(entry.id, 'month', e.target.value)}
              sx={{ bgcolor: 'white' }}
            >
              {getAvailableMonths(entry.year).map(month => (
                <MenuItem key={month} value={month}>{month}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            size="small"
            type="number"
            value={entry.usage}
            onChange={(e) => onUpdateEntry(entry.id, 'usage', e.target.value)}
            placeholder="0000"
            InputProps={{
              endAdornment: <Typography variant="body2" sx={{ color: '#999' }}>kWh</Typography>,
              sx: { 
                bgcolor: 'white',
                // Hide number input arrows
                '& input[type=number]': {
                  MozAppearance: 'textfield'
                },
                '& input[type=number]::-webkit-outer-spin-button': {
                  WebkitAppearance: 'none',
                  margin: 0
                },
                '& input[type=number]::-webkit-inner-spin-button': {
                  WebkitAppearance: 'none',
                  margin: 0
                }
              }
            }}
            sx={{ flex: 1 }}
          />

          <Button
            variant="contained"
            onClick={onAddEntry}
            disabled={index !== customEntries.length - 1}
            sx={{
              bgcolor: '#1976D2',
              color: 'white',
              minWidth: 80,
              textTransform: 'none',
              '&:hover': { bgcolor: '#1565C0' },
              '&:disabled': { bgcolor: '#E0E0E0', color: '#999' }
            }}
          >
            Add
          </Button>
        </Box>
      ))}
    </Box>
  );
};

export default CustomEntryForm;
