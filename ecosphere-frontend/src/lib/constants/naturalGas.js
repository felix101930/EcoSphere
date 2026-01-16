// Natural Gas Constants - Configuration for natural gas module

export const TAB_TYPES = {
    CONSUMPTION: 'CONSUMPTION',
    FORECAST: 'FORECAST'
};

export const CHART_COLORS = {
    PRIMARY: '#2E7D32', // Green for natural gas
    SECONDARY: '#1976D2'
};

// Time presets for monthly data
export const TIME_PRESETS = {
    THIS_YEAR: 'this_year',
    LAST_YEAR: 'last_year',
    ALL_DATA: 'all_data',
    CUSTOM: 'custom'
};

export const TIME_PRESET_LABELS = {
    [TIME_PRESETS.THIS_YEAR]: 'This Year',
    [TIME_PRESETS.LAST_YEAR]: 'Last Year',
    [TIME_PRESETS.ALL_DATA]: 'All Data',
    [TIME_PRESETS.CUSTOM]: 'Custom Range'
};

// Get date range for preset
export const getPresetDateRange = (preset) => {
    const now = new Date();
    const currentYear = now.getFullYear();

    switch (preset) {
        case TIME_PRESETS.THIS_YEAR:
            return {
                dateFrom: new Date(currentYear, 0, 1),
                dateTo: new Date(currentYear, 11, 31)
            };
        case TIME_PRESETS.LAST_YEAR:
            return {
                dateFrom: new Date(currentYear - 1, 0, 1),
                dateTo: new Date(currentYear - 1, 11, 31)
            };
        case TIME_PRESETS.ALL_DATA:
            return {
                dateFrom: new Date('2023-01-01'),
                dateTo: new Date('2025-12-31')
            };
        default:
            return null;
    }
};

// Data configuration
export const DATA_CONFIG = {
    SOURCE: 'CSV File (Monthly Readings)',
    UNIT: 'GJ',
    UNIT_LABEL: 'Gigajoules',
    DATE_RANGE_DISPLAY: 'Jan 2023 to Dec 2025',
    MIN_DATE: '2023-01-01',
    MAX_DATE: '2025-12-31'
};

// Metrics configuration
export const METRICS_CONFIG = [
    {
        key: 'total',
        label: 'Total Usage',
        unit: 'GJ',
        color: '#2E7D32'
    },
    {
        key: 'average',
        label: 'Average Monthly',
        unit: 'GJ',
        color: '#1976D2'
    },
    {
        key: 'peak',
        label: 'Peak Month',
        unit: 'GJ',
        color: '#D32F2F'
    },
    {
        key: 'min',
        label: 'Lowest Month',
        unit: 'GJ',
        color: '#388E3C'
    }
];
