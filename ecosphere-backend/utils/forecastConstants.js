// Forecast Service Constants

module.exports = {
    // Time periods
    HOURS_PER_DAY: 24,
    DAYS_PER_WEEK: 7,
    DAYS_PER_MONTH: 30,
    DAYS_PER_YEAR: 365,

    // Data completeness thresholds
    MIN_HOURS_FOR_COMPLETE_DAY: 20,
    MIN_COMPLETENESS_SCORE: 70,
    MIN_DATA_AVAILABILITY: 0.5,
    GAP_THRESHOLD_HOURS: 24,
    MAX_MISSING_PERIODS: 5,

    // Forecast periods
    SHORT_TERM_DAYS: 7,
    MEDIUM_TERM_DAYS: 30,

    // Algorithm confidence scores
    CONFIDENCE: {
        TIER_1_HOLT_WINTERS: 90,
        TIER_2_SEASONAL: 80,
        TIER_3_TREND: 65,
        TIER_4_MOVING_AVG: 50,
        INSUFFICIENT: 0
    },

    // Accuracy ratings
    ACCURACY: {
        TIER_1: '★★★★★',
        TIER_2: '★★★★☆',
        TIER_3: '★★★☆☆',
        TIER_4: '★★☆☆☆',
        INSUFFICIENT: 'Cannot Predict'
    },

    // Algorithm names
    ALGORITHM_NAMES: {
        HOLT_WINTERS: 'Holt-Winters Seasonal Smoothing',
        SEASONAL_WEIGHTED: 'Weighted Seasonal Prediction',
        TREND_BASED: 'Trend-Based Prediction',
        MOVING_AVERAGE: 'Moving Average',
        INSUFFICIENT_DATA: 'Insufficient Data'
    },

    // Strategy identifiers
    STRATEGY: {
        HOLT_WINTERS: 'HOLT_WINTERS',
        SEASONAL_WEIGHTED: 'SEASONAL_WEIGHTED',
        TREND_BASED: 'TREND_BASED',
        MOVING_AVERAGE: 'MOVING_AVERAGE',
        INSUFFICIENT_DATA: 'INSUFFICIENT_DATA'
    },

    // Tier 2 seasonal weights
    SEASONAL_WEIGHTS: {
        LAST_YEAR: 0.3,
        LAST_WEEK: 0.5,
        RECENT_AVERAGE: 0.2
    },

    // Holt-Winters parameters
    HOLT_WINTERS: {
        ALPHA: 0.5,      // Level smoothing
        BETA: 0.4,       // Trend smoothing
        GAMMA: 0.3       // Seasonal smoothing
    },

    // Time conversion constants
    MS_PER_HOUR: 1000 * 60 * 60,
    MS_PER_DAY: 1000 * 60 * 60 * 24,

    // Warning messages
    WARNINGS: {
        TIER_2: 'Some historical data missing, using simplified seasonal algorithm',
        TIER_3: 'Missing last year data, prediction based on recent trend only',
        TIER_4: 'Insufficient historical data, using basic moving average with low accuracy',
        INSUFFICIENT: 'Insufficient historical data (less than 7 days), cannot generate reliable prediction'
    }
};
