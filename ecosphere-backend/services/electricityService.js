// Electricity Service - Handles electricity data operations
const fs = require('fs').promises;
const config = require('../config/config');

class ElectricityService {
  /**
   * Read electricity data from JSON file
   */
  async readElectricityData() {
    try {
      const data = await fs.readFile(config.electricityFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading electricity file:', error);
      return { metadata: {}, data: [] };
    }
  }

  /**
   * Get all electricity records
   */
  async getAllRecords() {
    const fileData = await this.readElectricityData();
    return fileData.data || [];
  }

  /**
   * Get electricity records for a specific date range
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   */
  async getRecordsByDateRange(startDate, endDate) {
    const allRecords = await this.getAllRecords();
    
    // Parse dates in local timezone by adding time component
    // This ensures the date is interpreted as local time, not UTC
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59.999');
    
    return allRecords.filter(record => {
      // Parse record timestamp in local timezone
      // Replace space with 'T' to ensure proper ISO format
      const recordDate = new Date(record.ts.replace(' ', 'T'));
      return recordDate >= start && recordDate <= end;
    });
  }

  /**
   * Get real-time data (today from 00:00 to now)
   */
  async getRealTimeData() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayStr = today.toISOString().split('T')[0];
    
    return await this.getRecordsByDateRange(todayStr, todayStr);
  }

  /**
   * Get daily data (last N days)
   * @param {number} days - Number of days (default: 10)
   */
  async getDailyData(days = 10) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    
    return await this.getRecordsByDateRange(startStr, endStr);
  }

  /**
   * Get long-term data (last 12 months)
   */
  async getLongTermData() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 12);
    
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    
    return await this.getRecordsByDateRange(startStr, endStr);
  }

  /**
   * Get metadata
   */
  async getMetadata() {
    const fileData = await this.readElectricityData();
    return fileData.metadata || {};
  }
}

module.exports = new ElectricityService();
