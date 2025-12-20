// Thermal Controller - Handle thermal data requests
const ThermalService = require('../services/thermalService');

// Get available dates
const getAvailableDates = async (req, res) => {
  try {
    const sensorId = req.query.sensorId || '20004_TL2';
    const dates = await ThermalService.getAvailableDates(sensorId);
    
    res.json({
      success: true,
      dates: dates
    });
  } catch (error) {
    console.error('Error in getAvailableDates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available dates'
    });
  }
};

// Get last complete date
const getLastCompleteDate = async (req, res) => {
  try {
    const sensorId = req.query.sensorId || '20004_TL2';
    const date = await ThermalService.getLastCompleteDate(sensorId);
    
    res.json({
      success: true,
      date: date
    });
  } catch (error) {
    console.error('Error in getLastCompleteDate:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch last complete date'
    });
  }
};

// Get daily data for a single sensor
const getDailyData = async (req, res) => {
  try {
    const { sensorId, date } = req.params;
    
    if (!sensorId || !date) {
      return res.status(400).json({
        success: false,
        error: 'Missing sensorId or date parameter'
      });
    }
    
    const data = await ThermalService.getDailyData(sensorId, date);
    
    res.json({
      success: true,
      sensorId: sensorId,
      date: date,
      count: data.length,
      data: data
    });
  } catch (error) {
    console.error('Error in getDailyData:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch daily data'
    });
  }
};

// Get daily data for multiple sensors
const getMultipleSensorsDailyData = async (req, res) => {
  try {
    const { date } = req.params;
    const sensorIds = req.query.sensors ? req.query.sensors.split(',') : ['20004_TL2', '20005_TL2', '20006_TL2'];
    
    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'Missing date parameter'
      });
    }
    
    const data = await ThermalService.getMultipleSensorsDailyData(sensorIds, date);
    
    res.json({
      success: true,
      date: date,
      sensors: sensorIds,
      data: data
    });
  } catch (error) {
    console.error('Error in getMultipleSensorsDailyData:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch multiple sensors data'
    });
  }
};

// Get aggregated data for multiple sensors (date range)
const getMultipleSensorsAggregatedData = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.params;
    const sensorIds = req.query.sensors ? req.query.sensors.split(',') : ['20004_TL2', '20005_TL2', '20006_TL2'];
    
    if (!dateFrom || !dateTo) {
      return res.status(400).json({
        success: false,
        error: 'Missing dateFrom or dateTo parameter'
      });
    }
    
    // Calculate date difference
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    const diffDays = Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;
    
    // Limit to 30 days
    if (diffDays > 30) {
      return res.status(400).json({
        success: false,
        error: 'Date range cannot exceed 30 days'
      });
    }
    
    const data = await ThermalService.getMultipleSensorsAggregatedData(sensorIds, dateFrom, dateTo);
    
    res.json({
      success: true,
      dateFrom: dateFrom,
      dateTo: dateTo,
      days: diffDays,
      sensors: sensorIds,
      data: data
    });
  } catch (error) {
    console.error('Error in getMultipleSensorsAggregatedData:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch aggregated data'
    });
  }
};

module.exports = {
  getAvailableDates,
  getLastCompleteDate,
  getDailyData,
  getMultipleSensorsDailyData,
  getMultipleSensorsAggregatedData
};
