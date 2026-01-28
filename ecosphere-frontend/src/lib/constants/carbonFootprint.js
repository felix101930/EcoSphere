// Carbon Footprint Configuration Constants

// ============================================================================
// DATE RANGES
// ============================================================================

export const DATA_RANGES = {
    electricity: {
        start: '2019-02-13',
        end: '2025-12-31'
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
    CUSTOM: 'custom'
};

// Demo dates based on available data (latest available)
export const DEMO_DATES = {
    TODAY: '2025-12-31',
    YESTERDAY: '2025-12-30',
    LAST_7_DAYS_START: '2025-12-25',
    LAST_7_DAYS_END: '2025-12-31',
    LAST_30_DAYS_START: '2025-12-02',
    LAST_30_DAYS_END: '2025-12-31'
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
