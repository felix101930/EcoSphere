// Custom Hook for Forecast Data Management
import { useState, useCallback } from 'react';
import ForecastService from '../../services/ForecastService';

export const useForecastData = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [consumptionForecast, setConsumptionForecast] = useState(null);
    const [generationForecast, setGenerationForecast] = useState(null);

    /**
     * Load electricity consumption forecast
     */
    const loadConsumptionForecast = useCallback(async (targetDate, forecastDays) => {
        try {
            setLoading(true);
            setError(null);

            const formattedDate = ForecastService.formatDate(targetDate);

            const response = await ForecastService.getElectricityForecast(
                formattedDate,
                forecastDays
            );

            if (response.success) {
                setConsumptionForecast(response);
            } else {
                throw new Error(response.error || 'Failed to load consumption forecast');
            }
        } catch (err) {
            console.error('Error loading consumption forecast:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Load solar generation forecast
     */
    const loadGenerationForecast = useCallback(async (targetDate, forecastDays) => {
        try {
            setLoading(true);
            setError(null);

            const formattedDate = ForecastService.formatDate(targetDate);

            const response = await ForecastService.getGenerationForecast(
                formattedDate,
                forecastDays
            );

            if (response.success) {
                setGenerationForecast(response);
            } else {
                throw new Error(response.error || 'Failed to load generation forecast');
            }
        } catch (err) {
            console.error('Error loading generation forecast:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Load both forecasts
     */
    const loadBothForecasts = useCallback(async (targetDate, forecastDays) => {
        try {
            setLoading(true);
            setError(null);

            const formattedDate = ForecastService.formatDate(targetDate);

            // Load both in parallel
            const [consumptionResponse, generationResponse] = await Promise.all([
                ForecastService.getElectricityForecast(formattedDate, forecastDays),
                ForecastService.getGenerationForecast(formattedDate, forecastDays)
            ]);

            if (consumptionResponse.success) {
                setConsumptionForecast(consumptionResponse);
            }

            if (generationResponse.success) {
                setGenerationForecast(generationResponse);
            }

            if (!consumptionResponse.success && !generationResponse.success) {
                throw new Error('Failed to load forecasts');
            }
        } catch (err) {
            console.error('Error loading forecasts:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Clear forecast data
     */
    const clearForecasts = useCallback(() => {
        setConsumptionForecast(null);
        setGenerationForecast(null);
        setError(null);
    }, []);

    return {
        loading,
        error,
        consumptionForecast,
        generationForecast,
        loadConsumptionForecast,
        loadGenerationForecast,
        loadBothForecasts,
        clearForecasts
    };
};
