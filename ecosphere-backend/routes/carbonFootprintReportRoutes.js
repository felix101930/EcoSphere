const express = require('express');
const router = express.Router();
const carbonFootprintReportController = require('../controllers/carbonFootprintReportController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Create a new report record
router.post('/', carbonFootprintReportController.createReport);

// Get all reports for current user
router.get('/', carbonFootprintReportController.getReports);

// Get report statistics
router.get('/stats', carbonFootprintReportController.getReportStats);

// Get a specific report by ID
router.get('/:id', carbonFootprintReportController.getReportById);

// Delete a report
router.delete('/:id', carbonFootprintReportController.deleteReport);

module.exports = router;
