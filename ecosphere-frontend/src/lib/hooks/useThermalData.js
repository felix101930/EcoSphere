// useThermalData - Custom hook for managing thermal data loading
import { useState, useEffect, useCallback } from 'react';
import ThermalService from '../../services/ThermalService';
import { FLOOR_CONFIGS, DATE_CONFIG, UI_CONFIG } from '../constants/thermal';

/**
 * Custom hook for managing thermal data loading and state
 * Handles both single day and multiple days data loading
 */
export const useThermalData = (selectedFloor) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dailyData, setDailyData] = useState({});
  const [aggregatedData, setAggregatedData] = useState({});
  const [multipleDaysDetailData, setMultipleDaysDetailData] = useState({});

  // Get sensor IDs for current floor
  const sensorIds = FLOOR_CONFIGS[selectedFloor].sensorIds;

  // Load initial data on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get available dates first
        const dates = await ThermalService.getAvailableDates();
        setAvailableDates(dates);

        if (dates.length === 0) {
          throw new Error('No available dates found');
        }

        // Use the last available date as default (add noon time to avoid timezone shifts)
        const lastDateStr = dates[dates.length - 1];

        // Create date object with noon time to avoid timezone issues
        const dateObj = new Date(lastDateStr + 'T12:00:00');
        setSelectedDate(dateObj);

        // Load data for that date using initial floor
        const initialSensorIds = FLOOR_CONFIGS[selectedFloor].sensorIds;
        const data = await ThermalService.getMultipleSensorsDailyData(lastDateStr, initialSensorIds);
        setDailyData(data);

        setLoading(false);
      } catch (err) {
        console.error('Error loading initial data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount - floor changes handled by loadSingleDayData/loadMultipleDaysData

  // Load single day data
  const loadSingleDayData = useCallback(async (date, floorSensorIds) => {
    try {
      setLoading(true);
      setError(null);

      // Format date as YYYY-MM-DD (timezone-safe)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      // Load data
      const data = await ThermalService.getMultipleSensorsDailyData(dateStr, floorSensorIds);
      setDailyData(data);
      setSelectedDate(date);

      setLoading(false);
      return data;
    } catch (err) {
      console.error('Error loading single day data:', err);
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  // Load multiple days data (aggregated + detailed)
  const loadMultipleDaysData = useCallback(async (dateFrom, dateTo, floorSensorIds) => {
    try {
      setLoading(true);
      setError(null);

      // Format dates as YYYY-MM-DD (timezone-safe)
      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const dateFromStr = formatDate(dateFrom);
      const dateToStr = formatDate(dateTo);

      // Load aggregated data for chart
      const aggData = await ThermalService.getAggregatedData(dateFromStr, dateToStr, floorSensorIds);
      setAggregatedData(aggData);

      // Load detailed 15-min data for all days in range
      const dates = Object.keys(aggData).sort();
      const detailDataPromises = dates.map(date =>
        ThermalService.getMultipleSensorsDailyData(date, floorSensorIds)
      );
      const detailDataResults = await Promise.all(detailDataPromises);

      // Organize by date
      const detailDataByDate = {};
      dates.forEach((date, index) => {
        detailDataByDate[date] = detailDataResults[index];
      });

      setMultipleDaysDetailData(detailDataByDate);

      setLoading(false);
      return { aggData, detailDataByDate };
    } catch (err) {
      console.error('Error loading multiple days data:', err);
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  // Validate date range
  const validateDateRange = useCallback((dateFrom, dateTo) => {
    if (!dateFrom || !dateTo) {
      return UI_CONFIG.ERROR_MESSAGES.NO_DATES;
    }

    const daysDiff = Math.ceil((dateTo - dateFrom) / (1000 * 60 * 60 * 24));

    if (daysDiff < 0) {
      return UI_CONFIG.ERROR_MESSAGES.INVALID_RANGE;
    }

    if (daysDiff > DATE_CONFIG.MAX_DATE_RANGE_DAYS) {
      return UI_CONFIG.ERROR_MESSAGES.RANGE_TOO_LARGE;
    }

    return null; // No error
  }, []);

  // Clear multiple days data
  const clearMultipleDaysData = useCallback(() => {
    setAggregatedData({});
    setMultipleDaysDetailData({});
  }, []);

  // Clear single day data
  const clearSingleDayData = useCallback(() => {
    setDailyData({});
  }, []);

  return {
    // State
    loading,
    error,
    availableDates,
    selectedDate,
    dailyData,
    aggregatedData,
    multipleDaysDetailData,
    sensorIds,

    // Actions
    loadSingleDayData,
    loadMultipleDaysData,
    validateDateRange,
    clearMultipleDaysData,
    clearSingleDayData,
    setSelectedDate,
    setError
  };
};
