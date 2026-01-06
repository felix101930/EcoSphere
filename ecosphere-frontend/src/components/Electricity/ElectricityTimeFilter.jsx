// Electricity Time Filter Component
import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { TIME_PRESETS } from '../../lib/constants/electricity';

const ElectricityTimeFilter = ({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onApply,
  dateRange,
  loading
}) => {
  const [preset, setPreset] = useState(TIME_PRESETS.LAST_7_DAYS);

  // Update preset when dates change from outside (e.g., initial load)
  useEffect(() => {
    if (dateFrom && dateTo && dateRange) {
      const maxDateStr = dateRange.consumption.maxDate;
      const maxDate = new Date(maxDateStr + 'T12:00:00');

      // Check if dates match a preset
      const daysDiff = Math.round((dateTo - dateFrom) / (1000 * 60 * 60 * 24));
      const isMaxDate = dateTo.toDateString() === maxDate.toDateString();

      if (isMaxDate) {
        if (daysDiff === 7) {
          setPreset(TIME_PRESETS.LAST_7_DAYS);
        } else if (daysDiff === 30) {
          setPreset(TIME_PRESETS.LAST_30_DAYS);
        } else if (daysDiff >= 89 && daysDiff <= 92) { // ~3 months
          setPreset(TIME_PRESETS.LAST_3_MONTHS);
        } else {
          setPreset(TIME_PRESETS.CUSTOM);
        }
      } else {
        setPreset(TIME_PRESETS.CUSTOM);
      }
    }
  }, [dateFrom, dateTo, dateRange]);

  // Handle preset change
  const handlePresetChange = (_event, newPreset) => {
    if (newPreset === null) return;

    setPreset(newPreset);

    if (!dateRange) return;

    // Use date strings with noon time to avoid timezone shifts
    const maxDateStr = dateRange.consumption.maxDate; // e.g., "2020-11-08"
    const maxDate = new Date(maxDateStr + 'T12:00:00');
    let fromDate = new Date(maxDate);

    switch (newPreset) {
      case TIME_PRESETS.LAST_7_DAYS:
        fromDate.setDate(fromDate.getDate() - 7);
        break;
      case TIME_PRESETS.LAST_30_DAYS:
        fromDate.setDate(fromDate.getDate() - 30);
        break;
      case TIME_PRESETS.LAST_3_MONTHS:
        fromDate.setMonth(fromDate.getMonth() - 3);
        break;
      case TIME_PRESETS.CUSTOM:
        // Keep current dates
        return;
      default:
        break;
    }

    // Ensure fromDate is not before minDate
    const minDateStr = dateRange.consumption.minDate;
    const minDate = new Date(minDateStr + 'T12:00:00');
    if (fromDate < minDate) {
      fromDate = minDate;
    }

    onDateFromChange(fromDate);
    onDateToChange(maxDate);
  };

  // Should disable dates outside available range
  const shouldDisableDate = (date) => {
    if (!dateRange) return false;

    // Add noon time to avoid timezone shifts when comparing
    const minDateStr = dateRange.consumption.minDate;
    const maxDateStr = dateRange.consumption.maxDate;
    const minDate = new Date(minDateStr + 'T12:00:00');
    const maxDate = new Date(maxDateStr + 'T12:00:00');

    return date < minDate || date > maxDate;
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Time Range
      </Typography>

      {/* Preset Buttons */}
      <Box sx={{ mb: 3 }}>
        <ToggleButtonGroup
          value={preset}
          exclusive
          onChange={handlePresetChange}
          size="small"
          sx={{ flexWrap: 'wrap' }}
        >
          <ToggleButton value={TIME_PRESETS.LAST_7_DAYS}>
            Last 7 Days
          </ToggleButton>
          <ToggleButton value={TIME_PRESETS.LAST_30_DAYS}>
            Last 30 Days
          </ToggleButton>
          <ToggleButton value={TIME_PRESETS.LAST_3_MONTHS}>
            Last 3 Months
          </ToggleButton>
          <ToggleButton value={TIME_PRESETS.CUSTOM}>
            Custom
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Date Pickers */}
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <DatePicker
            label="From Date"
            value={dateFrom}
            onChange={(newValue) => {
              onDateFromChange(newValue);
              setPreset(TIME_PRESETS.CUSTOM);
            }}
            shouldDisableDate={shouldDisableDate}
            format="yyyy-MM-dd"
            slotProps={{
              textField: {
                size: 'small',
                sx: { minWidth: 200 },
                placeholder: 'Select start date'
              }
            }}
          />

          <Typography>to</Typography>

          <DatePicker
            label="To Date"
            value={dateTo}
            onChange={(newValue) => {
              onDateToChange(newValue);
              setPreset(TIME_PRESETS.CUSTOM);
            }}
            shouldDisableDate={shouldDisableDate}
            format="yyyy-MM-dd"
            slotProps={{
              textField: {
                size: 'small',
                sx: { minWidth: 200 },
                placeholder: 'Select end date'
              }
            }}
          />

          <Button
            variant="contained"
            onClick={onApply}
            disabled={!dateFrom || !dateTo || loading}
          >
            Apply
          </Button>
        </Box>
      </LocalizationProvider>

      {/* Current Selection Display */}
      {dateFrom && dateTo && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Selected Range:</strong> {dateFrom.toLocaleDateString()} to {dateTo.toLocaleDateString()}
            {' '}({Math.round((dateTo - dateFrom) / (1000 * 60 * 60 * 24))} days)
          </Typography>
        </Box>
      )}

      {/* Available Range Info */}
      {dateRange && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Available Range: {dateRange.consumption.minDate} to {dateRange.consumption.maxDate}
        </Alert>
      )}
    </Paper>
  );
};

export default ElectricityTimeFilter;
