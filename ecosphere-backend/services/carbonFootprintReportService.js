// Carbon Footprint Report Service - Business logic for report operations
const FileHelper = require('../utils/fileHelper');
const path = require('path');

const REPORTS_FILE = path.join(__dirname, '../data/carbonFootprintReports.json');

class CarbonFootprintReportService {
  /**
   * Initialize reports file if it doesn't exist
   */
  static initializeFile() {
    try {
      FileHelper.readJSON(REPORTS_FILE);
    } catch (error) {
      // File doesn't exist, create it
      FileHelper.writeJSON(REPORTS_FILE, { reports: [], nextId: 1 });
    }
  }

  /**
   * Get all reports for a user
   */
  static async getReportsByUserId(userId, page = 1, limit = 10) {
    this.initializeFile();
    const data = FileHelper.readJSON(REPORTS_FILE);
    
    // Filter by userId and sort by generatedAt (newest first)
    const userReports = data.reports
      .filter(r => r.userId === parseInt(userId))
      .sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedReports = userReports.slice(startIndex, endIndex);
    
    // Remove dataSnapshot from list view to reduce data size
    const reportsWithoutSnapshot = paginatedReports.map(r => {
      const { dataSnapshot, ...reportWithoutData } = r;
      return reportWithoutData;
    });
    
    return {
      reports: reportsWithoutSnapshot,
      total: userReports.length,
      totalPages: Math.ceil(userReports.length / limit),
      currentPage: page
    };
  }

  /**
   * Get a specific report by ID
   */
  static async getReportById(reportId, userId) {
    this.initializeFile();
    const data = FileHelper.readJSON(REPORTS_FILE);
    
    const report = data.reports.find(
      r => r.id === parseInt(reportId) && r.userId === parseInt(userId)
    );
    
    return report || null;
  }

  /**
   * Create a new report
   */
  static async createReport(userId, reportData) {
    this.initializeFile();
    const data = FileHelper.readJSON(REPORTS_FILE);
    
    const newReport = {
      id: data.nextId,
      userId: parseInt(userId),
      generatedAt: new Date().toISOString(),
      ...reportData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    data.reports.push(newReport);
    data.nextId += 1;
    
    FileHelper.writeJSON(REPORTS_FILE, data);
    
    return newReport;
  }

  /**
   * Delete a report
   */
  static async deleteReport(reportId, userId) {
    this.initializeFile();
    const data = FileHelper.readJSON(REPORTS_FILE);
    
    const reportIndex = data.reports.findIndex(
      r => r.id === parseInt(reportId) && r.userId === parseInt(userId)
    );
    
    if (reportIndex === -1) {
      return null;
    }
    
    const deletedReport = data.reports.splice(reportIndex, 1)[0];
    FileHelper.writeJSON(REPORTS_FILE, data);
    
    return deletedReport;
  }

  /**
   * Get report statistics for a user
   */
  static async getReportStats(userId) {
    this.initializeFile();
    const data = FileHelper.readJSON(REPORTS_FILE);
    
    const userReports = data.reports.filter(r => r.userId === parseInt(userId));
    
    const latestReport = userReports.length > 0
      ? userReports.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt))[0]
      : null;
    
    return {
      totalReports: userReports.length,
      latestReportDate: latestReport ? latestReport.generatedAt : null
    };
  }

  /**
   * Clean up old reports (older than 90 days)
   */
  static async cleanupOldReports() {
    this.initializeFile();
    const data = FileHelper.readJSON(REPORTS_FILE);
    
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const filteredReports = data.reports.filter(r => {
      const reportDate = new Date(r.generatedAt);
      return reportDate > ninetyDaysAgo;
    });
    
    const deletedCount = data.reports.length - filteredReports.length;
    
    if (deletedCount > 0) {
      data.reports = filteredReports;
      FileHelper.writeJSON(REPORTS_FILE, data);
    }
    
    return deletedCount;
  }
}

module.exports = CarbonFootprintReportService;
