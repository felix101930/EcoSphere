// Custom Hook for Water Data Management
import { useState, useEffect, useCallback } from 'react';
import WaterReportService from '../../services/WaterReportService';

export const useWaterData = () => {
    // State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [dateRange, setDateRange] = useState(null);

    // Data states
    const [rainwaterData, setRainwaterData] = useState(null);
    const [hotWaterData, setHotWaterData] = useState(null);
    const [hotWaterForecast, setHotWaterForecast] = useState(null);
    const [rainwaterForecast, setRainwaterForecast] = useState(null);

    /**
     * Load available date range on mount
     */
    useEffect(() => {
        const loadDateRange = async () => {
            try {
                setLoading(true);
                const response = await WaterReportService.getAvailableDateRange();
                if (response.success) {
                    setDateRange(response.dateRanges);
                }
            } catch (err) {
                console.error('Error loading date range:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadDateRange();
    }, []);

    /**
     * Load rainwater level data
     */
    const loadRainwaterData = useCallback(async (dateFrom, dateTo) => {
        try {
            setLoading(true);
            setError(null);

            const response = await WaterReportService.getRainwaterLevelData(
                dateFrom,
                dateTo
            );

            if (response.success) {
                setRainwaterData(response);
            } else {
                throw new Error(response.error || 'Failed to load rainwater data');
            }
        } catch (err) {
            console.error('Error loading rainwater data:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Load hot water consumption data
     */
    const loadHotWaterData = useCallback(async (dateFrom, dateTo) => {
        try {
            setLoading(true);
            setError(null);

            const response = await WaterReportService.getHotWaterConsumptionData(
                dateFrom,
                dateTo
            );

            if (response.success) {
                setHotWaterData(response);
            } else {
                throw new Error(response.error || 'Failed to load hot water data');
            }
        } catch (err) {
            console.error('Error loading hot water data:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Load hot water consumption forecast
     */
    const loadHotWaterForecast = useCallback(async (targetDate, forecastDays) => {
        try {
            setLoading(true);
            setError(null);

            const formattedDate = WaterReportService.formatDate(targetDate);

            const response = await WaterReportService.getHotWaterForecast(
                formattedDate,
                forecastDays
            );

            if (response.success) {
                setHotWaterForecast(response);
            } else {
                throw new Error(response.error || 'Failed to load hot water forecast');
            }
        } catch (err) {
            console.error('Error loading hot water forecast:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Load rainwater level forecast
     */
    const loadRainwaterForecast = useCallback(async (targetDate, forecastDays) => {
        try {
            setLoading(true);
            setError(null);

            const formattedDate = WaterReportService.formatDate(targetDate);

            const response = await WaterReportService.getRainwaterForecast(
                formattedDate,
                forecastDays
            );

            if (response.success) {
                setRainwaterForecast(response);
            } else {
                throw new Error(response.error || 'Failed to load rainwater forecast');
            }
        } catch (err) {
            console.error('Error loading rainwater forecast:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Clear all data
     */
    const clearData = useCallback(() => {
        setRainwaterData(null);
        setHotWaterData(null);
        setHotWaterForecast(null);
        setRainwaterForecast(null);
        setError(null);
    }, []);

    return {
        // State
        loading,
        error,
        dateRange,

        // Data
        rainwaterData,
        hotWaterData,
        hotWaterForecast,
        rainwaterForecast,

        // Actions
        loadRainwaterData,
        loadHotWaterData,
        loadHotWaterForecast,
        loadRainwaterForecast,
        clearData
    };
};
