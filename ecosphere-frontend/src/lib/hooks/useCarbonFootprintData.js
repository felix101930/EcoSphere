import { useState, useEffect, useCallback } from 'react';
import { TIME_PRESETS, DATA_RANGES, DEMO_DATE_RANGE } from '../constants/carbonFootprint';
import ElectricityReportService from '../../services/ElectricityReportService';
import ElectricityMapsService from '../../services/ElectricityMapsService';
import { aggregateToDaily, calculateDailyMetrics } from '../utils/dataAggregation';

export default function useCarbonFootprintData() {
    const [timePreset, setTimePreset] = useState(TIME_PRESETS.DEMO_DAY);
    const [dateRange, setDateRange] = useState({ from: null, to: null });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [consumptionData, setConsumptionData] = useState(null);
    const [carbonIntensity, setCarbonIntensity] = useState(null);

    // Calculate date range based on preset
    const calculateDateRange = useCallback((preset) => {
        const today = new Date();
        today.setHours(12, 0, 0, 0); // Noon time for timezone safety

        let from, to;

        switch (preset) {
            case TIME_PRESETS.DEMO_DAY:
                from = new Date(DEMO_DATE_RANGE.start + 'T12:00:00');
                to = new Date(DEMO_DATE_RANGE.end + 'T12:00:00');
                break;
            case TIME_PRESETS.TODAY:
                from = new Date(today);
                to = new Date(today);
                break;
            case TIME_PRESETS.YESTERDAY:
                from = new Date(today);
                from.setDate(from.getDate() - 1);
                to = new Date(from);
                break;
            case TIME_PRESETS.LAST_7_DAYS:
                to = new Date(today);
                from = new Date(today);
                from.setDate(from.getDate() - 7);
                break;
            case TIME_PRESETS.LAST_30_DAYS:
                to = new Date(today);
                from = new Date(today);
                from.setDate(from.getDate() - 30);
                break;
            default:
                from = new Date(today);
                to = new Date(today);
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

    // Load consumption data
    const loadConsumptionData = useCallback(async (fromStr, toStr) => {
        try {
            if (!isDateInRange(fromStr) || !isDateInRange(toStr)) {
                return null;
            }

            const response = await ElectricityReportService.getConsumptionData(fromStr, toStr);

            // Aggregate hourly data to daily data
            if (response && response.data) {
                const dailyData = aggregateToDaily(response.data);
                const dailyMetrics = calculateDailyMetrics(dailyData);

                return {
                    data: dailyData,
                    metrics: dailyMetrics
                };
            }

            return response;
        } catch (err) {
            console.error('Error loading consumption data:', err);
            return null;
        }
    }, [isDateInRange]);

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
                loadConsumptionData(fromStr, toStr),
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
        const range = calculateDateRange(timePreset);
        setDateRange(range);
    }, [timePreset, calculateDateRange]);

    // Load data when date range changes
    useEffect(() => {
        loadAllData();
    }, [loadAllData]);

    return {
        timePreset,
        setTimePreset,
        dateRange,
        loading,
        error,
        consumptionData,
        carbonIntensity,
        reload: loadAllData
    };
}
