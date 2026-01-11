// Response Helper - Standardized API response formatting

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Optional success message
 * @param {number} statusCode - HTTP status code (default: 200)
 */
const sendSuccess = (res, data, message = null, statusCode = 200) => {
    const response = {
        success: true,
        data
    };

    if (message) {
        response.message = message;
    }

    res.status(statusCode).json(response);
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} error - Error message
 * @param {Object} details - Optional error details
 */
const sendError = (res, statusCode, error, details = null) => {
    const response = {
        success: false,
        error
    };

    if (details) {
        response.details = details;
    }

    res.status(statusCode).json(response);
};

/**
 * Send data with metadata
 * @param {Object} res - Express response object
 * @param {Object} options - Response options
 * @param {*} options.data - Response data
 * @param {Object} options.metadata - Additional metadata
 * @param {string} options.message - Optional message
 * @param {number} options.statusCode - HTTP status code (default: 200)
 */
const sendDataWithMetadata = (res, { data, metadata, message = null, statusCode = 200 }) => {
    const response = {
        success: true,
        ...metadata,
        data
    };

    if (message) {
        response.message = message;
    }

    res.status(statusCode).json(response);
};

module.exports = {
    sendSuccess,
    sendError,
    sendDataWithMetadata
};
