// Report Type Definition (Frontend - Lightweight)
// Package: Reporting System
// 
// NOTE: This is a TYPE DEFINITION only.
// Report generation and export are handled by the backend.

/**
 * @typedef {Object} Report
 * @property {number|null} id - Report ID
 * @property {string} reportType - Report type ('Water', 'Electricity', 'Thermal')
 */

/**
 * Report utility functions (Frontend only - for UI purposes)
 */
class ReportUtils {
  /**
   * Get report type display name
   * @param {string} reportType 
   * @returns {string}
   */
  static getDisplayName(reportType) {
    const names = {
      'Water': 'Water Report',
      'Electricity': 'Electricity Report',
      'Thermal': 'Thermal Report'
    };
    return names[reportType] || reportType;
  }

  /**
   * Get report type icon
   * @param {string} reportType 
   * @returns {string}
   */
  static getIcon(reportType) {
    const icons = {
      'Water': '💧',
      'Electricity': '⚡',
      'Thermal': '🔥'
    };
    return icons[reportType] || '📊';
  }

  /**
   * Get report type color
   * @param {string} reportType 
   * @returns {string}
   */
  static getColor(reportType) {
    const colors = {
      'Water': '#00A3E0',      // Light Blue
      'Electricity': '#DA291C', // SAIT Red
      'Thermal': '#A6192E'      // Dark Red
    };
    return colors[reportType] || '#324053';
  }

  /**
   * Validate report type
   * @param {string} reportType 
   * @returns {boolean}
   */
  static isValidType(reportType) {
    return ['Water', 'Electricity', 'Thermal'].includes(reportType);
  }

  /**
   * Format date for report display
   * @param {Date|string} date 
   * @returns {string}
   */
  static formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}

export default ReportUtils;

