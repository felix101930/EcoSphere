// ThermalChartSection - Chart display section for thermal dashboard
import { Box, Typography } from '@mui/material';
import ThermalTrendChart from './ThermalTrendChart';
import ThermalCandlestickChart from './ThermalCandlestickChart';
import { VIEW_MODES, UI_CONFIG } from '../../lib/constants/thermal';

/**
 * Chart section component that displays appropriate chart based on view mode
 * Shows ThermalTrendChart for single day or ThermalCandlestickChart for multiple days
 */
const ThermalChartSection = ({
  viewMode,
  dailyData,
  aggregatedData,
  outdoorTemperature,
  onTimeClick,
  onDateClick
}) => {
  if (viewMode === VIEW_MODES.SINGLE) {
    return (
      <ThermalTrendChart
        data={dailyData}
        outdoorTemperature={outdoorTemperature}
        onTimeClick={onTimeClick}
      />
    );
  }

  // Multiple Days mode
  if (Object.keys(aggregatedData).length > 0) {
    return (
      <ThermalCandlestickChart
        data={aggregatedData}
        outdoorTemperature={outdoorTemperature}
        onDateClick={onDateClick}
      />
    );
  }

  // No data state for multiple days
  return (
    <Box sx={{
      p: 4,
      bgcolor: 'white',
      borderRadius: 1,
      boxShadow: 1,
      textAlign: 'center',
      mb: 3
    }}>
      <Typography variant="body1" color="text.secondary">
        {UI_CONFIG.ERROR_MESSAGES.NO_DATA}
      </Typography>
    </Box>
  );
};

export default ThermalChartSection;
