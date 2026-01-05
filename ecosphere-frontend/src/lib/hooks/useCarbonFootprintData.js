import { useState, useEffect, useCallback } from 'react';
import { TIME_PRESETS, DATA_RANGES, DEMO_DATES } from '../constants/carbonFootprint';
import ElectricityReportService from '../../services/ElectricityReportService';
import ElectricityMapsService from '../../services/ElectricityMapsService';
import { aggregateToDaily, calculateDailyMetrics } from '../utils/dataAggregation';

export default function useCarbonFootprintData() {
    const [timePreset, setTimePreset] = useState(TIME_PRESETS.TODAY);
    const [dateRange, setDateRange] = useState({ from: null, to: null });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [consumptionData, setConsumptionData] = useState(null);
    const [carbonIntensity, setCarbonIntensity] = useState(null);

    // Calculate date range based on preset
    const calculateDateRange = useCallback((preset) => {
        let from, to;

        switch (preset) {
            case TIME_PRESETS.TODAY:
                from = new Date(DEMO_DATES.TODAY + 'T12:00:00');
                to = new Date(DEMO_DATES.TODAY + 'T12:00:00');
                break;
            case TIME_PRESETS.YESTERDAY:
                from = new Date(DEMO_DATES.YESTERDAY + 'T12:00:00');
                to = new Date(DEMO_DATES.YESTERDAY + 'T12:00:00');
                break;
            case TIME_PRESETS.LAST_7_DAYS:
                from = new Date(DEMO_DATES.LAST_7_DAYS_START + 'T12:00:00');
                to = new Date(DEMO_DATES.LAST_7_DAYS_END + 'T12:00:00');
                break;
            case TIME_PRESETS.LAST_30_DAYS:
                from = new Date(DEMO_DATES.LAST_30_DAYS_START + 'T12:00:00');
                to = new Date(DEMO_DATES.LAST_30_DAYS_END + 'T12:00:00');
                break;
            case TIME_PRESETS.CUSTOM:
                // Keep current dates
                return null;
            default:
                from = new Date(DEMO_DATES.TODAY + 'T12:00:00');
                to = new Date(DEMO_DATES.TODAY + 'T12:00:00');
        }

        return { from, to };
    }, []);

    // Format date for API
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Check if date is within range
    const isDateInRange = useCallback((dateStr) => {
        return dateStr >= DATA_RANGES.electricity.start &&
            dateStr <= DATA_RANGES.electricity.end;
    }, []);

    // Check if date range is single day
    const isSingleDay = useCallback((from, to) => {
        return formatDate(from) === formatDate(to);
    }, []);

    // Load consumption data
    const loadConsumptionData = useCallback(async (from, to) => {
        try {
            const fromStr = formatDate(from);
            const toStr = formatDate(to);

            if (!isDateInRange(fromStr) || !isDateInRange(toStr)) {
                return null;
            }

            const response = await ElectricityReportService.getConsumptionData(fromStr, toStr);

            if (response && response.data) {
                // For single day, keep hourly data; for multiple days, aggregate to daily
                if (isSingleDay(from, to)) {
                    // Keep hourly data as is
                    return response;
                } else {
                    // Aggregate to daily
                    const dailyData = aggregateToDaily(response.data);
                    const dailyMetrics = calculateDailyMetrics(dailyData);

                    return {
                        data: dailyData,
                        metrics: dailyMetrics
                    };
                }
            }

            return response;
        } catch (err) {
            console.error('Error loading consumption data:', err);
            return null;
        }
    }, [isDateInRange, isSingleDay]);

    // Load carbon intensity (historical data for date range)
    const loadCarbonIntensity = useCallback(async (fromStr, toStr) => {
        try {
            // Get historical carbon intensity for the date range
            const historicalIntensity = await ElectricityMapsService.getHistoricalCarbonIntensity(fromStr, toStr);
            return historicalIntensity;
        } catch (err) {
            console.error('Error loading carbon intensity:', err);
            return {};
        }
    }, []);

    // Load all data
    const loadAllData = useCallback(async () => {
        if (!dateRange.from || !dateRange.to) return;

        setLoading(true);
        setError(null);

        try {
            const fromStr = formatDate(dateRange.from);
            const toStr = formatDate(dateRange.to);

            const [consumption, intensity] = await Promise.all([
                loadConsumptionData(dateRange.from, dateRange.to),
                loadCarbonIntensity(fromStr, toStr)
            ]);

            setConsumptionData(consumption);
            setCarbonIntensity(intensity);
        } catch (err) {
            console.error('Error loading carbon footprint data:', err);
            setError('Failed to load data. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [dateRange, loadConsumptionData, loadCarbonIntensity]);

    // Update date range when preset changes
    useEffect(() => {
        if (timePreset === TIME_PRESETS.CUSTOM) return;

        const range = calculateDateRange(timePreset);
        if (range) {
            setDateRange(range);
        }
    }, [timePreset, calculateDateRange]);

    // Load data when date range changes
    useEffect(() => {
        loadAllData();
    }, [loadAllData]);

    return {
        timePreset,
        setTimePreset,
        dateRange,
        setDateRange,
        loading,
        error,
        consumptionData,
        carbonIntensity,
        isSingleDay: dateRange.from && dateRange.to ? isSingleDay(dateRange.from, dateRange.to) : false,
        reload: loadAllData
    };
}
