// Natural Gas Data Hook
import { useState, useEffect } from 'react';
import NaturalGasService from '../../services/NaturalGasService';

export const useNaturalGasData = (dateFrom, dateTo) => {
    const [consumptionData, setConsumptionData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchConsumptionData = async (from, to) => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await NaturalGasService.getConsumptionData(from, to);
            setConsumptionData(data);
        } catch (err) {
            console.error('Error loading consumption data:', err);
            setError('Failed to load consumption data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (dateFrom && dateTo) {
            fetchConsumptionData(dateFrom, dateTo);
        }
    }, [dateFrom, dateTo]);

    return {
        consumptionData,
        isLoading,
        error,
        fetchConsumptionData
    };
};
