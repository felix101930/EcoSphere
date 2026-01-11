// Validation Helper - Common validation functions

/**
 * Validate date range parameters
 * @param {string} dateFrom - Start date (YYYY-MM-DD)
 * @param {string} dateTo - End date (YYYY-MM-DD)
 * @returns {Object} { isValid: boolean, error: string|null }
 */
const validateDateRange = (dateFrom, dateTo) => {
    if (!dateFrom || !dateTo) {
        return {
            isValid: false,
            error: 'Missing dateFrom or dateTo parameter'
        };
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateFrom) || !dateRegex.test(dateTo)) {
        return {
            isValid: false,
            error: 'Invalid date format. Expected YYYY-MM-DD'
        };
    }

    // Validate dateFrom <= dateTo
    if (dateFrom > dateTo) {
        return {
            isValid: false,
            error: 'dateFrom must be less than or equal to dateTo'
        };
    }

    return { isValid: true, error: null };
};

/**
 * Validate date is within available range
 * @param {string} dateFrom - Start date
 * @param {string} dateTo - End date
 * @param {string} availableFrom - Available start date
 * @param {string} availableTo - Available end date
 * @returns {Object} { isValid: boolean, error: string|null, availableRange: Object|null }
 */
const validateDateAvailability = (dateFrom, dateTo, availableFrom, availableTo) => {
    if (dateFrom < availableFrom || dateTo > availableTo) {
        return {
            isValid: false,
            error: `Data only available from ${availableFrom} to ${availableTo}`,
            availableRange: {
                from: availableFrom,
                to: availableTo
            }
        };
    }

    return { isValid: true, error: null, availableRange: null };
};

/**
 * Validate required fields
 * @param {Object} data - Data object to validate
 * @param {Array<string>} requiredFields - Array of required field names
 * @returns {Object} { isValid: boolean, error: string|null, missingFields: Array<string> }
 */
const validateRequiredFields = (data, requiredFields) => {
    const missingFields = requiredFields.filter(field => !data[field]);

    if (missingFields.length > 0) {
        return {
            isValid: false,
            error: `Missing required fields: ${missingFields.join(', ')}`,
            missingFields
        };
    }

    return { isValid: true, error: null, missingFields: [] };
};

module.exports = {
    validateDateRange,
    validateDateAvailability,
    validateRequiredFields
};
