// Thermal-specific constants
// Centralized constants for thermal sensor data management

/**
 * Default thermal sensor IDs
 */
const DEFAULT_SENSORS = {
    PRIMARY: '20004_TL2',
    SECONDARY: '20005_TL2',
    TERTIARY: '20006_TL2'
};

/**
 * Get array of all default sensor IDs
 */
const DEFAULT_SENSOR_LIST = [
    DEFAULT_SENSORS.PRIMARY,
    DEFAULT_SENSORS.SECONDARY,
    DEFAULT_SENSORS.TERTIARY
];

/**
 * Thermal data constraints
 */
const THERMAL_CONSTRAINTS = {
    MAX_DATE_RANGE_DAYS: 30,
    MILLISECONDS_PER_DAY: 1000 * 60 * 60 * 24
};

/**
 * Thermal response field names
 */
const THERMAL_RESPONSE_FIELDS = {
    SUCCESS: 'success',
    DATES: 'dates',
    DATE: 'date',
    SENSOR_ID: 'sensorId',
    SENSORS: 'sensors',
    DATA: 'data',
    COUNT: 'count',
    DATE_FROM: 'dateFrom',
    DATE_TO: 'dateTo',
    DAYS: 'days',
    ERROR: 'error'
};

/**
 * Thermal error messages
 */
const THERMAL_ERROR_MESSAGES = {
    MISSING_SENSOR_DATE: 'Missing sensorId or date parameter',
    MISSING_DATE: 'Missing date parameter',
    MISSING_DATE_RANGE: 'Missing dateFrom or dateTo parameter',
    DATE_RANGE_EXCEEDED: 'Date range cannot exceed 30 days',
    FETCH_DATES_FAILED: 'Failed to fetch available dates',
    FETCH_LAST_DATE_FAILED: 'Failed to fetch last complete date',
    FETCH_DAILY_DATA_FAILED: 'Failed to fetch daily data',
    FETCH_MULTIPLE_SENSORS_FAILED: 'Failed to fetch multiple sensors data',
    FETCH_AGGREGATED_FAILED: 'Failed to fetch aggregated data'
};

/**
 * Query parameter names
 */
const THERMAL_QUERY_PARAMS = {
    SENSOR_ID: 'sensorId',
    SENSORS: 'sensors',
    SENSOR_DELIMITER: ','
};

module.exports = {
    DEFAULT_SENSORS,
    DEFAULT_SENSOR_LIST,
    THERMAL_CONSTRAINTS,
    THERMAL_RESPONSE_FIELDS,
    THERMAL_ERROR_MESSAGES,
    THERMAL_QUERY_PARAMS
};
