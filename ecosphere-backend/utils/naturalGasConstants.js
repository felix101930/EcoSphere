// Natural Gas Constants - Configuration for natural gas data
const path = require('path');

const NATURAL_GAS_CONFIG = {
    // CSV file path
    CSV_FILE_PATH: path.join(__dirname, '../data/naturalGasReadings.csv'),

    // Data format
    DATE_FORMAT: 'MMMM d, yyyy',

    // Units
    UNIT: 'GJ', // Gigajoules

    // Cache TTL
    CACHE_TTL: 24 * 60 * 60 * 1000, // 24 hours (static data)

    // Forecast configuration
    FORECAST: {
        MIN_TRAINING_DAYS: 30,
        DEFAULT_FORECAST_DAYS: 30,
        MAX_FORECAST_DAYS: 90
    }
};

module.exports = {
    NATURAL_GAS_CONFIG
};
