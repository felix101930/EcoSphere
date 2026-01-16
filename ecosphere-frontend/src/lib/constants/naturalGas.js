// Natural Gas Constants - Configuration for natural gas module

export const TAB_TYPES = {
    CONSUMPTION: 'CONSUMPTION',
    FORECAST: 'FORECAST'
};

export const CHART_COLORS = {
    PRIMARY: '#2E7D32', // Green for natural gas
    SECONDARY: '#1976D2',
    FORECAST: '#FF9800' // Orange for forecast
};

// Time presets for monthly data
export const TIME_PRESETS = {
    THIS_YEAR: 'this_year',
    LAST_YEAR: 'last_year',
    ALL_YEARS: 'all_years',
    CUSTOM: 'custom'
};

export const TIME_PRESET_LABELS = {
    [TIME_PRESETS.THIS_YEAR]: 'This Year',
    [TIME_PRESETS.LAST_YEAR]: 'Last Year',
    [TIME_PRESETS.ALL_YEARS]: 'All Years',
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
        case TIME_PRESETS.ALL_YEARS:
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

// Forecast periods (in months)
export const FORECAST_PERIODS = {
    THREE_MONTHS: 3,
    SIX_MONTHS: 6,
    TWELVE_MONTHS: 12
};

export const FORECAST_PERIOD_LABELS = {
    [FORECAST_PERIODS.THREE_MONTHS]: '3 Months',
    [FORECAST_PERIODS.SIX_MONTHS]: '6 Months',
    [FORECAST_PERIODS.TWELVE_MONTHS]: '12 Months'
};

// Algorithm tiers configuration for Natural Gas (3-Tier System)
export const ALGORITHM_TIERS = [
    {
        tier: 1,
        strategy: 'SEASONAL_WEIGHTED',
        name: 'Seasonal Weighted',
        stars: '★★★★☆',
        confidence: 75,
        features: [
            '40% last year same month',
            '40% two years ago same month',
            '20% recent 3-month average'
        ],
        requirements: [
            '24+ months historical data',
            'Two years of seasonal patterns'
        ],
        formula: 'Y = 0.4×LastYear + 0.4×TwoYearsAgo + 0.2×Recent3MonthAvg',
        description: 'Weighted average combining last year\'s same month (seasonal pattern), two years ago same month (long-term pattern), and recent 3-month average (current trend). Optimized for monthly natural gas data with strong seasonal variations.'
    },
    {
        tier: 2,
        strategy: 'TREND_BASED',
        name: 'Trend-Based',
        stars: '★★★☆☆',
        confidence: 60,
        features: [
            'Linear regression on 6 months',
            'Trend extrapolation',
            'No seasonality considered'
        ],
        requirements: [
            '6+ months historical data'
        ],
        formula: 'Y = a×t + b (linear regression)',
        description: 'Simple linear regression on recent 6 months of data. Calculates slope (a) and intercept (b) to project future trend. Best for short-term predictions when full seasonal data is unavailable.'
    },
    {
        tier: 3,
        strategy: 'MOVING_AVERAGE',
        name: 'Moving Average',
        stars: '★★☆☆☆',
        confidence: 45,
        features: [
            'Simple 3-month average',
            'Baseline method',
            'No trend or seasonality'
        ],
        requirements: [
            '3+ months historical data'
        ],
        formula: 'Y = (Σ last 3 months) / 3',
        description: 'Simple average of last 3 months. Assumes future will match recent average. Fallback method when insufficient data for more sophisticated algorithms. Provides basic prediction baseline.'
    }
];

// UI dimensions
export const CARD_HEIGHT = 260;
export const CHART_HEIGHT = 400;
