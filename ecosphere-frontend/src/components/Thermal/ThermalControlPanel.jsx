// ThermalControlPanel - Control panel for floor, view mode, and date selection
import { Box, ToggleButton, ToggleButtonGroup, Typography, Button, Alert } from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
  FLOOR_CONFIGS,
  VIEW_MODES,
  VIEW_MODE_LABELS,
  DATE_CONFIG
} from '../../lib/constants/thermal';

/**
 * Control panel component for thermal dashboard
 * Handles floor selection, view mode toggle, and date selection
 */
const ThermalControlPanel = ({
  // Floor props
  selectedFloor,
  onFloorChange,

  // View mode props
  viewMode,
  onViewModeChange,

  // Date props
  selectedDate,
  dateFrom,
  dateTo,
  onDateChange,
  onDateFromChange,
  onDateToChange,
  shouldDisableDate,

  // Multiple days props
  onGenerateChart,
  dateRangeError,
  loading
}) => {
  return (
    <Box sx={{ mb: 3, p: 2, bgcolor: 'white', borderRadius: 1, boxShadow: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 3, flexWrap: 'wrap' }}>
        {/* Floor Selection */}
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Floor
          </Typography>
          <ToggleButtonGroup
            value={selectedFloor}
            exclusive
            onChange={onFloorChange}
            aria-label="floor selection"
            size="small"
          >
            <ToggleButton value="basement" aria-label="basement">
              {FLOOR_CONFIGS.basement.displayName}
            </ToggleButton>
            <ToggleButton value="level1" aria-label="level 1">
              {FLOOR_CONFIGS.level1.displayName}
            </ToggleButton>
            <ToggleButton value="level2" aria-label="level 2">
              {FLOOR_CONFIGS.level2.displayName}
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* View Mode Toggle */}
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            View Mode
          </Typography>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={onViewModeChange}
            aria-label="view mode"
            size="small"
          >
            <ToggleButton value={VIEW_MODES.SINGLE} aria-label="single day">
              {VIEW_MODE_LABELS[VIEW_MODES.SINGLE]}
            </ToggleButton>
            <ToggleButton value={VIEW_MODES.MULTIPLE} aria-label="multiple days">
              {VIEW_MODE_LABELS[VIEW_MODES.MULTIPLE]}
            </ToggleButton>
            <ToggleButton value={VIEW_MODES.FORECAST} aria-label="forecast">
              {VIEW_MODE_LABELS[VIEW_MODES.FORECAST]}
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Date Picker(s) */}
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          {viewMode === VIEW_MODES.SINGLE ? (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Select Date
              </Typography>
              <DatePicker
                value={selectedDate}
                onChange={onDateChange}
                shouldDisableDate={shouldDisableDate}
                slotProps={{
                  textField: {
                    size: 'small',
                    sx: { width: 200 }
                  }
                }}
              />
            </Box>
          ) : viewMode === VIEW_MODES.MULTIPLE ? (
            <>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  From Date
                </Typography>
                <DatePicker
                  value={dateFrom}
                  onChange={onDateFromChange}
                  shouldDisableDate={shouldDisableDate}
                  maxDate={dateTo || undefined}
                  slotProps={{
                    textField: {
                      size: 'small',
                      sx: { width: 180 }
                    }
                  }}
                />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  To Date
                </Typography>
                <DatePicker
                  value={dateTo}
                  onChange={onDateToChange}
                  shouldDisableDate={shouldDisableDate}
                  minDate={dateFrom || undefined}
                  slotProps={{
                    textField: {
                      size: 'small',
                      sx: { width: 180 }
                    }
                  }}
                />
              </Box>
              <Box>
                <Button
                  variant="contained"
                  startIcon={<TrendingUpIcon />}
                  onClick={onGenerateChart}
                  disabled={loading}
                  sx={{ height: 40 }}
                >
                  Generate
                </Button>
              </Box>
            </>
          ) : viewMode === VIEW_MODES.FORECAST ? (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Target Date
              </Typography>
              <DatePicker
                value={selectedDate}
                onChange={onDateChange}
                shouldDisableDate={shouldDisableDate}
                slotProps={{
                  textField: {
                    size: 'small',
                    sx: { width: 200 }
                  }
                }}
              />
            </Box>
          ) : null}
        </LocalizationProvider>
      </Box>

      {/* Date Range Error */}
      {dateRangeError && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          {dateRangeError}
        </Alert>
      )}

      {/* Info Text */}
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
        {viewMode === VIEW_MODES.SINGLE
          ? 'View 15-minute interval data for a single day'
          : viewMode === VIEW_MODES.MULTIPLE
            ? `View daily data for up to ${DATE_CONFIG.MAX_DATE_RANGE_DAYS} days`
            : 'Predict future indoor temperature based on historical patterns and weather forecast'}
      </Typography>
    </Box>
  );
};

export default ThermalControlPanel;
