// Natural Gas Service - API calls for natural gas data
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

class NaturalGasService {
    /**
     * Get consumption data
     * @param {Date} dateFrom - Start date
     * @param {Date} dateTo - End date
     * @returns {Promise<Object>} Consumption data
     */
    static async getConsumptionData(dateFrom, dateTo) {
        try {
            // Format dates to YYYY-MM-DD
            const fromStr = this.formatDate(dateFrom);
            const toStr = this.formatDate(dateTo);

            const response = await fetch(
                `${API_BASE_URL}/natural-gas/consumption?dateFrom=${fromStr}&dateTo=${toStr}`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch consumption data');
            }

            const result = await response.json();
            return result.data;
        } catch (error) {
            console.error('Error fetching consumption data:', error);
            throw error;
        }
    }

    /**
     * Get available date range
     * @returns {Promise<Object>} Date range {minDate, maxDate}
     */
    static async getDateRange() {
        try {
            const response = await fetch(`${API_BASE_URL}/natural-gas/date-range`);

            if (!response.ok) {
                throw new Error('Failed to fetch date range');
            }

            const result = await response.json();
            return result.data;
        } catch (error) {
            console.error('Error fetching date range:', error);
            throw error;
        }
    }

    /**
     * Format date to YYYY-MM-DD
     * @param {Date} date - Date object
     * @returns {string} Formatted date string
     */
    static formatDate(date) {
        if (!date) return null;

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

    /**
     * Get all historical data
     * @returns {Promise<Array>} All monthly data
     */
    static async getAllData() {
        try {
            const response = await fetch(`${API_BASE_URL}/natural-gas/all-data`);

            if (!response.ok) {
                throw new Error('Failed to fetch all data');
            }

            const result = await response.json();
            return result.data;
        } catch (error) {
            console.error('Error fetching all data:', error);
            throw error;
        }
    }

    /**
     * Get forecast
     * @param {Date} targetDate - Target date for forecast
     * @param {number} forecastMonths - Number of months to forecast
     * @returns {Promise<Object>} Forecast data
     */
    static async getForecast(targetDate, forecastMonths = 6) {
        try {
            const targetStr = this.formatDate(targetDate);

            const response = await fetch(
                `${API_BASE_URL}/natural-gas/forecast?targetDate=${targetStr}&forecastMonths=${forecastMonths}`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch forecast');
            }

            const result = await response.json();
            return result.data;
        } catch (error) {
            console.error('Error fetching forecast:', error);
            throw error;
        }
    }
}

export default NaturalGasService;
