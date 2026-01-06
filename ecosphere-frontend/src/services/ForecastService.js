// Forecast Service - Frontend API calls
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

class ForecastService {
    /**
     * Get electricity consumption forecast
     * @param {string} targetDate - Base date (YYYY-MM-DD)
     * @param {number} forecastDays - Number of days to forecast
     * @returns {Promise<Object>} Forecast result with predictions and metadata
     */
    static async getElectricityForecast(targetDate, forecastDays) {
        try {
            const response = await fetch(
                `${API_BASE_URL}/forecast/electricity/${targetDate}/${forecastDays}`
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch forecast');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching electricity forecast:', error);
            throw error;
        }
    }

    /**
     * Get solar generation forecast (weather-based)
     * @param {string} targetDate - Base date (YYYY-MM-DD)
     * @param {number} forecastDays - Number of days to forecast
     * @returns {Promise<Object>} Forecast result with predictions and metadata
     */
    static async getGenerationForecast(targetDate, forecastDays) {
        try {
            const response = await fetch(
                `${API_BASE_URL}/forecast/generation/${targetDate}/${forecastDays}`
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch generation forecast');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching generation forecast:', error);
            throw error;
        }
    }

    /**
     * Format date to YYYY-MM-DD
     */
    static formatDate(date) {
        if (!date) return null;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}

export default ForecastService;
