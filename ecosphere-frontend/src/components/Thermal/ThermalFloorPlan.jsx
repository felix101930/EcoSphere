// Thermal Floor Plan - Display floor plan with temperature overlays
import { Box, Typography } from '@mui/material';
import basementPlan from '../../assets/floorplan/basement.png';
import level1Plan from '../../assets/floorplan/level1.png';
import ThermalService from '../../services/ThermalService';

const ThermalFloorPlan = ({ currentData, floor = 'basement' }) => {
  // Floor configurations
  const floorConfigs = {
    basement: {
      name: 'Basement',
      image: basementPlan,
      sensorIds: ['20004', '20005', '20006'],
      positions: {
        '20004': { top: '18%', right: '8%', width: '180px', height: '100px' },
        '20005': { top: '48%', left: '12%', width: '280px', height: '180px' },
        '20006': { top: '52%', right: '20%', width: '240px', height: '140px' }
      }
    },
    level1: {
      name: 'Level 1',
      image: level1Plan,
      sensorIds: ['20007', '20008', '20009', '20010', '20011'],
      positions: {
        '20007': { top: '42%', left: '8%', width: '200px', height: '120px' },
        '20008': { top: '68%', left: '8%', width: '200px', height: '120px' },
        '20009': { top: '68%', left: '42%', width: '200px', height: '120px' },
        '20010': { top: '30%', right: '8%', width: '200px', height: '120px' },
        '20011': { top: '12%', left: '42%', width: '200px', height: '120px' }
      }
    }
  };

  const currentFloor = floorConfigs[floor];
  const sensorPositions = currentFloor.positions;

  const renderSensorBox = (sensorId, temp, position) => {
    const color = ThermalService.getColorByTemp(temp);
    const displayTemp = ThermalService.formatTemperature(temp);

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
          {sensorId}
        </Typography>
        <Typography 
          variant="h4" 
          fontWeight="bold" 
          sx={{ 
            color: '#fff',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
          }}
        >
          {displayTemp}°C
        </Typography>
      </Box>
    );
  };

  return (
    <Box sx={{ mb: 3, p: 2, bgcolor: 'white', borderRadius: 1, boxShadow: 1 }}>
      <Typography variant="h5" gutterBottom>
        🏢 {currentFloor.name} Floor Plan
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Temperature distribution across {currentFloor.name.toLowerCase()} sensors
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
          src={currentFloor.image} 
          alt={`${currentFloor.name} Floor Plan`}
          style={{ 
            width: '100%', 
            height: 'auto', 
            display: 'block',
            borderRadius: '4px'
          }}
        />
        
        {/* Temperature overlay boxes */}
        {currentFloor.sensorIds.map(sensorId => {
          const temp = currentData[`${sensorId}_TL2`] || null;
          return renderSensorBox(sensorId, temp, sensorPositions[sensorId]);
        })}
      </Box>

      {/* Color legend */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 20, height: 20, bgcolor: '#0066FF', border: '1px solid #333' }} />
          <Typography variant="caption">&lt; 20°C</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 20, height: 20, bgcolor: '#00CCFF', border: '1px solid #333' }} />
          <Typography variant="caption">20-22°C</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 20, height: 20, bgcolor: '#00FF00', border: '1px solid #333' }} />
          <Typography variant="caption">22-23°C</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 20, height: 20, bgcolor: '#FFFF00', border: '1px solid #333' }} />
          <Typography variant="caption">23-24°C</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 20, height: 20, bgcolor: '#FF9900', border: '1px solid #333' }} />
          <Typography variant="caption">24-25°C</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 20, height: 20, bgcolor: '#FF3300', border: '1px solid #333' }} />
          <Typography variant="caption">&gt; 25°C</Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default ThermalFloorPlan;
