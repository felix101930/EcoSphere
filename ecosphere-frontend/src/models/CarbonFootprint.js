// CarbonFootprint Type Definition (Frontend - Lightweight)
// Package: Carbon Analysis
// 
// NOTE: This is a TYPE DEFINITION only.
// Carbon footprint calculations are handled by the backend.
// Frontend only does temporary calculations for user preview.

/**
 * @typedef {import('./BillEntry.js').BillEntry} BillEntry
 */

/**
 * @typedef {Object} CarbonFootprint
 * @property {number|null} id - Carbon footprint ID
 * @property {number} co2Emission - CO2 emission in kg
 * @property {BillEntry[]} billEntries - List of bill entries
 */

/**
 * CarbonFootprint utility functions (Frontend only - for UI purposes)
 */
class CarbonFootprintUtils {
  /**
   * Calculate carbon footprint (CLIENT-SIDE PREVIEW ONLY)
   * This is for temporary calculation/preview, NOT for persistence
   * Real calculation happens on the backend
   * 
   * @param {number} electricityUsage - Electricity usage in kWh
   * @param {number} emissionFactor - Emission factor in kg CO2/kWh
   * @returns {number} Carbon footprint in kg CO2
   */
  static calculateFootprint(electricityUsage, emissionFactor) {
    return electricityUsage * emissionFactor;
  }

  /**
   * Calculate total usage from bill entries
   * @param {BillEntry[]} billEntries 
   * @returns {number} Total usage in kWh
   */
  static getTotalUsage(billEntries) {
    return billEntries.reduce((total, entry) => {
      return total + (entry.electricityUsage || 0);
    }, 0);
  }

  /**
   * Calculate total CO2 from bill entries (preview only)
   * @param {BillEntry[]} billEntries 
   * @param {number} emissionFactor 
   * @returns {number} Total CO2 in kg
   */
  static calculateTotalCO2(billEntries, emissionFactor) {
    const totalUsage = this.getTotalUsage(billEntries);
    return this.calculateFootprint(totalUsage, emissionFactor);
  }

  /**
   * Format CO2 emission for display
   * @param {number} co2 - CO2 in kg
   * @returns {string}
   */
  static formatCO2(co2) {
    if (co2 >= 1000) {
      return `${(co2 / 1000).toFixed(2)} tonnes CO2`;
    }
    return `${co2.toFixed(2)} kg CO2`;
  }

  /**
   * Format electricity usage for display
   * @param {number} kwh - Usage in kWh
   * @returns {string}
   */
  static formatElectricity(kwh) {
    if (kwh >= 10000) {
      return `${(kwh / 1000).toFixed(2)} MWh`;
    }
    return `${kwh.toFixed(2)} kWh`;
  }

  /**
   * Validate bill entries (UX only)
   * @param {BillEntry[]} entries 
   * @returns {{valid: boolean, errors: string[]}}
   */
  static validateBillEntries(entries) {
    const errors = [];

    if (!entries || entries.length === 0) {
      errors.push('At least one bill entry is required');
    }

    // Check for duplicates
    const seen = new Set();
    entries.forEach(entry => {
      const key = `${entry.year}-${entry.month}`;
      if (seen.has(key)) {
        errors.push(`Duplicate entry for ${key}`);
      }
      seen.add(key);
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export default CarbonFootprintUtils;

