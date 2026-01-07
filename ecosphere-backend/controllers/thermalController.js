// Thermal Controller - Handle thermal data requests
const ThermalService = require('../services/thermalService');
const ForecastService = require('../services/forecastService');
const WeatherService = require('../services/weatherService');
const { sendError } = require('../utils/responseHelper');
const { HTTP_STATUS } = require('../utils/constants');
const { asyncHandler } = require('../utils/controllerHelper');
const { TRAINING_PERIOD } = require('../utils/weatherConstants');
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

/**
 * Generate thermal forecast for a floor
 * Uses hybrid model: historical baseline + weather adjustment
 */
const getThermalForecast = asyncHandler(async (req, res) => {
  const { targetDate, forecastDays, floor } = req.params;

  // Validate inputs
  if (!targetDate || !forecastDays || !floor) {
    return sendError(
      res,
      HTTP_STATUS.BAD_REQUEST,
      'Missing required parameters: targetDate, forecastDays, floor'
    );
  }

  const days = parseInt(forecastDays);
  if (isNaN(days) || days < 1 || days > 30) {
    return sendError(
      res,
      HTTP_STATUS.BAD_REQUEST,
      'forecastDays must be between 1 and 30'
    );
  }

  // Get sensor IDs for the floor
  const floorSensorMap = {
    basement: ['20004_TL2', '20005_TL2', '20006_TL2'],
    level1: ['20007_TL2', '20008_TL2', '20009_TL2', '20010_TL2', '20011_TL2'],
    level2: ['20012_TL2', '20013_TL2', '20014_TL2', '20015_TL2', '20016_TL2']
  };

  const sensorIds = floorSensorMap[floor.toLowerCase()];
  if (!sensorIds) {
    return sendError(
      res,
      HTTP_STATUS.BAD_REQUEST,
      'Invalid floor. Must be: basement, level1, or level2'
    );
  }

  // Training period: last 60 days before target date
  const target = new Date(targetDate + 'T12:00:00');
  const trainingEndDate = new Date(target);
  trainingEndDate.setDate(trainingEndDate.getDate() - 1); // Day before target
  const trainingStartDate = new Date(trainingEndDate);
  trainingStartDate.setDate(trainingStartDate.getDate() - TRAINING_PERIOD.THERMAL_DAYS);

  const trainingStartStr = formatDate(trainingStartDate);
  const trainingEndStr = formatDate(trainingEndDate);

  // Fetch historical thermal data for all sensors in the floor (aggregated data)
  const aggregatedDataBySensor = await Promise.all(
    sensorIds.map(sensorId =>
      ThermalService.getAggregatedData(sensorId, trainingStartStr, trainingEndStr).catch(() => [])
    )
  );

  // Convert aggregated data to hourly format for forecast service
  const historicalThermal = convertAggregatedToHourly(aggregatedDataBySensor, sensorIds);

  if (!historicalThermal || historicalThermal.length === 0) {
    return sendError(
      res,
      HTTP_STATUS.NOT_FOUND,
      'No historical thermal data available for the specified period'
    );
  }

  // Fetch historical weather data
  const historicalWeatherData = await WeatherService.getWeatherData(
    trainingStartStr,
    trainingEndStr,
    'thermal'
  );
  const historicalWeather = WeatherService.aggregateToDaily(historicalWeatherData, 'thermal');

  // Fetch forecast weather data
  const forecastStartDate = new Date(target);
  forecastStartDate.setDate(forecastStartDate.getDate() + 1);
  const forecastEndDate = new Date(forecastStartDate);
  forecastEndDate.setDate(forecastEndDate.getDate() + days - 1);

  const forecastStartStr = formatDate(forecastStartDate);
  const forecastEndStr = formatDate(forecastEndDate);

  const forecastWeatherData = await WeatherService.getWeatherData(
    forecastStartStr,
    forecastEndStr,
    'thermal'
  );
  const forecastWeather = WeatherService.aggregateToDaily(forecastWeatherData, 'thermal');

  // Generate forecast
  const forecastResult = await ForecastService.generateThermalForecast(
    targetDate,
    days,
    historicalThermal,
    historicalWeather,
    forecastWeather
  );

  // Return response
  res.json({
    success: true,
    targetDate: targetDate,
    forecastDays: days,
    floor: floor,
    sensorCount: sensorIds.length,
    predictions: forecastResult.predictions,
    outdoorTemperature: forecastResult.outdoorTemperature,
    metadata: forecastResult.metadata
  });
});

/**
 * Helper: Format date to YYYY-MM-DD
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Helper: Convert aggregated data to hourly format for forecast service
 * Aggregated data has daily averages, we need to create hourly-like data points
 */
function convertAggregatedToHourly(aggregatedDataBySensor, sensorIds) {
  // Create a map of date -> average values from all sensors
  const dateMap = {};

  aggregatedDataBySensor.forEach((sensorData, index) => {
    sensorData.forEach(dayData => {
      if (!dateMap[dayData.date]) {
        dateMap[dayData.date] = [];
      }
      // Use average temperature for the day
      dateMap[dayData.date].push(dayData.avg);
    });
  });

  // Calculate average across sensors for each date and create hourly-like format
  const hourlyData = [];
  Object.keys(dateMap).sort().forEach(date => {
    const values = dateMap[date];
    const avgValue = values.reduce((sum, v) => sum + v, 0) / values.length;

    // Create a single data point per day (using noon time)
    hourlyData.push({
      ts: `${date} 12:00:00`,
      value: avgValue
    });
  });

  return hourlyData;
}

/**
 * Helper: Aggregate multi-sensor data (average across sensors)
 * This is for detailed hourly data (not used in forecast, kept for reference)
 */
function aggregateMultiSensorData(sensorDataArrays, sensorIds) {
  // Create a map of timestamp -> values from all sensors
  const timestampMap = {};

  sensorDataArrays.forEach((sensorData, index) => {
    sensorData.forEach(item => {
      if (!timestampMap[item.ts]) {
        timestampMap[item.ts] = [];
      }
      timestampMap[item.ts].push(item.value);
    });
  });

  // Calculate average for each timestamp
  const aggregatedData = Object.keys(timestampMap)
    .sort()
    .map(ts => {
      const values = timestampMap[ts];
      const avgValue = values.reduce((sum, v) => sum + v, 0) / values.length;
      return {
        ts: ts,
        value: avgValue
      };
    });

  return aggregatedData;
}

module.exports = {
  getAvailableDates,
  getLastCompleteDate,
  getDailyData,
  getMultipleSensorsDailyData,
  getMultipleSensorsAggregatedData,
  getThermalForecast
};
