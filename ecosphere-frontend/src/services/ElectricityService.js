// Electricity Service - Handles electricity data API calls
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

class ElectricityService {
  /**
   * Get real-time data (today)
   */
  async getRealTimeData() {
    try {
      const response = await fetch(`${API_BASE_URL}/electricity/realtime`);
      if (!response.ok) throw new Error('Failed to fetch real-time data');
      return await response.json();
    } catch (error) {
      console.error('Error fetching real-time data:', error);
      throw error;
    }
  }

  /**
   * Get daily data (last N days)
   */
  async getDailyData(days = 10) {
    try {
      const response = await fetch(`${API_BASE_URL}/electricity/daily?days=${days}`);
      if (!response.ok) throw new Error('Failed to fetch daily data');
      return await response.json();
    } catch (error) {
      console.error('Error fetching daily data:', error);
      throw error;
    }
  }

  /**
   * Get long-term data (last 12 months)
   */
  async getLongTermData() {
    try {
      const response = await fetch(`${API_BASE_URL}/electricity/longterm`);
      if (!response.ok) throw new Error('Failed to fetch long-term data');
      return await response.json();
    } catch (error) {
      console.error('Error fetching long-term data:', error);
      throw error;
    }
  }

  /**
   * Get data by date range
   */
  async getDataByRange(startDate, endDate) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/electricity/range?startDate=${startDate}&endDate=${endDate}`
      );
      if (!response.ok) throw new Error('Failed to fetch data by range');
      return await response.json();
    } catch (error) {
      console.error('Error fetching data by range:', error);
      throw error;
    }
  }

  /**
   * Get metadata
   */
  async getMetadata() {
    try {
      const response = await fetch(`${API_BASE_URL}/electricity/metadata`);
      if (!response.ok) throw new Error('Failed to fetch metadata');
      return await response.json();
    } catch (error) {
      console.error('Error fetching metadata:', error);
      throw error;
    }
  }

  /**
   * Convert power (W) to energy (kWh) for hourly data
   * Power (W) × 1 hour = Energy (Wh) → / 1000 = kWh
   */
  convertToKWh(powerInWatts) {
    return powerInWatts / 1000;
  }

  /**
   * Calculate total energy consumption for a dataset
   */
  calculateTotalEnergy(data) {
    return data.reduce((total, record) => {
      return total + this.convertToKWh(record.value);
    }, 0);
  }
}

export default new ElectricityService();
