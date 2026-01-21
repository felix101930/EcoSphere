// BillEntry Type Definition (Frontend - Lightweight)
// Package: Carbon Analysis
// 
// NOTE: This is a TYPE DEFINITION only.
// Business logic is handled by the backend.

/**
 * @typedef {Object} BillEntry
 * @property {number|null} id - Entry ID
 * @property {number} year - Year
 * @property {string} month - Month name
 * @property {number} electricityUsage - Electricity usage in kWh
 */

/**
 * BillEntry utility functions (Frontend only - for UI purposes)
 */
class BillEntryUtils {
  /**
   * Validate bill entry data (UX only)
   * @param {Partial<BillEntry>} entry 
   * @returns {{valid: boolean, errors: string[]}}
   */
  static validate(entry) {
    const errors = [];

    if (!entry.year || entry.year < 2000 || entry.year > 2100) {
      errors.push('Valid year is required (2000-2100)');
    }

    if (!entry.month || entry.month.trim() === '') {
      errors.push('Month is required');
    }

    if (entry.electricityUsage === undefined || entry.electricityUsage < 0) {
      errors.push('Valid electricity usage is required (≥ 0)');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Format date for display
   * @param {BillEntry} entry 
   * @returns {string}
   */
  static formatDate(entry) {
    return `${entry.year}-${entry.month}`;
  }

  /**
   * Format electricity usage for display
   * @param {number} usage - Usage in kWh
   * @returns {string}
   */
  static formatUsage(usage) {
    return `${usage.toFixed(2)} kWh`;
  }

  /**
   * Create empty bill entry for form
   * @returns {Partial<BillEntry>}
   */
  static createEmpty() {
    return {
      id: null,
      year: new Date().getFullYear(),
      month: '',
      electricityUsage: 0
    };
  }

  /**
   * Sort bill entries by date (for display)
   * @param {BillEntry[]} entries 
   * @returns {BillEntry[]}
   */
  static sortByDate(entries) {
    return [...entries].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month.localeCompare(b.month);
    });
  }
}

export default BillEntryUtils;

