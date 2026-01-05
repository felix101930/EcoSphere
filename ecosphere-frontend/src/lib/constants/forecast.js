// Forecast Constants

// Forecast periods
export const FORECAST_PERIODS = {
    SEVEN_DAYS: 7,
    FOURTEEN_DAYS: 14,
    THIRTY_DAYS: 30
};

// Forecast period labels
export const FORECAST_PERIOD_LABELS = {
    [FORECAST_PERIODS.SEVEN_DAYS]: '7 Days',
    [FORECAST_PERIODS.FOURTEEN_DAYS]: '14 Days',
    [FORECAST_PERIODS.THIRTY_DAYS]: '30 Days'
};

// Strategy names
export const STRATEGY_NAMES = {
    HOLT_WINTERS: 'Holt-Winters Seasonal Smoothing',
    SEASONAL_WEIGHTED: 'Weighted Seasonal Prediction',
    TREND_BASED: 'Trend-Based Prediction',
    MOVING_AVERAGE: 'Moving Average',
    INSUFFICIENT_DATA: 'Insufficient Data'
};

// Confidence thresholds
export const CONFIDENCE_THRESHOLDS = {
    EXCELLENT: 90,
    GOOD: 75,
    ACCEPTABLE: 60,
    LOW: 50
};

// Confidence labels
export const CONFIDENCE_LABELS = {
    EXCELLENT: 'Excellent',
    GOOD: 'Good',
    ACCEPTABLE: 'Acceptable',
    LOW: 'Low',
    INSUFFICIENT: 'Insufficient'
};

// Chart colors
export const FORECAST_COLORS = {
    ACTUAL: '#005EB8',        // SAIT Blue
    PREDICTED: '#DA291C',     // SAIT Red
    CONFIDENCE_AREA: 'rgba(218, 41, 28, 0.1)'  // Light red
};

// Default demo dates (based on available data)
export const DEFAULT_DEMO_DATES = {
    TARGET_DATE: '2020-11-07',  // Predict from Nov 8
    FORECAST_DAYS: 7
};

// UI dimensions
export const CARD_HEIGHT = 270;
export const CHART_HEIGHT = 400;

// Algorithm tiers configuration
export const ALGORITHM_TIERS = [
    {
        tier: 1,
        strategy: 'HOLT_WINTERS',
        name: 'Holt-Winters',
        stars: '★★★★★',
        features: [
            'Industry standard method',
            'Exponential smoothing',
            'Weekly seasonality'
        ],
        requirements: [
            '1 year historical data',
            '70% data completeness'
        ]
    },
    {
        tier: 2,
        strategy: 'SEASONAL_WEIGHTED',
        name: 'Seasonal Weighted',
        stars: '★★★★☆',
        features: [
            '30% last year data',
            '50% last week data',
            '20% 30-day average'
        ],
        requirements: [
            'Last year same period',
            'Recent 30 days data'
        ]
    },
    {
        tier: 3,
        strategy: 'TREND_BASED',
        name: 'Trend-Based',
        stars: '★★★☆☆',
        features: [
            'Linear trend analysis',
            'No seasonality',
            'Recent pattern only'
        ],
        requirements: [
            'Recent 30 days data'
        ]
    },
    {
        tier: 4,
        strategy: 'MOVING_AVERAGE',
        name: 'Moving Average',
        stars: '★★☆☆☆',
        features: [
            'Simple average',
            'Baseline method',
            'No trend/seasonality'
        ],
        requirements: [
            'Recent 7 days data'
        ]
    }
];
