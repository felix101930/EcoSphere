// Custom Hook for Forecast Data Management
import { useState, useCallback } from 'react';
import ForecastService from '../../services/ForecastService';

export const useForecastData = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [forecastData, setForecastData] = useState(null);

    /**
     * Load electricity forecast
     */
    const loadElectricityForecast = useCallback(async (targetDate, forecastDays) => {
        try {
            setLoading(true);
            setError(null);

            const formattedDate = ForecastService.formatDate(targetDate);

            const response = await ForecastService.getElectricityForecast(
                formattedDate,
                forecastDays
            );

            if (response.success) {
                setForecastData(response);
            } else {
                throw new Error(response.error || 'Failed to load forecast');
            }
        } catch (err) {
            console.error('Error loading forecast:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Clear forecast data
     */
    const clearForecast = useCallback(() => {
        setForecastData(null);
        setError(null);
    }, []);

    return {
        loading,
        error,
        forecastData,
        loadElectricityForecast,
        clearForecast
    };
};
