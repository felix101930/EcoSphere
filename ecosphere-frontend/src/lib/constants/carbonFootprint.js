// Carbon Footprint Configuration Constants

// ============================================================================
// DATE RANGES
// ============================================================================

export const DATA_RANGES = {
    electricity: {
        start: '2019-02-13',
        end: '2020-11-08'
    }
};

// ============================================================================
// TIME PRESETS
// ============================================================================

export const TIME_PRESETS = {
    TODAY: 'today',
    YESTERDAY: 'yesterday',
    LAST_7_DAYS: 'last7days',
    LAST_30_DAYS: 'last30days',
    DEMO_DAY: 'demoday'
};

export const DEMO_DATE_RANGE = {
    start: '2020-11-01',
    end: '2020-11-08'
};

// ============================================================================
// CARBON INTENSITY
// ============================================================================

export const CARBON_INTENSITY = {
    DEFAULT: 0.65, // kg CO2/kWh - Alberta average
    UNIT: 'kg CO2/kWh'
};

// ============================================================================
// CHART COLORS (SAIT Theme)
// ============================================================================

export const CHART_COLORS = {
    energy: {
        border: 'rgb(0, 94, 184)', // SAIT Blue
        background: 'rgba(0, 94, 184, 0.1)'
    },
    carbon: {
        border: 'rgb(218, 41, 28)', // SAIT Red
        background: 'rgba(218, 41, 28, 0.1)'
    }
};

// ============================================================================
// VIEW MODES
// ============================================================================

export const VIEW_MODES = {
    AUTOMATIC: 'automatic', // From database
    CUSTOM: 'custom' // User input calculator
};

export const VIEW_MODE_LABELS = {
    [VIEW_MODES.AUTOMATIC]: 'Automatic Calculation',
    [VIEW_MODES.CUSTOM]: 'Custom Calculator'
};
