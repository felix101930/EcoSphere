const CarbonFootprintReportService = require('../services/carbonFootprintReportService');

// Create a new report record
exports.createReport = async (req, res) => {
  try {
    console.log('📝 Creating report for user:', req.user?.id, req.user?.email);
    
    const { parameters, dataSnapshot, metadata } = req.body;
    
    console.log('📊 Report data received:', {
      hasParameters: !!parameters,
      hasDataSnapshot: !!dataSnapshot,
      hasMetadata: !!metadata
    });
    
    if (!parameters || !dataSnapshot) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ 
        success: false, 
        message: 'Parameters and dataSnapshot are required' 
      });
    }

    const report = await CarbonFootprintReportService.createReport(
      req.user.id,
      { parameters, dataSnapshot, metadata }
    );

    console.log('✅ Report created successfully:', report.id);

    res.status(201).json({
      success: true,
      message: 'Report saved successfully',
      data: report
    });
  } catch (error) {
    console.error('❌ Error creating report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save report',
      error: error.message
    });
  }
};

// Get all reports for the current user
exports.getReports = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const result = await CarbonFootprintReportService.getReportsByUserId(
      req.user.id,
      parseInt(page),
      parseInt(limit)
    );

    res.json({
      success: true,
      data: result.reports,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
      total: result.total
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports',
      error: error.message
    });
  }
};

// Get a specific report by ID
exports.getReportById = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await CarbonFootprintReportService.getReportById(
      id,
      req.user.id
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch report',
      error: error.message
    });
  }
};

// Delete a report
exports.deleteReport = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await CarbonFootprintReportService.deleteReport(
      id,
      req.user.id
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete report',
      error: error.message
    });
  }
};

// Get report statistics
exports.getReportStats = async (req, res) => {
  try {
    const stats = await CarbonFootprintReportService.getReportStats(req.user.id);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching report stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch report statistics',
      error: error.message
    });
  }
};
