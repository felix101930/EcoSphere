// useThermalData - Custom hook for managing thermal data loading
import { useState, useEffect, useCallback } from 'react';
import ThermalService from '../../services/ThermalService';
import WeatherService from '../../services/WeatherService';
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
  const [forecast, setForecast] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastError, setForecastError] = useState(null);
  const [outdoorTemperature, setOutdoorTemperature] = useState([]);
  const [outdoorTemperatureHourly, setOutdoorTemperatureHourly] = useState([]);

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

        // Load thermal data and outdoor temperature in parallel
        const [data, outdoorTemp, outdoorTempHourly] = await Promise.all([
          ThermalService.getMultipleSensorsDailyData(lastDateStr, initialSensorIds),
          WeatherService.getOutdoorTemperature(lastDateStr, lastDateStr).catch(() => []),
          WeatherService.getOutdoorTemperatureHourly(lastDateStr).catch(() => [])
        ]);

        setDailyData(data);
        setOutdoorTemperature(outdoorTemp);
        setOutdoorTemperatureHourly(outdoorTempHourly);

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

      // Load thermal data, daily outdoor temp, and hourly outdoor temp in parallel
      const [data, outdoorTemp, outdoorTempHourly] = await Promise.all([
        ThermalService.getMultipleSensorsDailyData(dateStr, floorSensorIds),
        WeatherService.getOutdoorTemperature(dateStr, dateStr).catch(() => []),
        WeatherService.getOutdoorTemperatureHourly(dateStr).catch(() => [])
      ]);

      setDailyData(data);
      setOutdoorTemperature(outdoorTemp);
      setOutdoorTemperatureHourly(outdoorTempHourly);
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

      // Load aggregated data for chart and outdoor temperature in parallel
      const [aggData, outdoorTemp] = await Promise.all([
        ThermalService.getAggregatedData(dateFromStr, dateToStr, floorSensorIds),
        WeatherService.getOutdoorTemperature(dateFromStr, dateToStr).catch(() => [])
      ]);

      setAggregatedData(aggData);
      setOutdoorTemperature(outdoorTemp);

      // Load detailed 15-min data and hourly outdoor temperature for all days in range
      const dates = Object.keys(aggData).sort();
      const detailDataPromises = dates.map(date =>
        ThermalService.getMultipleSensorsDailyData(date, floorSensorIds)
      );
      const outdoorTempHourlyPromises = dates.map(date =>
        WeatherService.getOutdoorTemperatureHourly(date).catch(() => [])
      );

      const [detailDataResults, outdoorTempHourlyResults] = await Promise.all([
        Promise.all(detailDataPromises),
        Promise.all(outdoorTempHourlyPromises)
      ]);

      // Organize thermal data by date
      const detailDataByDate = {};
      dates.forEach((date, index) => {
        detailDataByDate[date] = detailDataResults[index];
      });

      setMultipleDaysDetailData(detailDataByDate);

      // Combine all hourly outdoor temperature data into a single array
      // Each day has 24 hours, so we concatenate them in order
      const allOutdoorTempHourly = outdoorTempHourlyResults.flat();
      setOutdoorTemperatureHourly(allOutdoorTempHourly);

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

  // Load thermal forecast
  const loadThermalForecast = useCallback(async (floor, targetDate, forecastDays) => {
    try {
      setForecastLoading(true);
      setForecastError(null);

      // Format date as YYYY-MM-DD (timezone-safe)
      const year = targetDate.getFullYear();
      const month = String(targetDate.getMonth() + 1).padStart(2, '0');
      const day = String(targetDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      // Load forecast
      const result = await ThermalService.getThermalForecast(floor, dateStr, forecastDays);
      setForecast(result);

      setForecastLoading(false);
      return result;
    } catch (err) {
      console.error('Error loading thermal forecast:', err);
      setForecastError(err.message);
      setForecastLoading(false);
      throw err;
    }
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
    forecast,
    forecastLoading,
    forecastError,
    outdoorTemperature,
    outdoorTemperatureHourly,

    // Actions
    loadSingleDayData,
    loadMultipleDaysData,
    validateDateRange,
    clearMultipleDaysData,
    clearSingleDayData,
    loadThermalForecast,
    setSelectedDate,
    setError
  };
};
