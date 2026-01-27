// Thermal Dashboard Configuration Constants
// Centralized configuration for thermal monitoring system

// ============================================================================
// FLOOR CONFIGURATIONS
// ============================================================================

export const FLOOR_CONFIGS = {
  basement: {
    id: 'basement',
    name: 'Basement',
    displayName: 'Basement',
    sensorIds: ['20004_TL2', '20005_TL2', '20006_TL2'],
    imagePath: '/assets/floorplan/basement.png'
  },
  level1: {
    id: 'level1',
    name: 'Level 1',
    displayName: 'Level 1',
    sensorIds: ['20007_TL2', '20008_TL2', '20009_TL2', '20010_TL2', '20011_TL2'],
    imagePath: '/assets/floorplan/level1.png'
  },
  level2: {
    id: 'level2',
    name: 'Level 2',
    displayName: 'Level 2',
    sensorIds: ['20012_TL2', '20013_TL2', '20014_TL2', '20015_TL2', '20016_TL2'],
    imagePath: '/assets/floorplan/level2.png'
  }
};

// ============================================================================
// SENSOR POSITIONS ON FLOOR PLANS
// ============================================================================

export const SENSOR_POSITIONS = {
  basement: {
    '20004': { top: '15%', right: '1%', width: '200px', height: '100px' },
    '20005': { top: '30%', left: '25%', width: '200px', height: '100px' },
    '20006': { top: '45%', right: '1%', width: '200px', height: '100px' }
  },
  level1: {
    '20007': { top: '5%', left: '20%', width: '200px', height: '100px' },
    '20008': { top: '50%', left: '35%', width: '200px', height: '100px' },
    '20009': { top: '50%', left: '55%', width: '200px', height: '100px' },
    '20010': { top: '15%', right: '8%', width: '200px', height: '100px' },
    '20011': { top: '15%', left: '42%', width: '200px', height: '100px' }
  },
  level2: {
    '20012': { top: '10%', left: '25%', width: '200px', height: '100px' },
    '20013': { top: '15%', left: '45%', width: '200px', height: '100px' },
    '20014': { top: '30%', right: '10%', width: '200px', height: '100px' },
    '20015': { top: '55%', right: '30%', width: '200px', height: '100px' },
    '20016': { top: '50%', left: '25%', width: '200px', height: '100px' }
  }
};

// ============================================================================
// SENSOR LOCATION NAMES (Direction-based naming)
// ============================================================================

export const SENSOR_LOCATION_NAMES = {
  // Basement sensors
  '20004': 'East 1',
  '20005': 'West 1',
  '20006': 'East 2',

  // Level 1 sensors
  '20007': 'West 1',
  '20008': 'South 1',
  '20009': 'South 2',
  '20010': 'East 1',
  '20011': 'North 1',

  // Level 2 sensors
  '20012': 'West 1',
  '20013': 'North 1',
  '20014': 'East 1',
  '20015': 'South 1',
  '20016': 'West 2'
};

// Helper function to get sensor display name
export const getSensorDisplayName = (sensorNumber) => {
  const locationName = SENSOR_LOCATION_NAMES[sensorNumber];
  return locationName ? `${locationName} (TL${sensorNumber})` : sensorNumber;
};

// ============================================================================
// SENSOR COLORS (SAIT Official + Additional Colors)
// ============================================================================

export const SENSOR_COLORS = {
  // Basement sensors - SAIT Official Colors
  '20004_TL2': {
    rgb: '218, 41, 28',
    hex: '#DA291C',
    name: 'Sensor 20004',
    description: 'Red - SAIT Official'
  },
  '20005_TL2': {
    rgb: '0, 94, 184',
    hex: '#005EB8',
    name: 'Sensor 20005',
    description: 'Blue - SAIT Official'
  },
  '20006_TL2': {
    rgb: '109, 32, 119',
    hex: '#6D2077',
    name: 'Sensor 20006',
    description: 'Purple - SAIT Official'
  },

  // Level 1 sensors - Additional Colors
  '20007_TL2': {
    rgb: '0, 166, 81',
    hex: '#00A651',
    name: 'Sensor 20007',
    description: 'Green'
  },
  '20008_TL2': {
    rgb: '255, 105, 0',
    hex: '#FF6900',
    name: 'Sensor 20008',
    description: 'Orange'
  },
  '20009_TL2': {
    rgb: '255, 193, 7',
    hex: '#FFC107',
    name: 'Sensor 20009',
    description: 'Yellow'
  },
  '20010_TL2': {
    rgb: '156, 39, 176',
    hex: '#9C27B0',
    name: 'Sensor 20010',
    description: 'Magenta'
  },
  '20011_TL2': {
    rgb: '0, 188, 212',
    hex: '#00BCD4',
    name: 'Sensor 20011',
    description: 'Cyan'
  },

  // Level 2 sensors - Additional Colors
  '20012_TL2': {
    rgb: '233, 30, 99',
    hex: '#E91E63',
    name: 'Sensor 20012',
    description: 'Pink'
  },
  '20013_TL2': {
    rgb: '103, 58, 183',
    hex: '#673AB7',
    name: 'Sensor 20013',
    description: 'Deep Purple'
  },
  '20014_TL2': {
    rgb: '63, 81, 181',
    hex: '#3F51B5',
    name: 'Sensor 20014',
    description: 'Indigo'
  },
  '20015_TL2': {
    rgb: '0, 150, 136',
    hex: '#009688',
    name: 'Sensor 20015',
    description: 'Teal'
  },
  '20016_TL2': {
    rgb: '205, 220, 57',
    hex: '#CDDC39',
    name: 'Sensor 20016',
    description: 'Lime'
  }
};

