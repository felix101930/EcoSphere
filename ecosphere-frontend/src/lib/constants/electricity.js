// Electricity Report Constants

// Tab types
export const TAB_TYPES = {
  CONSUMPTION: 'consumption',
  GENERATION: 'generation',
  NET_ENERGY: 'netEnergy'
};

// Breakdown types for Consumption
export const CONSUMPTION_BREAKDOWNS = {
  OVERALL: 'overall',
  PHASE: 'phase',
  EQUIPMENT: 'equipment'
};

// Breakdown types for Generation
export const GENERATION_BREAKDOWNS = {
  OVERALL: 'overall',
  SOURCE: 'source'
};

// Time range presets
export const TIME_PRESETS = {
  LAST_7_DAYS: 'last7days',
  LAST_30_DAYS: 'last30days',
  LAST_3_MONTHS: 'last3months',
  CUSTOM: 'custom'
};

// Data availability warnings
export const DATA_WARNINGS = {
  PHASE: 'Phase data available from 2019-03-30 to 2025-12-31',
  SOLAR_SOURCE: 'Solar source data available from 2019-03-30 to 2025-12-31. Only covers ~27% of total generation.',
  EQUIPMENT: 'Equipment data has different time ranges for different categories',
  CONSUMPTION_COVERAGE: 'TL341 measures approximately 20% of total site consumption'
};

// Chart colors (SAIT colors)
export const CHART_COLORS = {
  PRIMARY: '#DA291C',      // SAIT Red
  SECONDARY: '#005EB8',    // SAIT Blue
  SUCCESS: '#4CAF50',      // Green
  WARNING: '#FF9800',      // Orange
  INFO: '#2196F3',         // Light Blue
  PHASE_A: '#DA291C',      // Red
  PHASE_B: '#005EB8',      // Blue
  PHASE_C: '#FF9800',      // Orange
  TOTAL: '#333333'         // Dark Gray
};

// Equipment labels
export const EQUIPMENT_LABELS = {
  panel2A1: 'Panel 2A-1',
  ventilation: 'Ventilation',
  lighting: 'Lighting',
  equipment: 'Equipment/R&D',
  appliances: 'Appliances'
};

// Solar source labels
export const SOLAR_SOURCE_LABELS = {
  carport: 'Carport Solar',
  rooftop: 'Rooftop Solar'
};

// Phase labels
export const PHASE_LABELS = {
  total: 'Total',
  phaseA: 'Phase A',
  phaseB: 'Phase B',
  phaseC: 'Phase C'
};
