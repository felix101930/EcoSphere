// Thermal Controller - Handle thermal data requests
const ThermalService = require('../services/thermalService');
const { sendError } = require('../utils/responseHelper');
const { HTTP_STATUS } = require('../utils/constants');
const { asyncHandler } = require('../utils/controllerHelper');
const {
  DEFAULT_SENSORS,
  DEFAULT_SENSOR_LIST,
  THERMAL_RESPONSE_FIELDS,
  THERMAL_ERROR_MESSAGES,
  THERMAL_QUERY_PARAMS
} = require('../utils/thermalConstants');
const {
  validateRequiredParams,
  validateDateRangeLimit,
  parseSensorIds
} = require('../utils/thermalValidation');

/**
 * Get available dates with data for a sensor
 */
const getAvailableDates = asyncHandler(async (req, res) => {
  const sensorId = req.query[THERMAL_QUERY_PARAMS.SENSOR_ID] || DEFAULT_SENSORS.PRIMARY;
  const dates = await ThermalService.getAvailableDates(sensorId);

  res.json({
    [THERMAL_RESPONSE_FIELDS.SUCCESS]: true,
    [THERMAL_RESPONSE_FIELDS.DATES]: dates
  });
});

/**
 * Get last complete date with full day of data
 */
const getLastCompleteDate = asyncHandler(async (req, res) => {
  const sensorId = req.query[THERMAL_QUERY_PARAMS.SENSOR_ID] || DEFAULT_SENSORS.PRIMARY;
  const date = await ThermalService.getLastCompleteDate(sensorId);

  res.json({
    [THERMAL_RESPONSE_FIELDS.SUCCESS]: true,
    [THERMAL_RESPONSE_FIELDS.DATE]: date
  });
});

/**
 * Get daily data for a single sensor (96 records per day)
 */
const getDailyData = asyncHandler(async (req, res) => {
  const { sensorId, date } = req.params;

  // Validate required parameters
  const validation = validateRequiredParams({ sensorId, date }, ['sensorId', 'date']);
  if (!validation.isValid) {
    return sendError(res, HTTP_STATUS.BAD_REQUEST, THERMAL_ERROR_MESSAGES.MISSING_SENSOR_DATE);
  }

  const data = await ThermalService.getDailyData(sensorId, date);

  res.json({
    [THERMAL_RESPONSE_FIELDS.SUCCESS]: true,
    [THERMAL_RESPONSE_FIELDS.SENSOR_ID]: sensorId,
    [THERMAL_RESPONSE_FIELDS.DATE]: date,
    [THERMAL_RESPONSE_FIELDS.COUNT]: data.length,
    [THERMAL_RESPONSE_FIELDS.DATA]: data
  });
});

/**
 * Get daily data for multiple sensors
 */
const getMultipleSensorsDailyData = asyncHandler(async (req, res) => {
  const { date } = req.params;

  // Validate required parameters
  const validation = validateRequiredParams({ date }, ['date']);
  if (!validation.isValid) {
    return sendError(res, HTTP_STATUS.BAD_REQUEST, THERMAL_ERROR_MESSAGES.MISSING_DATE);
  }

  // Parse sensor IDs from query or use defaults
  const sensorIds = parseSensorIds(
    req.query[THERMAL_QUERY_PARAMS.SENSORS],
    DEFAULT_SENSOR_LIST
  );

  const data = await ThermalService.getMultipleSensorsDailyData(sensorIds, date);

  res.json({
    [THERMAL_RESPONSE_FIELDS.SUCCESS]: true,
    [THERMAL_RESPONSE_FIELDS.DATE]: date,
    [THERMAL_RESPONSE_FIELDS.SENSORS]: sensorIds,
    [THERMAL_RESPONSE_FIELDS.DATA]: data
  });
});

/**
 * Get aggregated data for multiple sensors (date range)
 * Returns high/low/avg/open/close per day for each sensor
 */
const getMultipleSensorsAggregatedData = asyncHandler(async (req, res) => {
  const { dateFrom, dateTo } = req.params;

  // Validate required parameters
  const paramValidation = validateRequiredParams({ dateFrom, dateTo }, ['dateFrom', 'dateTo']);
  if (!paramValidation.isValid) {
    return sendError(res, HTTP_STATUS.BAD_REQUEST, THERMAL_ERROR_MESSAGES.MISSING_DATE_RANGE);
  }

  // Validate date range limit
  const rangeValidation = validateDateRangeLimit(dateFrom, dateTo);
  if (!rangeValidation.isValid) {
    return sendError(res, HTTP_STATUS.BAD_REQUEST, rangeValidation.error);
  }

  // Parse sensor IDs from query or use defaults
  const sensorIds = parseSensorIds(
    req.query[THERMAL_QUERY_PARAMS.SENSORS],
    DEFAULT_SENSOR_LIST
  );

  const data = await ThermalService.getMultipleSensorsAggregatedData(sensorIds, dateFrom, dateTo);

  res.json({
    [THERMAL_RESPONSE_FIELDS.SUCCESS]: true,
    [THERMAL_RESPONSE_FIELDS.DATE_FROM]: dateFrom,
    [THERMAL_RESPONSE_FIELDS.DATE_TO]: dateTo,
    [THERMAL_RESPONSE_FIELDS.DAYS]: rangeValidation.days,
    [THERMAL_RESPONSE_FIELDS.SENSORS]: sensorIds,
    [THERMAL_RESPONSE_FIELDS.DATA]: data
  });
});

module.exports = {
  getAvailableDates,
  getLastCompleteDate,
  getDailyData,
  getMultipleSensorsDailyData,
  getMultipleSensorsAggregatedData
};
