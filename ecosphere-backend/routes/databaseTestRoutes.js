// Database Test Routes
const express = require('express');
const router = express.Router();
const { querySensorData } = require('../db/sqlcmdQuery');

// Test database connection
router.get('/test-connection', async (req, res) => {
  try {
    // Simple test query
    const testData = await querySensorData('20004_TL2', 1);
    res.json({ 
      success: true, 
      message: 'Database connection successful',
      sampleData: testData[0] || null
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Database connection failed',
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
