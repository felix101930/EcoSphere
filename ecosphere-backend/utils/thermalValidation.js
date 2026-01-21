// Thermal-specific validation functions
const { THERMAL_CONSTRAINTS, THERMAL_ERROR_MESSAGES } = require('./thermalConstants');

/**
 * Validate that required parameters exist
 * @param {Object} params - Parameters to validate
 * @param {Array<string>} requiredFields - Array of required field names
 * @returns {Object} { isValid: boolean, error: string|null }
 */
const validateRequiredParams = (params, requiredFields) => {
    const missingFields = requiredFields.filter(field => !params[field]);

    if (missingFields.length > 0) {
        return {
            isValid: false,
            error: `Missing required parameters: ${missingFields.join(', ')}`
        };
    }

    return { isValid: true, error: null };
};

/**
 * Validate date range does not exceed maximum allowed days
 * @param {string} dateFrom - Start date (YYYY-MM-DD)
 * @param {string} dateTo - End date (YYYY-MM-DD)
 * @returns {Object} { isValid: boolean, error: string|null, days: number }
 */
const validateDateRangeLimit = (dateFrom, dateTo) => {
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    const diffDays = Math.ceil((to - from) / THERMAL_CONSTRAINTS.MILLISECONDS_PER_DAY) + 1;

    if (diffDays > THERMAL_CONSTRAINTS.MAX_DATE_RANGE_DAYS) {
        return {
            isValid: false,
            error: THERMAL_ERROR_MESSAGES.DATE_RANGE_EXCEEDED,
            days: diffDays
        };
    }

    return {
        isValid: true,
        error: null,
        days: diffDays
    };
};

/**
 * Parse sensor IDs from query string
 * @param {string|undefined} sensorsQuery - Comma-separated sensor IDs
 * @param {Array<string>} defaultSensors - Default sensor list if not provided
 * @returns {Array<string>} Array of sensor IDs
 */
const parseSensorIds = (sensorsQuery, defaultSensors) => {
    if (!sensorsQuery) {
        return defaultSensors;
    }

    return sensorsQuery.split(',').map(id => id.trim()).filter(id => id.length > 0);
};

module.exports = {
    validateRequiredParams,
    validateDateRangeLimit,
    parseSensorIds
};
