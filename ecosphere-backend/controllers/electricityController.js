// Electricity Controller - Handles electricity-related requests
const electricityService = require('../services/electricityService');

class ElectricityController {
  /**
   * Get all electricity records
   */
  async getAllRecords(req, res) {
    try {
      const records = await electricityService.getAllRecords();
      res.json(records);
    } catch (error) {
      console.error('Error in getAllRecords:', error);
      res.status(500).json({ error: 'Failed to fetch electricity records' });
    }
  }

  /**
   * Get electricity records by date range
   */
  async getRecordsByDateRange(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate are required' });
      }
      
      const records = await electricityService.getRecordsByDateRange(startDate, endDate);
      res.json(records);
    } catch (error) {
      console.error('Error in getRecordsByDateRange:', error);
      res.status(500).json({ error: 'Failed to fetch electricity records' });
    }
  }

  /**
   * Get real-time data (today)
   */
  async getRealTimeData(req, res) {
    try {
      const records = await electricityService.getRealTimeData();
      res.json(records);
    } catch (error) {
      console.error('Error in getRealTimeData:', error);
      res.status(500).json({ error: 'Failed to fetch real-time data' });
    }
  }

  /**
   * Get daily data (last N days)
   */
  async getDailyData(req, res) {
    try {
      const days = parseInt(req.query.days) || 10;
      const records = await electricityService.getDailyData(days);
      res.json(records);
    } catch (error) {
      console.error('Error in getDailyData:', error);
      res.status(500).json({ error: 'Failed to fetch daily data' });
    }
  }

  /**
   * Get long-term data (last 12 months)
   */
  async getLongTermData(req, res) {
    try {
      const records = await electricityService.getLongTermData();
      res.json(records);
    } catch (error) {
      console.error('Error in getLongTermData:', error);
      res.status(500).json({ error: 'Failed to fetch long-term data' });
    }
  }

  /**
   * Get metadata
   */
  async getMetadata(req, res) {
    try {
      const metadata = await electricityService.getMetadata();
      res.json(metadata);
    } catch (error) {
      console.error('Error in getMetadata:', error);
      res.status(500).json({ error: 'Failed to fetch metadata' });
    }
  }
}

module.exports = new ElectricityController();
