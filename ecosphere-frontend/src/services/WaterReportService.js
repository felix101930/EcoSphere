// Water Report Service - API calls for water data
const API_BASE_URL = 'http://localhost:3001/api/water';

class WaterReportService {
    /**
     * Get available date range for water data
     */
    async getAvailableDateRange() {
        try {
            const response = await fetch(`${API_BASE_URL}/date-range`);
            if (!response.ok) {
                throw new Error('Failed to fetch date range');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching date range:', error);
            throw error;
        }
    }

    /**
     * Get rainwater level data
     */
    async getRainwaterLevelData(dateFrom, dateTo) {
        try {
            const formattedFrom = this.formatDate(dateFrom);
            const formattedTo = this.formatDate(dateTo);

            const response = await fetch(`${API_BASE_URL}/rainwater/${formattedFrom}/${formattedTo}`);
            if (!response.ok) {
                throw new Error('Failed to fetch rainwater level data');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching rainwater level data:', error);
            throw error;
        }
    }

    /**
     * Get hot water consumption data
     */
    async getHotWaterConsumptionData(dateFrom, dateTo) {
        try {
            const formattedFrom = this.formatDate(dateFrom);
            const formattedTo = this.formatDate(dateTo);

            const response = await fetch(`${API_BASE_URL}/hot-water/${formattedFrom}/${formattedTo}`);
            if (!response.ok) {
                throw new Error('Failed to fetch hot water consumption data');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching hot water consumption data:', error);
            throw error;
        }
    }

    /**
     * Get hot water consumption forecast
     * @param {string} targetDate - Base date (YYYY-MM-DD)
     * @param {number} forecastDays - Number of days to forecast
     * @returns {Promise<Object>} Forecast result
     */
    async getHotWaterForecast(targetDate, forecastDays) {
        try {
            const formattedDate = this.formatDate(targetDate);

            const response = await fetch(
                `${API_BASE_URL}/hot-water/forecast/${formattedDate}/${forecastDays}`
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch hot water forecast');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching hot water forecast:', error);
            throw error;
        }
    }

    /**
     * Format date to YYYY-MM-DD (timezone-safe)
     * Uses local date components to avoid timezone conversion issues
     */
    formatDate(date) {
        if (!date) return null;

        // If date is already a string in YYYY-MM-DD format, return as-is
        if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return date;
        }

        const d = new Date(date);

        // Use local date components to avoid timezone shifts
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }
}

export default new WaterReportService();
