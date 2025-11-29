// ElectricityReport Type Definition (Frontend - Lightweight)
// Package: Reporting System
// 
// NOTE: This is a TYPE DEFINITION only.
// Report calculations and generation are handled by the backend.

/**
 * @typedef {import('./Report.js').Report} Report
 */

/**
 * @typedef {Object} ElectricityReport
 * @property {number|null} id - Report ID
 * @property {string} reportType - Always 'Electricity'
 * @property {number} electricityConsumption - Consumption in kWh
 * @property {number} electricityGeneration - Generation in kWh
 */

/**
 * ElectricityReport utility functions (Frontend only - for UI purposes)
 */
class ElectricityReportUtils {
  /**
   * Calculate self-sufficiency rate (CLIENT-SIDE PREVIEW ONLY)
   * Real calculation happens on the backend
   * 
   * @param {number} generation - Generation in kWh
   * @param {number} consumption - Consumption in kWh
   * @returns {number} Self-sufficiency rate as percentage
   */
  static calculateSelfSufficiency(generation, consumption) {
    if (consumption === 0) return 0;
    return (generation / consumption) * 100;
  }

  /**
   * Calculate net consumption
   * @param {number} consumption - Consumption in kWh
   * @param {number} generation - Generation in kWh
   * @returns {number} Net consumption in kWh
   */
  static calculateNetConsumption(consumption, generation) {
    return consumption - generation;
  }

  /**
   * Format electricity value for display
   * @param {number} kwh - Value in kWh
   * @returns {string}
   */
  static formatElectricity(kwh) {
    if (kwh >= 10000) {
      return `${(kwh / 1000).toFixed(2)} MWh`;
    }
    return `${kwh.toFixed(2)} kWh`;
  }

  /**
   * Format self-sufficiency rate for display
   * @param {number} rate - Rate as percentage
   * @returns {string}
   */
  static formatSelfSufficiency(rate) {
    return `${rate.toFixed(1)}%`;
  }

  /**
   * Get self-sufficiency status
   * @param {number} rate - Rate as percentage
   * @returns {{status: string, color: string, icon: string}}
   */
  static getSelfSufficiencyStatus(rate) {
    if (rate >= 100) {
      return {
        status: 'Excellent',
        color: '#28a745',
        icon: '✅'
      };
    } else if (rate >= 75) {
      return {
        status: 'Good',
        color: '#6D2077',
        icon: '👍'
      };
    } else if (rate >= 50) {
      return {
        status: 'Fair',
        color: '#ffc107',
        icon: '⚠️'
      };
    } else {
      return {
        status: 'Low',
        color: '#dc3545',
        icon: '❌'
      };
    }
  }

  /**
   * Calculate carbon footprint preview (CLIENT-SIDE ONLY)
   * Real calculation happens on the backend
   * 
   * @param {number} consumption - Consumption in kWh
   * @param {number} emissionFactor - Emission factor in kg CO2/kWh
   * @returns {number} Carbon footprint in kg CO2
   */
  static calculateCarbonFootprint(consumption, emissionFactor) {
    return consumption * emissionFactor;
  }

  /**
   * Format carbon footprint for display
   * @param {number} co2 - CO2 in kg
   * @returns {string}
   */
  static formatCarbonFootprint(co2) {
    if (co2 >= 1000) {
      return `${(co2 / 1000).toFixed(2)} tonnes CO2`;
    }
    return `${co2.toFixed(2)} kg CO2`;
  }

  /**
   * Validate electricity data (UX only)
   * @param {Partial<ElectricityReport>} data 
   * @returns {{valid: boolean, errors: string[]}}
   */
  static validate(data) {
    const errors = [];

    if (data.electricityConsumption === undefined || data.electricityConsumption < 0) {
      errors.push('Valid electricity consumption is required (≥ 0)');
    }

    if (data.electricityGeneration === undefined || data.electricityGeneration < 0) {
      errors.push('Valid electricity generation is required (≥ 0)');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export default ElectricityReportUtils;