// Helper function to get color for charts
export const getSensorColor = (sensorId, format = 'rgb') => {
  const color = SENSOR_COLORS[sensorId];
  if (!color) return format === 'rgb' ? '128, 128, 128' : '#808080';
  return format === 'rgb' ? color.rgb : color.hex;
};

// Helper function to get sensor name
export const getSensorName = (sensorId) => {
  const color = SENSOR_COLORS[sensorId];
  return color ? color.name : `Sensor ${sensorId}`;
};

// ============================================================================
// DATE AND TIME CONFIGURATIONS
// ============================================================================

export const DATE_CONFIG = {
  // Date range limits
  MAX_DATE_RANGE_DAYS: 30,
  MIN_DATE: '2019-01-01',
  MAX_DATE: '2020-11-07',

  // Default dates
  DEFAULT_FALLBACK_DATE: '2020-11-07',

  // Time intervals
  RECORDS_PER_DAY: 96, // 15-minute intervals
  MINUTES_PER_INTERVAL: 15
};

// ============================================================================
// VIEW MODE CONFIGURATIONS
// ============================================================================

export const VIEW_MODES = {
  SINGLE: 'single',
  MULTIPLE: 'multiple',
  FORECAST: 'forecast'
};

export const VIEW_MODE_LABELS = {
  [VIEW_MODES.SINGLE]: 'Single Day',
  [VIEW_MODES.MULTIPLE]: 'Multi Days',
  [VIEW_MODES.FORECAST]: 'Forecast'
};

// ============================================================================
// TIME CONTROL CONFIGURATIONS
// ============================================================================

export const TIME_CONTROL_CONFIG = {
  // Animation speeds (milliseconds)
  ANIMATION_SPEED_SINGLE: 500,
  ANIMATION_SPEED_MULTIPLE: 500,

  // Playback speed options
  PLAYBACK_SPEEDS: [
    { value: 1, label: '1x', speed: 500 },
    { value: 1.5, label: '1.5x', speed: 333 },
    { value: 2, label: '2x', speed: 250 },
    { value: 3, label: '3x', speed: 167 }
  ],

  // Default playback speed
  DEFAULT_PLAYBACK_SPEED: 1,

  // Slider marks for single day mode (96 intervals)
  SINGLE_DAY_MARKS: [
    { value: 0, label: '00:00' },
    { value: 24, label: '06:00' },
    { value: 48, label: '12:00' },
    { value: 72, label: '18:00' },
    { value: 95, label: '23:45' }
  ]
};

// ============================================================================
// TEMPERATURE DISPLAY CONFIGURATIONS
// ============================================================================

export const TEMPERATURE_CONFIG = {
  // Temperature ranges for color coding
  RANGES: [
    { max: 0, color: '#000000', label: '< 0°C' },        // Black for freezing
    { min: 0, max: 20, color: '#0066FF', label: '0-20°C' },
    { min: 20, max: 22, color: '#00CCFF', label: '20-22°C' },
    { min: 22, max: 23, color: '#00FF00', label: '22-23°C' },
    { min: 23, max: 24, color: '#FFFF00', label: '23-24°C' },
    { min: 24, max: 25, color: '#FF9900', label: '24-25°C' },
    { min: 25, max: 35, color: '#FF3300', label: '25-35°C' },
    { min: 35, color: '#800080', label: '> 35°C' }       // Purple for extreme heat
  ],

  // Display format
  DECIMAL_PLACES: 1,
  UNIT: '°C'
};

// ============================================================================
// UI CONFIGURATIONS
// ============================================================================

export const UI_CONFIG = {
  // Loading states
  LOADING_TEXT: 'Loading time control data...',

  // Chart heights
  CHART_HEIGHT: 400,
  TREND_CHART_HEIGHT: 350,

  // Error messages
  ERROR_MESSAGES: {
    NO_DATES: 'Please select both From and To dates',
    INVALID_RANGE: 'From date must be before To date',
    RANGE_TOO_LARGE: `Date range cannot exceed ${DATE_CONFIG.MAX_DATE_RANGE_DAYS} days`,
    LOAD_FAILED: 'Error loading data',
    NO_DATA: 'No data available for selected date range'
  }
};

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const DEFAULTS = {
  FLOOR: 'basement',
  VIEW_MODE: VIEW_MODES.SINGLE,
  TIME_INDEX: 0,
  DATE_INDEX: 0
};
