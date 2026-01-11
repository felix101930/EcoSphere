// Weather Service - Handle weather data API calls
const API_BASE_URL = 'http://localhost:3001/api/weather';

const WeatherService = {
    /**
     * Get outdoor temperature data for date range (daily aggregated)
     * @param {string} dateFrom - Start date (YYYY-MM-DD)
     * @param {string} dateTo - End date (YYYY-MM-DD)
     * @returns {Promise<Array>} Array of {date, temperature, avg, high, low}
     */
    async getOutdoorTemperature(dateFrom, dateTo) {
        try {
            const response = await fetch(
                `${API_BASE_URL}/outdoor-temperature?dateFrom=${dateFrom}&dateTo=${dateTo}&type=thermal`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch outdoor temperature');
            }

            const result = await response.json();
            return result.data || [];
        } catch (error) {
            console.error('Error fetching outdoor temperature:', error);
            throw error;
        }
    },

    /**
     * Get outdoor temperature data for single day (hourly)
     * @param {string} date - Date (YYYY-MM-DD)
     * @returns {Promise<Array>} Array of {timestamp, temperature}
     */
    async getOutdoorTemperatureHourly(date) {
        try {
            const response = await fetch(
                `${API_BASE_URL}/outdoor-temperature-hourly?date=${date}&type=thermal`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch hourly outdoor temperature');
            }

            const result = await response.json();
            return result.data || [];
        } catch (error) {
            console.error('Error fetching hourly outdoor temperature:', error);
            throw error;
        }
    }
};

export default WeatherService;
