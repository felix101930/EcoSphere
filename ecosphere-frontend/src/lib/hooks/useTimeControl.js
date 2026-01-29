// useTimeControl - Custom hook for managing time control state
import { useState, useMemo, useCallback } from 'react';
import ThermalService from '../../services/ThermalService';
import { DEFAULTS } from '../constants/thermal';

/**
 * Custom hook for managing time control state and calculations
 * Handles both single day and multiple days time navigation
 */
export const useTimeControl = (viewMode, dailyData, multipleDaysDetailData, sensorIds) => {
  const [currentTimeIndex, setCurrentTimeIndex] = useState(DEFAULTS.TIME_INDEX);
  const [currentDateIndex, setCurrentDateIndex] = useState(DEFAULTS.DATE_INDEX);

  // Calculate max time index for single day mode
  const maxTimeIndex = useMemo(() => {
    if (!sensorIds[0] || !dailyData[sensorIds[0]]) return 0;
    return dailyData[sensorIds[0]].length - 1;
  }, [dailyData, sensorIds]);

  // Calculate max time index for multiple days mode (all 15-min intervals)
  const maxMultipleDaysTimeIndex = useMemo(() => {
    if (Object.keys(multipleDaysDetailData).length === 0) return 0;

    let totalPoints = 0;
    const dates = Object.keys(multipleDaysDetailData).sort();

    dates.forEach(date => {
      const dateData = multipleDaysDetailData[date];
      if (dateData && dateData[sensorIds[0]]) {
        totalPoints += dateData[sensorIds[0]].length;
      }
    });

    return Math.max(0, totalPoints - 1);
  }, [multipleDaysDetailData, sensorIds]);

  // Get current data for the selected time index
  const getCurrentData = useCallback(() => {
    if (viewMode === 'single') {
      const currentData = {};
      sensorIds.forEach(sensorId => {
        const sensorData = dailyData[sensorId];
        if (sensorData && sensorData[currentTimeIndex]) {
          currentData[sensorId] = sensorData[currentTimeIndex].value;
        } else {
          currentData[sensorId] = null;
        }
      });
      return currentData;
    } else {
      // Multiple Days mode - show temperature for current time point
      if (Object.keys(multipleDaysDetailData).length > 0) {
        const allTimePoints = [];
        const dates = Object.keys(multipleDaysDetailData).sort();

        // Flatten all time points from all dates
        dates.forEach(date => {
          const dateData = multipleDaysDetailData[date];
          if (dateData && dateData[sensorIds[0]]) {
            dateData[sensorIds[0]].forEach((record, idx) => {
              allTimePoints.push({ date, timeIndex: idx });
            });
          }
        });

        if (allTimePoints[currentTimeIndex]) {
          const { date, timeIndex } = allTimePoints[currentTimeIndex];
          const currentData = {};
          sensorIds.forEach(sensorId => {
            const dateData = multipleDaysDetailData[date];
            if (dateData && dateData[sensorId] && dateData[sensorId][timeIndex]) {
              currentData[sensorId] = dateData[sensorId][timeIndex].value;
            } else {
              currentData[sensorId] = null;
            }
          });

          return currentData;
        }
      }

      return {};
    }
  }, [viewMode, dailyData, multipleDaysDetailData, sensorIds, currentTimeIndex]);

  // Get current time string
  const getCurrentTime = useCallback(() => {
    if (viewMode === 'single') {
      const firstSensorId = sensorIds[0];
      const sensorData = dailyData[firstSensorId];
      if (sensorData && sensorData[currentTimeIndex]) {
        return ThermalService.parseTime(sensorData[currentTimeIndex].ts);
      }
      return '00:00';
    } else {
      // Multiple Days mode - show date and time
      if (Object.keys(multipleDaysDetailData).length > 0) {
        const allTimePoints = [];
        const dates = Object.keys(multipleDaysDetailData).sort();

        // Flatten all time points from all dates
        dates.forEach(date => {
          const dateData = multipleDaysDetailData[date];
          if (dateData && dateData[sensorIds[0]]) {
            dateData[sensorIds[0]].forEach((record) => {
              allTimePoints.push({ date, ts: record.ts });
            });
          }
        });

        if (allTimePoints[currentTimeIndex]) {
          const { date, ts } = allTimePoints[currentTimeIndex];
          const dateObj = new Date(date + 'T00:00:00');
          const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const timeStr = ThermalService.parseTime(ts);
          return `${dateStr} ${timeStr}`;
        }
      }
      return '';
    }
  }, [viewMode, dailyData, multipleDaysDetailData, sensorIds, currentTimeIndex]);

  // Handle time click from chart
  const handleTimeClick = useCallback((index) => {
    setCurrentTimeIndex(index);
  }, []);

  // Handle date click from chart (Multiple Days mode)
  const handleDateClick = useCallback((index) => {
    setCurrentDateIndex(index);

    // Calculate the time index for the start of the clicked date
    if (Object.keys(multipleDaysDetailData).length > 0) {
      const dates = Object.keys(multipleDaysDetailData).sort();
      let cumulativeIndex = 0;

      for (let i = 0; i < index && i < dates.length; i++) {
        const dateData = multipleDaysDetailData[dates[i]];
        if (dateData && dateData[sensorIds[0]]) {
          cumulativeIndex += dateData[sensorIds[0]].length;
        }
      }

      setCurrentTimeIndex(cumulativeIndex);
    }
  }, [multipleDaysDetailData, sensorIds]);

  // Reset time index
  const resetTimeIndex = useCallback(() => {
    setCurrentTimeIndex(DEFAULTS.TIME_INDEX);
    setCurrentDateIndex(DEFAULTS.DATE_INDEX);
  }, []);

  return {
    // State
    currentTimeIndex,
    currentDateIndex,
    maxTimeIndex,
    maxMultipleDaysTimeIndex,

    // Computed values
    currentData: getCurrentData(),
    currentTime: getCurrentTime(),

    // Actions
    setCurrentTimeIndex,
    setCurrentDateIndex,
    handleTimeClick,
    handleDateClick,
    resetTimeIndex
  };
};
