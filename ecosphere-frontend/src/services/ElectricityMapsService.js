// ElectricityMapsService - Handles Electricity Maps API calls
// Provides real-time carbon intensity data for Alberta

const API_KEY = import.meta.env.VITE_ELECTRICITY_MAPS_API_KEY;
const API_URL = import.meta.env.VITE_ELECTRICITY_MAPS_API_URL;
const ZONE = import.meta.env.VITE_ELECTRICITY_MAPS_ZONE || 'CA-AB';
const FALLBACK_INTENSITY = parseFloat(import.meta.env.VITE_FALLBACK_CARBON_INTENSITY) || 0.65;

class ElectricityMapsService {
  constructor() {
    this.cache = null;
    this.cacheTime = null;
    this.cacheDuration = 60 * 60 * 1000; // 1 hour cache
    this.apiCallCount = 0;
    this.dailyLimit = 1000;
  }

  /**
   * Get current carbon intensity for Alberta
   * @returns {Promise<Object>} Carbon intensity data
   */
  async getCurrentCarbonIntensity() {
    // Check cache first
    if (this.isCacheValid()) {
      console.log('📦 Using cached carbon intensity');
      return this.cache;
    }

    try {
      console.log('🌍 Fetching carbon intensity from Electricity Maps API...');

      const response = await fetch(
        `${API_URL}/carbon-intensity/latest?zone=${ZONE}`,
        {
          method: 'GET',
          headers: {
            'auth-token': API_KEY
          }
        }
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Update cache
      this.cache = {
        ...data,
        isCached: false,
        isFallback: false,
        fetchedAt: new Date().toISOString()
      };
      this.cacheTime = Date.now();
      this.apiCallCount++;

      console.log('✅ Carbon intensity fetched:', data.carbonIntensity, 'g CO2/kWh');

      return this.cache;
    } catch (error) {
      console.error('❌ Failed to fetch carbon intensity:', error.message);
      return this.getFallbackData(error.message);
    }
  }

  /**
   * Get historical carbon intensity for a date range
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @returns {Promise<Array>} Array of carbon intensity data by date
   */
  async getHistoricalCarbonIntensity(startDate, endDate) {
    try {
      console.log(`🌍 Fetching historical carbon intensity from ${startDate} to ${endDate}...`);

      // Convert dates to ISO format with time
      const startISO = `${startDate}T00:00:00Z`;
      const endISO = `${endDate}T23:59:59Z`;

      const response = await fetch(
        `${API_URL}/carbon-intensity/past-range?zone=${ZONE}&start=${startISO}&end=${endISO}&temporalGranularity=daily`,
        {
          method: 'GET',
          headers: {
            'auth-token': API_KEY
          }
        }
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      this.apiCallCount++;

      console.log('✅ Historical carbon intensity fetched:', data.data?.length || 0, 'days');

      // Transform data to map by date
      const intensityByDate = {};
      if (data.data && Array.isArray(data.data)) {
        data.data.forEach(item => {
          // Extract date from datetime (YYYY-MM-DD)
          const date = item.datetime.split('T')[0];
          intensityByDate[date] = {
            carbonIntensity: item.carbonIntensity,
            datetime: item.datetime,
            zone: item.zone,
            isEstimated: item.isEstimated || false
          };
        });
      }

      return intensityByDate;
    } catch (error) {
      console.error('❌ Failed to fetch historical carbon intensity:', error.message);
      // Return empty object, will use fallback for each date
      return {};
    }
  }

  /**
   * Check if cache is still valid
   * @returns {boolean}
   */
  isCacheValid() {
    return this.cache &&
      this.cacheTime &&
      (Date.now() - this.cacheTime < this.cacheDuration);
  }

  /**
   * Get fallback data when API fails
   * @param {string} errorMessage
   * @returns {Object}
   */
  getFallbackData(errorMessage) {
    console.warn('⚠️ Using fallback carbon intensity:', FALLBACK_INTENSITY, 'kg CO2/kWh');

    return {
      zone: ZONE,
      carbonIntensity: FALLBACK_INTENSITY * 1000, // Convert to g CO2/kWh
      datetime: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isEstimated: true,
      isFallback: true,
      isCached: false,
      error: errorMessage,
      fetchedAt: new Date().toISOString()
    };
  }

  /**
   * Convert carbon intensity from g CO2/kWh to kg CO2/kWh
   * @param {Object} data - Carbon intensity data
   * @returns {number} Carbon intensity in kg CO2/kWh
   */
  getCarbonIntensityInKg(data) {
    return data.carbonIntensity / 1000;
  }

  /**
   * Calculate carbon footprint
   * @param {number} electricityUsage - in kWh
   * @param {Object} carbonData - Carbon intensity data
   * @returns {number} Carbon footprint in kg CO2
   */
  calculateCarbonFootprint(electricityUsage, carbonData) {
    const emissionFactor = this.getCarbonIntensityInKg(carbonData);
    return electricityUsage * emissionFactor;
  }

  /**
   * Clear cache and force refresh
   */
  clearCache() {
    this.cache = null;
    this.cacheTime = null;
    console.log('🗑️ Cache cleared');
  }

  /**
   * Get API usage statistics
   * @returns {Object}
   */
  getApiUsage() {
    const remaining = this.dailyLimit - this.apiCallCount;
    const cacheAge = this.cacheTime ? Math.floor((Date.now() - this.cacheTime) / 1000 / 60) : null;

    return {
      callsToday: this.apiCallCount,
      dailyLimit: this.dailyLimit,
      remaining: remaining,
      cacheAge: cacheAge, // in minutes
      isCached: this.isCacheValid()
    };
  }

  /**
   * Reset daily API call counter
   */
  resetDailyCounter() {
    this.apiCallCount = 0;
    console.log('🔄 Daily API counter reset');
  }
}

// Export singleton instance
export default new ElectricityMapsService();
