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
