// Thermal Service - Frontend API calls for thermal data
const API_BASE_URL = 'http://localhost:3001/api/thermal';

class ThermalService {
  /**
   * Get available dates with data
   */
  async getAvailableDates(sensorId = '20004_TL2') {
    try {
      const response = await fetch(`${API_BASE_URL}/available-dates?sensorId=${sensorId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch available dates');
      }
      const data = await response.json();
      return data.dates || [];
    } catch (error) {
      console.error('Error fetching available dates:', error);
      return [];
    }
  }

  /**
   * Get last complete date
   */
  async getLastCompleteDate(sensorId = '20004_TL2') {
    try {
      const response = await fetch(`${API_BASE_URL}/last-complete-date?sensorId=${sensorId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch last complete date');
      }
      const data = await response.json();
      return data.date || '2020-11-07';
    } catch (error) {
      console.error('Error fetching last complete date:', error);
      return '2020-11-07';
    }
  }

  /**
   * Get date range for multiple sensors
   */
  async getSensorsDateRange(sensorIds = ['20004_TL2', '20005_TL2', '20006_TL2']) {
    try {
      const sensorsParam = sensorIds.join(',');
      const response = await fetch(`${API_BASE_URL}/sensors-date-range?sensors=${sensorsParam}`);
      if (!response.ok) {
        throw new Error('Failed to fetch sensors date range');
      }
      const result = await response.json();
      return result.data || {};
    } catch (error) {
      console.error('Error fetching sensors date range:', error);
      return {};
    }
  }

  /**
   * Get daily data for multiple sensors
   */
  async getMultipleSensorsDailyData(date, sensorIds = ['20004_TL2', '20005_TL2', '20006_TL2']) {
    try {
      const sensorsParam = sensorIds.join(',');
      const url = `${API_BASE_URL}/daily-multiple/${date}?sensors=${sensorsParam}`;
      console.log('[ThermalService] Fetching multiple sensors data:', { date, sensorIds, url });

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch multiple sensors data');
      }
      const result = await response.json();

      console.log('[ThermalService] Received data:', {
        date,
        dataKeys: Object.keys(result.data || {}),
        firstSensorId: sensorIds[0],
        firstSensorDataLength: result.data?.[sensorIds[0]]?.length,
        firstSensorFirstRecord: result.data?.[sensorIds[0]]?.[0],
        firstSensorLastRecord: result.data?.[sensorIds[0]]?.[result.data?.[sensorIds[0]]?.length - 1]
      });

      return result.data || {};
    } catch (error) {
      console.error('Error fetching multiple sensors data:', error);
      return {};
    }
  }

  /**
   * Get aggregated data for multiple sensors (date range)
   */
  async getAggregatedData(dateFrom, dateTo, sensorIds = ['20004_TL2', '20005_TL2', '20006_TL2']) {
    try {
      const sensorsParam = encodeURIComponent(sensorIds.join(','));
      const response = await fetch(`${API_BASE_URL}/aggregated/${dateFrom}/${dateTo}?sensors=${sensorsParam}`);
      if (!response.ok) {
        throw new Error('Failed to fetch aggregated data');
      }
      const result = await response.json();
      return result.data || {};
    } catch (error) {
      console.error('Error fetching aggregated data:', error);
      return {};
    }
  }

  /**
   * Format temperature to 1 decimal place
   */
  formatTemperature(temp) {
    if (temp === null || temp === undefined || isNaN(temp)) {
      return 'N/A';
    }
    return temp.toFixed(1);
  }

  /**
   * Get color based on temperature value
   */
  getColorByTemp(temp) {
    if (temp === null || temp === undefined || isNaN(temp)) {
      return '#CCCCCC'; // Gray for no data
    }

    if (temp < 0) return '#000000';       // Freezing - Black
    if (temp < 20) return '#0066FF';      // Cold - Blue
    if (temp < 22) return '#00CCFF';      // Cool - Light Blue
    if (temp < 23) return '#00FF00';      // Comfortable - Green
    if (temp < 24) return '#FFFF00';      // Warm - Yellow
    if (temp < 25) return '#FF9900';      // Hot - Orange
    if (temp < 35) return '#FF3300';      // Very Hot - Red
    return '#800080';                     // Extreme Heat - Purple
  }

  /**
   * Parse time from timestamp (HH:MM format)
   */
  parseTime(timestamp) {
    // timestamp format: "2020-11-07 14:30:00"
    const parts = timestamp.split(' ');
    if (parts.length >= 2) {
      const timeParts = parts[1].split(':');
      return `${timeParts[0]}:${timeParts[1]}`;
    }
    return '00:00';
  }

  /**
   * Get time index from timestamp (0-95)
   */
  getTimeIndex(timestamp) {
    const time = this.parseTime(timestamp);
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 4 + minutes / 15;
  }

  /**
   * Get thermal forecast for a floor
   */
  async getThermalForecast(floor, targetDate, forecastDays) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/forecast/${floor}/${targetDate}/${forecastDays}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch thermal forecast');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching thermal forecast:', error);
      throw error;
    }
  }
}

export default new ThermalService();
