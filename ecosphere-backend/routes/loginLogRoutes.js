const express = require('express');
const router = express.Router();
const loginLogController = require('../controllers/loginLogController');

// Get all login logs
router.get('/', loginLogController.getAllLogs);

// Add a new login log
router.post('/', loginLogController.addLog);

// Update logout information
router.put('/:id/logout', loginLogController.updateLogout);

module.exports = router;
