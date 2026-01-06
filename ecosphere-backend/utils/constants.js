// Application Constants

// HTTP Status Codes
const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    SERVER_ERROR: 500
};

// Data Availability Ranges
const DATA_RANGES = {
    PHASE_BREAKDOWN: {
        FROM: '2020-11-01',
        TO: '2020-11-08',
        DESCRIPTION: 'Phase data only available for 7 days (2020-11-01 to 2020-11-08)'
    },
    SOLAR_BREAKDOWN: {
        FROM: '2020-11-01',
        TO: '2020-11-08',
        DESCRIPTION: 'Solar source data only available for 7 days (2020-11-01 to 2020-11-08). Unit is W (power), not Wh (energy). Only covers ~27% of total generation.'
    },
    EQUIPMENT_BREAKDOWN: {
        DESCRIPTION: 'Equipment data has different time ranges for different categories'
    }
};

// Data Source Information
const DATA_SOURCES = {
    CONSUMPTION: 'TL341',
    GENERATION: 'TL340',
    NET_ENERGY: 'TL339',
    PHASE: {
        TOTAL: 'TL342',
        PHASE_A: 'TL343',
        PHASE_B: 'TL344',
        PHASE_C: 'TL345'
    },
    EQUIPMENT: {
        PANEL_2A1: 'TL213 (2020-02-15 to 2020-11-08)',
        VENTILATION: 'TL4 (2020-11-01 to 2020-11-08)',
        LIGHTING: 'TL209 (2019-11-07 to 2019-11-14)',
        EQUIPMENT: 'TL211 (2019-11-07 to 2019-11-14)',
        APPLIANCES: 'TL212 (2019-11-07 to 2019-11-14)'
    },
    SOLAR: {
        CARPORT: 'TL252',
        ROOFTOP: 'TL253'
    }
};

// Error Messages
const ERROR_MESSAGES = {
    MISSING_DATE_PARAMS: 'Missing dateFrom or dateTo parameter',
    INVALID_DATE_FORMAT: 'Invalid date format. Expected YYYY-MM-DD',
    INVALID_DATE_RANGE: 'dateFrom must be less than or equal to dateTo',
    DATA_NOT_AVAILABLE: 'Data not available for the specified date range',
    FETCH_FAILED: 'Failed to fetch data',
    SERVER_ERROR: 'Internal server error'
};

module.exports = {
    HTTP_STATUS,
    DATA_RANGES,
    DATA_SOURCES,
    ERROR_MESSAGES
};
