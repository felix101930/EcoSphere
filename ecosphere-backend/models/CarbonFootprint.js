// CarbonFootprint class
// Package: Carbon Analysis
// Relationship: CarbonFootprint "1" o-- "*" BillEntry : stores
// Relationship: CarbonFootprint "1" --> "1" ElectricityReport : calculates
// Relationship: UI "1" *-- "1" CarbonFootprint : owns

class CarbonFootprint {
  constructor() {
    // Attributes from class diagram
    this.id = null;
    this.co2Emission = 0.0;
    this.billEntries = []; // List of BillEntry objects
  }

  /**
   * Calculate carbon footprint from electricity usage
   * @param {number} electricityUsage - Electricity usage in kWh
   * @param {number} emissionFactor - Emission factor in kg CO2/kWh
   * @returns {number} Carbon footprint in kg CO2
   */
  calculateFootprint(electricityUsage, emissionFactor) {
    // Formula: CO2 = electricity × emission factor
    this.co2Emission = electricityUsage * emissionFactor;
    return this.co2Emission;
  }

  /**
   * Add a bill entry to the carbon footprint
   * @param {number} year - Year
   * @param {string} month - Month name
   * @param {number} electricityUsage - Electricity usage in kWh
   */
  addBillEntry(year, month, electricityUsage) {
    const billEntry = {
      id: this.billEntries.length + 1,
      year: year,
      month: month,
      electricityUsage: electricityUsage
    };
    
    this.billEntries.push(billEntry);
    console.log('CarbonFootprint.addBillEntry() called', billEntry);
  }

  /**
   * Override with DIY (Do-It-Yourself) data
   * Used for user temporary upload mode
   * @returns {Object} DataSet
   */
  overrideWithDIY() {
    console.log('CarbonFootprint.overrideWithDIY() called');
    // Return the current bill entries as a dataset
    return {
      billEntries: this.billEntries,
      totalUsage: this.getTotalUsage(),
      co2Emission: this.co2Emission
    };
  }

  /**
   * Get total electricity usage from all bill entries
   * @returns {number} Total usage in kWh
   */
  getTotalUsage() {
    return this.billEntries.reduce((total, entry) => {
      return total + entry.electricityUsage;
    }, 0);
  }

  /**
   * Clear all bill entries
   */
  clearBillEntries() {
    this.billEntries = [];
    this.co2Emission = 0.0;
  }

  /**
   * Get bill entries
   * @returns {Array} List of bill entries
   */
  getBillEntries() {
    return this.billEntries;
  }

  /**
   * Convert to plain object
   */
  toObject() {
    return {
      id: this.id,
      co2Emission: this.co2Emission,
      billEntries: this.billEntries
    };
  }

  /**
   * Create instance from plain object
   */
  static fromObject(obj) {
    const carbonFootprint = new CarbonFootprint();
    carbonFootprint.id = obj.id;
    carbonFootprint.co2Emission = obj.co2Emission;
    carbonFootprint.billEntries = obj.billEntries || [];
    return carbonFootprint;
  }
}

module.exports = CarbonFootprint;

