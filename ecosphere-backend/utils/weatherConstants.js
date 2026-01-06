// Weather API Constants
// Configuration for Open-Meteo weather data integration

/**
 * Calgary SAIT Solar Lab location
 * Address: 60 Fowler Dr NW, Calgary, AB T2M 0L4
 */
const LOCATION = {
    LATITUDE: 51.0947,
    LONGITUDE: -114.1094,
    TIMEZONE: 'America/Edmonton',
    NAME: 'Calgary, AB'
};

/**
 * Open-Meteo API endpoints
 */
const API_ENDPOINTS = {
    ARCHIVE: 'https://archive-api.open-meteo.com/v1/archive',
    FORECAST: 'https://api.open-meteo.com/v1/forecast'
};

/**
 * Weather variables to fetch
 * These are the most correlated with solar generation based on analysis
 */
const WEATHER_VARIABLES = {
    HOURLY: [
        'temperature_2m',           // Temperature at 2m (°C)
        'cloud_cover',              // Cloud cover (%)
        'shortwave_radiation',      // Total solar radiation (W/m²)
        'direct_radiation',         // Direct solar radiation (W/m²)
        'diffuse_radiation'         // Diffuse solar radiation (W/m²)
    ]
};

/**
 * Weather variable names for internal use
 */
const WEATHER_FIELDS = {
    TEMPERATURE: 'temperature_2m',
    CLOUD_COVER: 'cloud_cover',
    SHORTWAVE_RADIATION: 'shortwave_radiation',
    DIRECT_RADIATION: 'direct_radiation',
    DIFFUSE_RADIATION: 'diffuse_radiation'
};

/**
 * Training period for generation forecast model
 * Use last 60 days of historical data
 */
const TRAINING_PERIOD = {
    DAYS: 60,
    MIN_DAYS_REQUIRED: 30  // Minimum days needed for reliable model
};

/**
 * Forecast constraints
 */
const FORECAST_CONSTRAINTS = {
    MIN_DAYS: 1,
    MAX_DAYS: 30,
    DEFAULT_DAYS: 7
};

/**
 * Weather data aggregation types
 */
const AGGREGATION_TYPES = {
    SUM: 'sum',
    AVERAGE: 'avg',
    MAX: 'max',
    MIN: 'min'
};

/**
 * Model coefficients (will be calculated during training)
 * These are placeholders for the linear regression model:
 * generation = a * direct_radiation + b * temperature + c * (100 - cloud_cover) + d
 */
const MODEL_DEFAULTS = {
    COEFFICIENT_DIRECT_RADIATION: 0,
    COEFFICIENT_TEMPERATURE: 0,
    COEFFICIENT_CLOUD_COVER: 0,
    INTERCEPT: 0
};

/**
 * Error messages
 */
const WEATHER_ERROR_MESSAGES = {
    FETCH_FAILED: 'Failed to fetch weather data from Open-Meteo',
    INSUFFICIENT_DATA: 'Insufficient historical data for training',
    INVALID_DATE_RANGE: 'Invalid date range for weather data',
    API_ERROR: 'Weather API returned an error'
};

module.exports = {
    LOCATION,
    API_ENDPOINTS,
    WEATHER_VARIABLES,
    WEATHER_FIELDS,
    TRAINING_PERIOD,
    FORECAST_CONSTRAINTS,
    AGGREGATION_TYPES,
    MODEL_DEFAULTS,
    WEATHER_ERROR_MESSAGES
};
