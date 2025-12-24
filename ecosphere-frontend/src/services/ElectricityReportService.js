// Electricity Report Service - API calls for electricity data
const API_BASE_URL = 'http://localhost:3001/api/electricity';

class ElectricityReportService {
  /**
   * Get available date range for electricity data
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
   * Get comprehensive electricity overview
   */
  async getElectricityOverview(dateFrom, dateTo) {
    try {
      const response = await fetch(`${API_BASE_URL}/overview/${dateFrom}/${dateTo}`);
      if (!response.ok) {
        throw new Error('Failed to fetch electricity overview');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching electricity overview:', error);
      throw error;
    }
  }

  /**
   * Get consumption data (TL341)
   */
  async getConsumptionData(dateFrom, dateTo) {
    try {
      const response = await fetch(`${API_BASE_URL}/consumption/${dateFrom}/${dateTo}`);
      if (!response.ok) {
        throw new Error('Failed to fetch consumption data');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching consumption data:', error);
      throw error;
    }
  }

  /**
   * Get generation data (TL340)
   */
  async getGenerationData(dateFrom, dateTo) {
    try {
      const response = await fetch(`${API_BASE_URL}/generation/${dateFrom}/${dateTo}`);
      if (!response.ok) {
        throw new Error('Failed to fetch generation data');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching generation data:', error);
      throw error;
    }
  }

  /**
   * Get net energy data (TL339)
   */
  async getNetEnergyData(dateFrom, dateTo) {
    try {
      const response = await fetch(`${API_BASE_URL}/net-energy/${dateFrom}/${dateTo}`);
      if (!response.ok) {
        throw new Error('Failed to fetch net energy data');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching net energy data:', error);
      throw error;
    }
  }

  /**
   * Get phase breakdown data (TL342-345)
   */
  async getPhaseBreakdownData(dateFrom, dateTo) {
    try {
      const response = await fetch(`${API_BASE_URL}/phase-breakdown/${dateFrom}/${dateTo}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch phase breakdown data');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching phase breakdown data:', error);
      throw error;
    }
  }

  /**
   * Get equipment breakdown data
   */
  async getEquipmentBreakdownData(dateFrom, dateTo) {
    try {
      const response = await fetch(`${API_BASE_URL}/equipment-breakdown/${dateFrom}/${dateTo}`);
      if (!response.ok) {
        throw new Error('Failed to fetch equipment breakdown data');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching equipment breakdown data:', error);
      throw error;
    }
  }

  /**
   * Get solar source breakdown data (TL252-253)
   */
  async getSolarSourceBreakdownData(dateFrom, dateTo) {
    try {
      const response = await fetch(`${API_BASE_URL}/solar-breakdown/${dateFrom}/${dateTo}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch solar breakdown data');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching solar breakdown data:', error);
      throw error;
    }
  }

  /**
   * Format date to YYYY-MM-DD
   */
  formatDate(date) {
    if (!date) return null;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

export default new ElectricityReportService();
