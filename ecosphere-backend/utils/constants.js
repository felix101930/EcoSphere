/**
 * Application Constants
 * 
 * Centralized configuration for HTTP status codes, data availability ranges,
 * data source information, and error messages used across the application.
 * 
 * These constants ensure consistency and make it easy to update values
 * in one place rather than scattered throughout the codebase.
 */

/**
 * HTTP Status Codes
 * 
 * Standard HTTP response status codes used throughout the API
 * Following REST API best practices for consistent error handling
 * 
 * Usage: res.status(HTTP_STATUS.OK).json(data)
 */
const HTTP_STATUS = {
    OK: 200,              // Request succeeded, returning data
    CREATED: 201,         // Resource created successfully (POST)
    NO_CONTENT: 204,      // Request succeeded, no data to return (DELETE)
    BAD_REQUEST: 400,     // Invalid request parameters or body
    UNAUTHORIZED: 401,    // Authentication required or failed
    FORBIDDEN: 403,       // Authenticated but not authorized
    NOT_FOUND: 404,       // Resource doesn't exist
    CONFLICT: 409,        // Resource already exists (duplicate)
    SERVER_ERROR: 500     // Internal server error
};

/**
 * Data Availability Ranges
 * 
 * Defines the date ranges for which different types of data are available
 * These ranges are based on actual sensor data in the database
 * Used to validate date range requests and show disclaimers to users
 * 
 * IMPORTANT: These ranges are FIXED and represent historical data limitations
 * They do NOT change as new data is added (new data uses different sensors)
 */
const DATA_RANGES = {
    /**
     * Phase Breakdown Data (3-phase electrical distribution)
     * 
     * Available from 2019-03-30 to 2025-12-31
     * Phase monitoring data with 1-minute intervals
     * Tracks electrical load distribution across three phases
     */
    PHASE_BREAKDOWN: {
        FROM: '2019-03-30',
        TO: '2025-12-31',
        DESCRIPTION: 'Phase data available from 2019-03-30 to 2025-12-31'
    },

    /**
     * Solar Source Breakdown Data (carport vs rooftop)
     * 
     * Available from 2019-03-08 to 2025-12-31
     * Shows breakdown of solar generation by source
     * 
     * LIMITATIONS:
     * - Data is in Watts (W) not Watt-hours (Wh)
     * - Only covers ~27% of total generation
     * - Missing data for other solar panels
     */
    SOLAR_BREAKDOWN: {
        FROM: '2019-03-08',
        TO: '2025-12-31',
        DESCRIPTION: 'Solar source data available from 2019-03-08 to 2025-12-31. Unit is W (power), not Wh (energy). Only covers ~27% of total generation.'
    },

    /**
     * Equipment Breakdown Data (by equipment type)
     * 
     * See DATA_SOURCES.EQUIPMENT for specific ranges per category
     */
    EQUIPMENT_BREAKDOWN: {
        DESCRIPTION: 'Equipment breakdown by type'
    }
};

/**
 * Data Source Information
 * 
 * Maps data types to their sensor IDs and availability periods
 * Sensor IDs (e.g., TL341) correspond to physical sensors in the building
 * Used for documentation and debugging data issues
 * 
 * Format: 'SensorID (date range if limited)'
 */
const DATA_SOURCES = {
    // Main electricity metrics (always available)
    CONSUMPTION: 'TL341',  // Total building electricity consumption
    GENERATION: 'TL340',   // Total solar generation
    NET_ENERGY: 'TL339',   // Net energy (consumption - generation)

    /**
     * Phase breakdown sensors (3-phase electrical system)
     * 
     * Tracks electrical load distribution across three phases
     * Helps identify phase imbalance issues
     * Only available 2020-11-01 to 2020-11-08
     */
    PHASE: {
        TOTAL: 'TL342',    // Total across all phases (verification)
        PHASE_A: 'TL343',  // Phase A load
        PHASE_B: 'TL344',  // Phase B load
        PHASE_C: 'TL345'   // Phase C load
    },

    /**
     * Equipment breakdown sensors (by equipment type)
     * 
     * Each sensor tracks a specific equipment category
     * All equipment data extends from 2018 to 2025-12-31
     */
    EQUIPMENT: {
        PANEL_2A1: 'TL213 (2018-10-22 to 2025-12-31)',      // Main electrical panel
        VENTILATION: 'TL4 (2018-10-13 to 2025-12-31)',      // HVAC ventilation system
        LIGHTING: 'TL209 (2018-12-14 to 2025-12-31)',       // Building lighting
        EQUIPMENT: 'TL211 (2018-12-14 to 2025-12-31)',      // General equipment
        APPLIANCES: 'TL212 (2018-12-14 to 2025-12-31)'      // Kitchen/office appliances
    },

    /**
     * Solar generation breakdown sensors (by source)
     * 
     * Tracks solar generation from different panel locations
     * Available from 2019-03-08 to 2025-12-31
     * Data is in Watts (instantaneous power) not Wh (energy)
     */
    SOLAR: {
        CARPORT: 'TL252',   // Solar panels on carport structure
        ROOFTOP: 'TL253'    // Solar panels on building roof
    }
};

/**
 * Error Messages
 * 
 * Standardized error messages for common validation failures
 * Using constants ensures consistent error messages across all endpoints
 * Makes it easier to update messages and support internationalization
 * 
 * Usage: throw new Error(ERROR_MESSAGES.MISSING_DATE_PARAMS)
 */
const ERROR_MESSAGES = {
    // Date validation errors
    MISSING_DATE_PARAMS: 'Missing dateFrom or dateTo parameter',
    INVALID_DATE_FORMAT: 'Invalid date format. Expected YYYY-MM-DD',
    INVALID_DATE_RANGE: 'dateFrom must be less than or equal to dateTo',

    // Data availability errors
    DATA_NOT_AVAILABLE: 'Data not available for the specified date range',

    // Generic errors
    FETCH_FAILED: 'Failed to fetch data',
    SERVER_ERROR: 'Internal server error'
};

module.exports = {
    HTTP_STATUS,
    DATA_RANGES,
    DATA_SOURCES,
    ERROR_MESSAGES
};
