// Database Test Routes
const express = require('express');
const router = express.Router();
const { testConnection, getAllSensors } = require('../db/queries');

// Test database connection
router.get('/test-connection', async (req, res) => {
  try {
    const isConnected = await testConnection();
    if (isConnected) {
      res.json({ 
        success: true, 
        message: 'Database connection successful' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Database connection failed' 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error testing connection',
      error: error.message 
    });
  }
});

// Test query sensor data
router.get('/test-sensors', async (req, res) => {
  try {
    const sensors = await getAllSensors();
    res.json({ 
      success: true, 
      count: sensors.length,
      data: sensors 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching sensors',
      error: error.message 
    });
  }
});

// Read data from specified sensor table
router.get('/sensor/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
    // Use sqlcmd query
    const { querySensorData } = require('../db/sqlcmdQuery');
    const data = await querySensorData(tableName, limit);
    
    res.json({ 
      success: true,
      tableName: tableName,
      count: data.length,
      data: data 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: `Error fetching data from table ${req.params.tableName}`,
      error: error.message 
    });
  }
});

module.exports = router;
