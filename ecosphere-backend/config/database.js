// Database Configuration and Constants
// Centralized configuration to eliminate magic strings and numbers

const fs = require("fs");

// Database connection configuration
const DB_CONFIG = {
  // Use single backslash here - we'll handle escaping in buildSqlcmdCommand
  SERVER: process.env.DB_SERVER || ".\\SQLEXPRESS",
  DATABASE: process.env.DB_DATABASE || "EcoSphereData", // Default to new database
  USER: process.env.DB_USER,
  PASSWORD: process.env.DB_PASSWORD,
  AUTH_WINDOWS: "-E",
  TRUST_CERTIFICATE: "-C", // Required for ODBC Driver 18
};

// SQL Server table name constants
const TABLE_PREFIX = "SaitSolarLab_";
const TABLE_NAMESPACE = "30000_";

const TABLE_NAMES = {
  // Thermal sensors
  THERMAL_DEFAULT: "20004_TL2",

  // Electricity - Primary (Hourly Increment)
  CONSUMPTION: `${TABLE_PREFIX}${TABLE_NAMESPACE}TL341`,
  GENERATION: `${TABLE_PREFIX}${TABLE_NAMESPACE}TL340`,
  NET_ENERGY: `${TABLE_PREFIX}${TABLE_NAMESPACE}TL339`,

  // Electricity - Phase Breakdown (1-min intervals)
  PHASE_TOTAL: `${TABLE_PREFIX}${TABLE_NAMESPACE}TL342`,
  PHASE_A: `${TABLE_PREFIX}${TABLE_NAMESPACE}TL343`,
  PHASE_B: `${TABLE_PREFIX}${TABLE_NAMESPACE}TL344`,
  PHASE_C: `${TABLE_PREFIX}${TABLE_NAMESPACE}TL345`,

  // Electricity - Equipment Breakdown
  PANEL_2A1: `${TABLE_PREFIX}${TABLE_NAMESPACE}TL213`,
  VENTILATION: `${TABLE_PREFIX}${TABLE_NAMESPACE}TL4`,
  LIGHTING: `${TABLE_PREFIX}${TABLE_NAMESPACE}TL209`,
  EQUIPMENT: `${TABLE_PREFIX}${TABLE_NAMESPACE}TL211`,
  APPLIANCES: `${TABLE_PREFIX}${TABLE_NAMESPACE}TL212`,

  // Electricity - Solar Source
  SOLAR_CARPORT: `${TABLE_PREFIX}${TABLE_NAMESPACE}TL252`,
  SOLAR_ROOFTOP: `${TABLE_PREFIX}${TABLE_NAMESPACE}TL253`,

  // Water - Rainwater and Hot Water
  RAINWATER_LEVEL: `${TABLE_PREFIX}20000_TL93`,
  HOT_WATER_CONSUMPTION: `${TABLE_PREFIX}${TABLE_NAMESPACE}TL210`,
};

// Query constants
const QUERY_CONSTANTS = {
  // Output filtering
  ROWS_AFFECTED: "rows affected",
  SQL_ERROR_PREFIX: "Msg ",
  NULL_VALUE: "NULL",

  // CSV format
  CSV_DELIMITER: ",",

  // sqlcmd parameters
  SQLCMD_PARAMS: '-s "," -W -h -1 -f 65001',

  // Array length checks
  MIN_PARTS_BASIC: 2,
  MIN_PARTS_WITH_SEQ: 3,
  MIN_PARTS_AGGREGATED: 6,
};

// Time-related constants
const TIME_CONSTANTS = {
  // Hours
  HOUR_START: 0,
  HOUR_END: 23,

  // Minutes
  MINUTE_START: 0,
  MINUTE_END: 45,

  // Records per day (15-minute intervals)
  RECORDS_PER_COMPLETE_DAY: 96,
};

// Fallback values
const FALLBACK_VALUES = {
  DEFAULT_DATE: "2025-12-31",
  DEFAULT_LIMIT: 10,
};

// sqlcmd executable paths (in priority order)
const SQLCMD_PATHS = [
  'C:\\Program Files\\Microsoft SQL Server\\Client SDK\\ODBC\\180\\Tools\\Binn\\SQLCMD.EXE',
  'C:\\Program Files\\Microsoft SQL Server\\Client SDK\\ODBC\\170\\Tools\\Binn\\sqlcmd.exe',
  'C:\\Program Files\\Microsoft SQL Server\\160\\Tools\\Binn\\sqlcmd.exe',
  'C:\\Program Files\\Microsoft SQL Server\\Client SDK\\ODBC\\130\\Tools\\Binn\\sqlcmd.exe',
  'sqlcmd' // fallback to PATH
];

/**
 * Find sqlcmd executable path
 * Checks predefined paths in order and returns the first one that exists
 * @returns {string} Path to sqlcmd executable
 */
function getSqlcmdPath() {
  for (const path of SQLCMD_PATHS) {
    if (path === 'sqlcmd' || fs.existsSync(path)) {
      return path;
    }
  }
  return 'sqlcmd'; // fallback
}

/**
 * Build authentication parameters for sqlcmd
 * @returns {string} Authentication parameters
 */
function getAuthParams() {
  if (DB_CONFIG.USER && DB_CONFIG.PASSWORD) {
    return `-U ${DB_CONFIG.USER} -P ${DB_CONFIG.PASSWORD}`;
  }
  return DB_CONFIG.AUTH_WINDOWS;
}

/**
 * Build full table name with prefix if needed
 * @param {string} tableName - Table name or sensor ID
 * @returns {string} Full table name
 */
function getFullTableName(tableName) {
  return tableName.startsWith(TABLE_PREFIX)
    ? tableName
    : `${TABLE_PREFIX}${tableName}`;
}

/**
 * Build sqlcmd command
 * @param {string} query - SQL query to execute
 * @returns {string} Complete sqlcmd command
 */
function buildSqlcmdCommand(query) {
  const sqlcmdPath = getSqlcmdPath();
  const authParams = getAuthParams();

  return `"${sqlcmdPath}" -S ${DB_CONFIG.SERVER} ${authParams} -d ${DB_CONFIG.DATABASE} ${DB_CONFIG.TRUST_CERTIFICATE} -Q "${query}" ${QUERY_CONSTANTS.SQLCMD_PARAMS}`;
}

/**
 * Filter output lines from sqlcmd
 * @param {string} stdout - Raw output from sqlcmd
 * @returns {string[]} Filtered lines
 */
function filterOutputLines(stdout) {
  return stdout
    .trim()
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      return (
        trimmed &&
        !trimmed.includes(QUERY_CONSTANTS.ROWS_AFFECTED) &&
        !trimmed.includes(QUERY_CONSTANTS.SQL_ERROR_PREFIX) &&
        !trimmed.startsWith("(")
      );
    });
}

module.exports = {
  DB_CONFIG,
  TABLE_PREFIX,
  TABLE_NAMES,
  QUERY_CONSTANTS,
  TIME_CONSTANTS,
  FALLBACK_VALUES,
  getSqlcmdPath,
  getAuthParams,
  getFullTableName,
  buildSqlcmdCommand,
  filterOutputLines,
};
