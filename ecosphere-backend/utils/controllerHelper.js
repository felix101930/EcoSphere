// Controller Helper - Common controller patterns and utilities

const { sendError, sendDataWithMetadata } = require('./responseHelper');
const { validateDateRange, validateDateAvailability } = require('./validationHelper');
const { HTTP_STATUS } = require('./constants');

/**
 * Async handler wrapper - Catches errors automatically
 * Eliminates the need for try-catch in every controller function
 * 
 * @param {Function} fn - Async controller function
 * @returns {Function} Wrapped function with error handling
 * 
 * @example
 * const getUser = asyncHandler(async (req, res) => {
 *   const user = await UserService.findById(req.params.id);
 *   sendSuccess(res, user);
 * });
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch((error) => {
            console.error(`Error in ${fn.name}:`, error);
            sendError(res, HTTP_STATUS.SERVER_ERROR, error.message || 'Internal server error');
        });
    };
};

/**
 * Generic data fetcher with date range validation
 * Handles the common pattern: validate dates → fetch data → calculate metrics → respond
 * 
 * @param {Object} options - Configuration options
 * @param {Function} options.fetchDataFn - Function to fetch data (receives dateFrom, dateTo)
 * @param {Function} options.calculateMetricsFn - Function to calculate metrics (receives data)
 * @param {string} options.dataSource - Data source identifier
 * @param {Object} options.additionalMetadata - Additional metadata to include in response
 * @param {Object} options.dateAvailability - Optional date availability constraints { from, to }
 * @returns {Function} Express middleware function
 * 
 * @example
 * const getConsumptionData = createDataFetcher({
 *   fetchDataFn: ElectricityService.getConsumptionData,
 *   calculateMetricsFn: ElectricityService.calculateMetrics,
 *   dataSource: DATA_SOURCES.CONSUMPTION
 * });
 */
const createDataFetcher = ({
    fetchDataFn,
    calculateMetricsFn,
    dataSource,
    additionalMetadata = {},
    dateAvailability = null
}) => {
    return asyncHandler(async (req, res) => {
        const { dateFrom, dateTo } = req.params;

        // Validate date range format
        const validation = validateDateRange(dateFrom, dateTo);
        if (!validation.isValid) {
            return sendError(res, HTTP_STATUS.BAD_REQUEST, validation.error);
        }

        // Validate date availability if constraints provided
        if (dateAvailability) {
            const availabilityCheck = validateDateAvailability(
                dateFrom,
                dateTo,
                dateAvailability.from,
                dateAvailability.to
            );
            if (!availabilityCheck.isValid) {
                return sendError(
                    res,
                    HTTP_STATUS.BAD_REQUEST,
                    availabilityCheck.error,
                    availabilityCheck.availableRange
                );
            }
        }

        // Fetch data
        const data = await fetchDataFn(dateFrom, dateTo);

        // Calculate metrics
        const metrics = calculateMetricsFn(data);

        // Send response
        sendDataWithMetadata(res, {
            data,
            metadata: {
                dateFrom,
                dateTo,
                dataSource,
                count: data.length,
                metrics,
                ...additionalMetadata
            }
        });
    });
};

/**
 * Create a breakdown data fetcher (for multi-source data like phases, equipment)
 * Handles fetching multiple data sources and calculating metrics for each
 * 
 * @param {Object} options - Configuration options
 * @param {Function} options.fetchDataFn - Function to fetch breakdown data
 * @param {Function} options.calculateMetricsFn - Function to calculate metrics
 * @param {Object} options.dataSources - Map of data source identifiers
 * @param {Array<string>} options.dataKeys - Keys for the breakdown data (e.g., ['total', 'phaseA', 'phaseB'])
 * @param {string} options.warning - Optional warning message
 * @param {Object} options.dateAvailability - Optional date availability constraints
 * @returns {Function} Express middleware function
 */
const createBreakdownDataFetcher = ({
    fetchDataFn,
    calculateMetricsFn,
    dataSources,
    dataKeys,
    warning = null,
    dateAvailability = null
}) => {
    return asyncHandler(async (req, res) => {
        const { dateFrom, dateTo } = req.params;

        // Validate date range format
        const validation = validateDateRange(dateFrom, dateTo);
        if (!validation.isValid) {
            return sendError(res, HTTP_STATUS.BAD_REQUEST, validation.error);
        }

        // Validate date availability if constraints provided
        if (dateAvailability) {
            const availabilityCheck = validateDateAvailability(
                dateFrom,
                dateTo,
                dateAvailability.from,
                dateAvailability.to
            );
            if (!availabilityCheck.isValid) {
                return sendError(
                    res,
                    HTTP_STATUS.BAD_REQUEST,
                    availabilityCheck.error,
                    availabilityCheck.availableRange
                );
            }
        }

        // Fetch breakdown data
        const data = await fetchDataFn(dateFrom, dateTo);

        // Calculate metrics for each data key
        const metrics = {};
        dataKeys.forEach(key => {
            metrics[key] = calculateMetricsFn(data[key]);
        });

        // Send response
        sendDataWithMetadata(res, {
            data,
            metadata: {
                dateFrom,
                dateTo,
                dataSources,
                metrics,
                ...(warning && { warning })
            }
        });
    });
};

/**
 * Validate request parameters
 * Middleware to validate required parameters before controller execution
 * 
 * @param {Array<string>} requiredParams - Array of required parameter names
 * @returns {Function} Express middleware function
 * 
 * @example
 * router.get('/data/:dateFrom/:dateTo', 
 *   validateParams(['dateFrom', 'dateTo']), 
 *   getDataController
 * );
 */
const validateParams = (requiredParams) => {
    return (req, res, next) => {
        const missingParams = requiredParams.filter(param => !req.params[param]);

        if (missingParams.length > 0) {
            return sendError(
                res,
                HTTP_STATUS.BAD_REQUEST,
                `Missing required parameters: ${missingParams.join(', ')}`
            );
        }

        next();
    };
};

module.exports = {
    asyncHandler,
    createDataFetcher,
    createBreakdownDataFetcher,
    validateParams
};
