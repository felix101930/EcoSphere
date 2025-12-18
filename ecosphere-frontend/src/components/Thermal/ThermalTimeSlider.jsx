// Thermal Time Slider - Control time navigation
import { Box, Slider, IconButton, Typography } from '@mui/material';
import { 
  PlayArrow as PlayIcon, 
  Pause as PauseIcon,
  SkipPrevious as PrevIcon,
  SkipNext as NextIcon
} from '@mui/icons-material';
import { useState, useEffect } from 'react';

const ThermalTimeSlider = ({ currentIndex, maxIndex, onIndexChange, currentTime }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      onIndexChange((prev) => {
        if (prev >= maxIndex) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 500); // Move forward every 0.5 seconds

    return () => clearInterval(interval);
  }, [isPlaying, maxIndex, onIndexChange]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handlePrevious = () => {
    setIsPlaying(false);
    onIndexChange((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setIsPlaying(false);
    onIndexChange((prev) => Math.min(maxIndex, prev + 1));
  };

  const handleSliderChange = (event, newValue) => {
    setIsPlaying(false);
    onIndexChange(newValue);
  };

  // Generate time marks
  const marks = [
    { value: 0, label: '00:00' },
    { value: 24, label: '06:00' },
    { value: 48, label: '12:00' },
    { value: 72, label: '18:00' },
    { value: 95, label: '23:45' }
  ];

  return (
    <Box sx={{ mb: 3, p: 2, bgcolor: 'white', borderRadius: 1, boxShadow: 1 }}>
      <Typography variant="h6" gutterBottom>
        ⏱️ Time Control
      </Typography>
      
      {/* Control buttons */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <IconButton 
          onClick={handlePrevious} 
          disabled={currentIndex === 0}
          sx={{ 
            bgcolor: '#f5f5f5',
            '&:hover': { bgcolor: '#e0e0e0' }
          }}
        >
          <PrevIcon />
        </IconButton>
        
        <IconButton 
          onClick={handlePlayPause}
          sx={{ 
            bgcolor: isPlaying ? '#DA291C' : '#4CAF50',
            color: 'white',
            '&:hover': { 
              bgcolor: isPlaying ? '#A6192E' : '#45a049'
            }
          }}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </IconButton>
        
        <IconButton 
          onClick={handleNext}
          disabled={currentIndex === maxIndex}
          sx={{ 
            bgcolor: '#f5f5f5',
            '&:hover': { bgcolor: '#e0e0e0' }
          }}
        >
          <NextIcon />
        </IconButton>

        <Typography variant="body1" sx={{ ml: 2, fontWeight: 'bold' }}>
          Current Time: {currentTime}
        </Typography>
      </Box>

      {/* Time slider */}
      <Box sx={{ px: 2 }}>
        <Slider
          value={currentIndex}
          min={0}
          max={maxIndex}
          step={1}
          marks={marks}
          onChange={handleSliderChange}
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => {
            const hours = Math.floor(value / 4);
            const minutes = (value % 4) * 15;
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
          }}
          sx={{
            '& .MuiSlider-thumb': {
              width: 20,
              height: 20,
              bgcolor: '#DA291C',
              '&:hover': {
                boxShadow: '0 0 0 8px rgba(218, 41, 28, 0.16)'
              }
            },
            '& .MuiSlider-track': {
              bgcolor: '#DA291C',
              border: 'none'
            },
            '& .MuiSlider-rail': {
              bgcolor: '#e0e0e0'
            },
            '& .MuiSlider-mark': {
              bgcolor: '#bfbfbf',
              height: 8,
              width: 2
            },
            '& .MuiSlider-markLabel': {
              fontSize: '0.75rem'
            }
          }}
        />
      </Box>
    </Box>
  );
};

export default ThermalTimeSlider;
