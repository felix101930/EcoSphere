// Thermal Time Slider - Control time navigation
import { Box, Slider, IconButton, Typography } from '@mui/material';
import { 
  PlayArrow as PlayIcon, 
  Pause as PauseIcon,
  SkipPrevious as PrevIcon,
  SkipNext as NextIcon
} from '@mui/icons-material';
import { useState, useEffect } from 'react';

const ThermalTimeSlider = ({ currentIndex, maxIndex, onIndexChange, currentTime, mode = 'single', dateList = [] }) => {
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
    }, mode === 'single' ? 500 : 900); // 900ms for multiple days (15 min real-time equivalent)

    return () => clearInterval(interval);
  }, [isPlaying, maxIndex, onIndexChange, mode]);

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

  // Generate marks based on mode
  const generateMarks = () => {
    if (mode === 'single') {
      return [
        { value: 0, label: '00:00' },
        { value: 24, label: '06:00' },
        { value: 48, label: '12:00' },
        { value: 72, label: '18:00' },
        { value: 95, label: '23:45' }
      ];
    } else {
      // For multiple days mode, show actual dates
      if (dateList.length === 0) return [];
      
      const marks = [];
      const step = Math.max(1, Math.floor(maxIndex / 5));
      
      for (let i = 0; i <= maxIndex; i += step) {
        const date = new Date(dateList[i] + 'T00:00:00');
        const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        marks.push({ value: i, label });
      }
      
      // Always add the last date if not already included
      if (marks[marks.length - 1].value !== maxIndex) {
        const date = new Date(dateList[maxIndex] + 'T00:00:00');
        const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        marks.push({ value: maxIndex, label });
      }
      
      return marks;
    }
  };

  const marks = generateMarks();

  return (
    <Box sx={{ mb: 3, p: 2, bgcolor: 'white', borderRadius: 1, boxShadow: 1 }}>
      <Typography variant="h6" gutterBottom>
        {mode === 'single' ? '⏱️ Time Control' : '📅 Date Control'}
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
          {mode === 'single' ? `Time: ${currentTime}` : `Date: ${currentTime}`}
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
            if (mode === 'single') {
              const hours = Math.floor(value / 4);
              const minutes = (value % 4) * 15;
              return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            } else {
              // Show actual date in tooltip
              if (dateList.length > 0 && dateList[value]) {
                const date = new Date(dateList[value] + 'T00:00:00');
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              }
              return `Day ${value + 1}`;
            }
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
