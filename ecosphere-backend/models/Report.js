// Report class (Abstract class)
// Package: Reporting System
// Relationship: Report ..> Database : queries
// Relationship: Report ..> AccessControl : checks permission

class Report {
  constructor() {
    // Attributes from class diagram
    this.id = null;
    this.reportType = '';
  }

  /**
   * Export report to file
   * Abstract method - to be implemented by subclasses
   */
  exportReport() {
    throw new Error('exportReport() must be implemented by subclass');
  }

  /**
   * Filter report data
   * Abstract method - to be implemented by subclasses
   * @param {Object} filters - Filter criteria
   */
  filterReport(filters) {
    throw new Error('filterReport() must be implemented by subclass');
  }

  /**
   * Get report type
   * @returns {string} Report type
   */
  getReportType() {
    return this.reportType;
  }

  /**
   * Set report ID
   * @param {number} id - Report ID
   */
  setId(id) {
    this.id = id;
  }

  /**
   * Get report ID
   * @returns {number} Report ID
   */
  getId() {
    return this.id;
  }

  /**
   * Convert to plain object
   */
  toObject() {
    return {
      id: this.id,
      reportType: this.reportType
    };
  }
}

module.exports = Report;

