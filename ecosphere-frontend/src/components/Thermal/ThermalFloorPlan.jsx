// Thermal Floor Plan - Display floor plan with temperature overlays
import { Box, Typography } from '@mui/material';
import basementPlan from '../../assets/floorplan/basement.png';
import level1Plan from '../../assets/floorplan/level1.png';
import level2Plan from '../../assets/floorplan/level2.png';
import ThermalService from '../../services/ThermalService';
import { FLOOR_CONFIGS, SENSOR_POSITIONS, TEMPERATURE_CONFIG, getSensorDisplayName } from '../../lib/constants/thermal';

const ThermalFloorPlan = ({ currentData, floor = 'basement', outdoorTemperatureHourly = [], currentTimeIndex = 0, sensorsDateRange = {}, sensorIds = [] }) => {
  // Debug logging
  console.log('[ThermalFloorPlan] Props:', {
    floor,
    sensorIds,
    sensorsDateRangeKeys: Object.keys(sensorsDateRange),
    sensorsDateRange
  });

  // Floor image mapping
  const floorImages = {
    basement: basementPlan,
    level1: level1Plan,
    level2: level2Plan
  };

  // Get current floor configuration
  const currentFloor = FLOOR_CONFIGS[floor];
  const sensorPositions = SENSOR_POSITIONS[floor];
  const floorImage = floorImages[floor];

  // Get current outdoor temperature based on time index
  // Hourly data has 24 entries per day, 15-min data has 96 entries per day
  // Map 96 intervals to 24 hours: hourIndex = floor(timeIndex / 4)
  const hourIndex = Math.floor(currentTimeIndex / 4);
  const currentOutdoorTemp = outdoorTemperatureHourly[hourIndex]?.temperature || null;

  const renderSensorBox = (sensorId, temp, position) => {
    const color = ThermalService.getColorByTemp(temp);
    const displayTemp = ThermalService.formatTemperature(temp);
    const displayName = getSensorDisplayName(sensorId);

    return (
      <Box
        key={sensorId}
        sx={{
          position: 'absolute',
          ...position,
          bgcolor: color,
          border: '3px solid #333',
          borderRadius: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          opacity: 0.85,
          transition: 'background-color 0.3s ease',
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
          '&:hover': {
            opacity: 0.95,
            boxShadow: '0 6px 12px rgba(0,0,0,0.4)'
          }
        }}
      >
        <Typography
          variant="h6"
          fontWeight="bold"
          sx={{
            color: '#fff',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
          }}
        >
          {displayName}
        </Typography>
        <Typography
          variant="h4"
          fontWeight="bold"
          sx={{
            color: '#fff',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
          }}
        >
          {displayTemp}{TEMPERATURE_CONFIG.UNIT}
        </Typography>
      </Box>
    );
  };

  return (
    <Box sx={{ mb: 3, p: 2, bgcolor: 'white', borderRadius: 1, boxShadow: 1 }}>
      <Typography variant="h5" gutterBottom>
        🏢 {currentFloor.displayName} Floor Plan
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Temperature distribution across {currentFloor.displayName.toLowerCase()} sensors
      </Typography>

      {/* Floor plan container */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          maxWidth: 1200,
          margin: '0 auto',
          mt: 2
        }}
      >
        {/* Background floor plan image */}
        <img
          src={floorImage}
          alt={`${currentFloor.displayName} Floor Plan`}
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            borderRadius: '4px'
          }}
        />

        {/* Temperature overlay boxes */}
        {currentFloor.sensorIds.map(sensorId => {
          const sensorNumber = sensorId.replace('_TL2', '');
          const temp = currentData[sensorId] || null;
          return renderSensorBox(sensorNumber, temp, sensorPositions[sensorNumber]);
        })}

        {/* Outdoor temperature box (bottom left corner) */}
        {currentOutdoorTemp !== null && (
          <Box
            sx={{
              position: 'absolute',
              bottom: '2%',
              left: '2%',
              width: '180px',
              height: '100px',
              bgcolor: ThermalService.getColorByTemp(currentOutdoorTemp),
              border: '3px solid #333',
              borderRadius: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              opacity: 0.85,
              transition: 'background-color 0.3s ease',
              boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
              '&:hover': {
                opacity: 0.95,
                boxShadow: '0 6px 12px rgba(0,0,0,0.4)'
              }
            }}
          >
            <Typography
              variant="h6"
              fontWeight="bold"
              sx={{
                color: '#fff',
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
              }}
            >
              🌡️ Outdoor
            </Typography>
            <Typography
              variant="h4"
              fontWeight="bold"
              sx={{
                color: '#fff',
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
              }}
            >
              {ThermalService.formatTemperature(currentOutdoorTemp)}{TEMPERATURE_CONFIG.UNIT}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Color legend */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
        {TEMPERATURE_CONFIG.RANGES.map((range, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 20, bgcolor: range.color, border: '1px solid #333' }} />
            <Typography variant="caption">{range.label}</Typography>
          </Box>
        ))}
      </Box>

      {/* Sensor data availability information */}
      {Object.keys(sensorsDateRange).length > 0 && (
        <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
            📊 Sensor Data Availability
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {sensorIds.map(sensorId => {
              const sensorNumber = sensorId.replace('_TL2', '');
              const displayName = getSensorDisplayName(sensorNumber);
              const dateRange = sensorsDateRange[sensorId];

              if (!dateRange || !dateRange.minDate || !dateRange.maxDate) {
                return (
                  <Typography key={sensorId} variant="caption" color="text.secondary">
                    • {displayName}: No data available
                  </Typography>
                );
              }

              return (
                <Typography key={sensorId} variant="caption" color="text.secondary">
                  • {displayName}: {dateRange.minDate} to {dateRange.maxDate}
                </Typography>
              );
            })}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ThermalFloorPlan;
