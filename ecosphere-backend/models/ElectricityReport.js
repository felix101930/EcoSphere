// ElectricityReport class (Inherits from Report)
// Package: Reporting System
// Relationship: ElectricityReport --|> Report : is-a
// Relationship: CarbonFootprint "1" --> "1" ElectricityReport : calculates
const Report = require('./Report');

class ElectricityReport extends Report {
  constructor() {
    super();
    
    // Set report type
    this.reportType = 'Electricity';
    
    // Specific attributes from class diagram
    this.electricityConsumption = 0.0;
    this.electricityGeneration = 0.0;
  }

  /**
   * Calculate carbon footprint from electricity consumption
   * @param {number} emissionFactor - Emission factor in kg CO2/kWh
   * @returns {number} Carbon footprint in kg CO2
   */
  calculateCarbonFootprint(emissionFactor) {
    // Formula: Carbon Footprint = Electricity Consumption × Emission Factor
    const carbonFootprint = this.electricityConsumption * emissionFactor;
    console.log('ElectricityReport.calculateCarbonFootprint() called', {
      consumption: this.electricityConsumption,
      emissionFactor: emissionFactor,
      result: carbonFootprint
    });
    return carbonFootprint;
  }

  /**
   * Generate hotspot map data
   * @param {Object} data - Input data for hotspot map
   * @returns {Object} Hotspot map data
   */
  generateHotspotMap(data) {
    console.log('ElectricityReport.generateHotspotMap() called', data);
    // TODO: Implement hotspot map generation logic
    return {
      type: 'hotspot',
      data: data
    };
  }

  /**
   * Generate carbon vs consumption chart data
   * @returns {Object} Chart data
   */
  generateCarbonVsConsumptionChart() {
    console.log('ElectricityReport.generateCarbonVsConsumptionChart() called');
    // TODO: Implement chart generation logic
    return {
      type: 'line',
      labels: [],
      datasets: [
        {
          label: 'Carbon Footprint',
          data: []
        },
        {
          label: 'Electricity Consumption',
          data: []
        }
      ]
    };
  }

  /**
   * Export report (inherited from Report)
   * @override
   */
  exportReport() {
    console.log('ElectricityReport.exportReport() called');
    return {
      id: this.id,
      reportType: this.reportType,
      electricityConsumption: this.electricityConsumption,
      electricityGeneration: this.electricityGeneration,
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Filter report data (inherited from Report)
   * @override
   * @param {Object} filters - Filter criteria
   */
  filterReport(filters) {
    console.log('ElectricityReport.filterReport() called', filters);
    // TODO: Implement filter logic
    return this;
  }

  /**
   * Set electricity consumption
   * @param {number} consumption - Consumption in kWh
   */
  setElectricityConsumption(consumption) {
    this.electricityConsumption = consumption;
  }

  /**
   * Set electricity generation
   * @param {number} generation - Generation in kWh
   */
  setElectricityGeneration(generation) {
    this.electricityGeneration = generation;
  }

  /**
   * Get electricity consumption
   * @returns {number} Consumption in kWh
   */
  getElectricityConsumption() {
    return this.electricityConsumption;
  }

  /**
   * Get electricity generation
   * @returns {number} Generation in kWh
   */
  getElectricityGeneration() {
    return this.electricityGeneration;
  }

  /**
   * Calculate self-sufficiency rate
   * @returns {number} Self-sufficiency rate as percentage
   */
  calculateSelfSufficiency() {
    if (this.electricityConsumption === 0) return 0;
    return (this.electricityGeneration / this.electricityConsumption) * 100;
  }

  /**
   * Convert to plain object
   */
  toObject() {
    return {
      ...super.toObject(),
      electricityConsumption: this.electricityConsumption,
      electricityGeneration: this.electricityGeneration
    };
  }

  /**
   * Create instance from plain object
   */
  static fromObject(obj) {
    const report = new ElectricityReport();
    report.id = obj.id;
    report.reportType = obj.reportType;
    report.electricityConsumption = obj.electricityConsumption;
    report.electricityGeneration = obj.electricityGeneration;
    return report;
  }
}

module.exports = ElectricityReport;

