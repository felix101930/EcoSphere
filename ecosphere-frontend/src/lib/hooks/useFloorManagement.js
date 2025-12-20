// useFloorManagement - Custom hook for managing floor selection and switching
import { useCallback } from 'react';
import { FLOOR_CONFIGS, VIEW_MODES } from '../constants/thermal';

/**
 * Custom hook for managing floor selection and data reloading
 */
export const useFloorManagement = (
  selectedFloor,
  setSelectedFloor,
  viewMode,
  selectedDate,
  dateFrom,
  dateTo,
  loadSingleDayData,
  loadMultipleDaysData,
  resetTimeIndex
) => {
  // Handle floor change
  const handleFloorChange = useCallback(async (_event, newFloor) => {
    if (newFloor !== null && newFloor !== selectedFloor) {
      setSelectedFloor(newFloor);
      
      const newSensorIds = FLOOR_CONFIGS[newFloor].sensorIds;
      
      // Reload data for new floor based on view mode
      if (viewMode === VIEW_MODES.SINGLE && selectedDate) {
        // Single Day mode - reload current date with new floor sensors
        try {
          await loadSingleDayData(selectedDate, newSensorIds);
          resetTimeIndex();
        } catch (err) {
          console.error('Error loading floor data:', err);
        }
      } else if (viewMode === VIEW_MODES.MULTIPLE && dateFrom && dateTo) {
        // Multiple Days mode - reload date range with new floor sensors
        try {
          await loadMultipleDaysData(dateFrom, dateTo, newSensorIds);
          resetTimeIndex();
        } catch (err) {
          console.error('Error loading floor data:', err);
        }
      }
    }
  }, [
    selectedFloor,
    setSelectedFloor,
    viewMode,
    selectedDate,
    dateFrom,
    dateTo,
    loadSingleDayData,
    loadMultipleDaysData,
    resetTimeIndex
  ]);

  return {
    handleFloorChange
  };
};
