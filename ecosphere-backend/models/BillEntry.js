// BillEntry class
// Package: Carbon Analysis
// Relationship: CarbonFootprint "1" o-- "*" BillEntry : stores

class BillEntry {
  constructor(id = null, year = 0, month = '', electricityUsage = 0.0) {
    // Attributes from class diagram
    this.id = id;
    this.year = year;
    this.month = month;
    this.electricityUsage = electricityUsage;
  }

  /**
   * Create a new bill entry
   * @param {number} id - Entry ID
   * @param {number} year - Year
   * @param {string} month - Month name
   * @param {number} electricityUsage - Electricity usage in kWh
   * @returns {BillEntry} New bill entry instance
   */
  static create(id, year, month, electricityUsage) {
    return new BillEntry(id, year, month, electricityUsage);
  }

  /**
   * Validate bill entry data
   * @returns {boolean} True if valid
   */
  isValid() {
    return (
      this.year > 0 &&
      this.month !== '' &&
      this.electricityUsage >= 0
    );
  }

  /**
   * Get formatted date string
   * @returns {string} Formatted date (YYYY-MM)
   */
  getFormattedDate() {
    return `${this.year}-${this.month}`;
  }

  /**
   * Convert to plain object
   * @returns {Object} Plain object representation
   */
  toObject() {
    return {
      id: this.id,
      year: this.year,
      month: this.month,
      electricityUsage: this.electricityUsage
    };
  }

  /**
   * Create instance from plain object
   */
  static fromObject(obj) {
    return new BillEntry(obj.id, obj.year, obj.month, obj.electricityUsage);
  }
}

module.exports = BillEntry;

