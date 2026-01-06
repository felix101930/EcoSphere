// Electricity Controller - Handle electricity data requests
const ElectricityService = require('../services/electricityService');
const { sendSuccess, sendError, sendDataWithMetadata } = require('../utils/responseHelper');
const { validateDateRange, validateDateAvailability } = require('../utils/validationHelper');
const { HTTP_STATUS, DATA_RANGES, DATA_SOURCES, ERROR_MESSAGES } = require('../utils/constants');

/**
 * Get available date range for electricity data
 */
const getAvailableDateRange = async (req, res) => {
  try {
    // Get date ranges for primary tables
    const consumptionRange = await ElectricityService.getAvailableDateRange('30000_TL341');
    const generationRange = await ElectricityService.getAvailableDateRange('30000_TL340');
    const netEnergyRange = await ElectricityService.getAvailableDateRange('30000_TL339');

    // Use custom response format to maintain backward compatibility
    res.json({
      success: true,
      dateRanges: {
        consumption: consumptionRange,
        generation: generationRange,
        netEnergy: netEnergyRange
      }
    });
  } catch (error) {
    console.error('Error in getAvailableDateRange:', error);
    sendError(res, HTTP_STATUS.SERVER_ERROR, 'Failed to fetch available date range');
  }
};

/**
 * Get consumption data (overall)
 */
const getConsumptionData = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.params;

    // Validate date range
    const validation = validateDateRange(dateFrom, dateTo);
    if (!validation.isValid) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, validation.error);
    }

    const data = await ElectricityService.getConsumptionData(dateFrom, dateTo);
    const metrics = ElectricityService.calculateMetrics(data);

    sendDataWithMetadata(res, {
      data,
      metadata: {
        dateFrom,
        dateTo,
        dataSource: DATA_SOURCES.CONSUMPTION,
        count: data.length,
        metrics
      }
    });
  } catch (error) {
    console.error('Error in getConsumptionData:', error);
    sendError(res, HTTP_STATUS.SERVER_ERROR, 'Failed to fetch consumption data');
  }
};

/**
 * Get generation data (overall)
 */
const getGenerationData = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.params;

    // Validate date range
    const validation = validateDateRange(dateFrom, dateTo);
    if (!validation.isValid) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, validation.error);
    }

    const data = await ElectricityService.getGenerationData(dateFrom, dateTo);
    const metrics = ElectricityService.calculateMetrics(data);

    sendDataWithMetadata(res, {
      data,
      metadata: {
        dateFrom,
        dateTo,
        dataSource: DATA_SOURCES.GENERATION,
        count: data.length,
        metrics
      }
    });
  } catch (error) {
    console.error('Error in getGenerationData:', error);
    sendError(res, HTTP_STATUS.SERVER_ERROR, 'Failed to fetch generation data');
  }
};

/**
 * Get net energy data (overall)
 */
const getNetEnergyData = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.params;

    // Validate date range
    const validation = validateDateRange(dateFrom, dateTo);
    if (!validation.isValid) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, validation.error);
    }

    const data = await ElectricityService.getNetEnergyData(dateFrom, dateTo);
    // Use special metrics calculation that preserves sign
    const metrics = ElectricityService.calculateNetEnergyMetrics(data);

    sendDataWithMetadata(res, {
      data,
      metadata: {
        dateFrom,
        dateTo,
        dataSource: DATA_SOURCES.NET_ENERGY,
        count: data.length,
        metrics
      }
    });
  } catch (error) {
    console.error('Error in getNetEnergyData:', error);
    sendError(res, HTTP_STATUS.SERVER_ERROR, 'Failed to fetch net energy data');
  }
};

/**
 * Get phase breakdown data
 */
const getPhaseBreakdownData = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.params;

    // Validate date range
    const validation = validateDateRange(dateFrom, dateTo);
    if (!validation.isValid) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, validation.error);
    }

    // Validate date availability
    const availabilityCheck = validateDateAvailability(
      dateFrom,
      dateTo,
      DATA_RANGES.PHASE_BREAKDOWN.FROM,
      DATA_RANGES.PHASE_BREAKDOWN.TO
    );
    if (!availabilityCheck.isValid) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        availabilityCheck.error,
        availabilityCheck.availableRange
      );
    }

    const data = await ElectricityService.getPhaseBreakdownData(dateFrom, dateTo);

    // Calculate metrics for each phase
    const metrics = {
      total: ElectricityService.calculateMetrics(data.total),
      phaseA: ElectricityService.calculateMetrics(data.phaseA),
      phaseB: ElectricityService.calculateMetrics(data.phaseB),
      phaseC: ElectricityService.calculateMetrics(data.phaseC)
    };

    sendDataWithMetadata(res, {
      data,
      metadata: {
        dateFrom,
        dateTo,
        dataSources: DATA_SOURCES.PHASE,
        metrics,
        warning: DATA_RANGES.PHASE_BREAKDOWN.DESCRIPTION
      }
    });
  } catch (error) {
    console.error('Error in getPhaseBreakdownData:', error);
    sendError(res, HTTP_STATUS.SERVER_ERROR, 'Failed to fetch phase breakdown data');
  }
};

/**
 * Get equipment breakdown data
 */
const getEquipmentBreakdownData = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.params;

    // Validate date range
    const validation = validateDateRange(dateFrom, dateTo);
    if (!validation.isValid) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, validation.error);
    }

    const data = await ElectricityService.getEquipmentBreakdownData(dateFrom, dateTo);

    // Calculate metrics for each equipment
    const metrics = {
      panel2A1: ElectricityService.calculateMetrics(data.panel2A1),
      ventilation: ElectricityService.calculateMetrics(data.ventilation),
      lighting: ElectricityService.calculateMetrics(data.lighting),
      equipment: ElectricityService.calculateMetrics(data.equipment),
      appliances: ElectricityService.calculateMetrics(data.appliances)
    };

    sendDataWithMetadata(res, {
      data,
      metadata: {
        dateFrom,
        dateTo,
        dataSources: DATA_SOURCES.EQUIPMENT,
        metrics,
        warning: DATA_RANGES.EQUIPMENT_BREAKDOWN.DESCRIPTION
      }
    });
  } catch (error) {
    console.error('Error in getEquipmentBreakdownData:', error);
    sendError(res, HTTP_STATUS.SERVER_ERROR, 'Failed to fetch equipment breakdown data');
  }
};

/**
 * Get solar source breakdown data
 */
const getSolarSourceBreakdownData = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.params;

    // Validate date range
    const validation = validateDateRange(dateFrom, dateTo);
    if (!validation.isValid) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, validation.error);
    }

    // Validate date availability
    const availabilityCheck = validateDateAvailability(
      dateFrom,
      dateTo,
      DATA_RANGES.SOLAR_BREAKDOWN.FROM,
      DATA_RANGES.SOLAR_BREAKDOWN.TO
    );
    if (!availabilityCheck.isValid) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        availabilityCheck.error,
        availabilityCheck.availableRange
      );
    }

    const data = await ElectricityService.getSolarSourceBreakdownData(dateFrom, dateTo);

    // Calculate metrics for each source
    const metrics = {
      carport: ElectricityService.calculateMetrics(data.carport),
      rooftop: ElectricityService.calculateMetrics(data.rooftop)
    };

    sendDataWithMetadata(res, {
      data,
      metadata: {
        dateFrom,
        dateTo,
        dataSources: DATA_SOURCES.SOLAR,
        metrics,
        warning: DATA_RANGES.SOLAR_BREAKDOWN.DESCRIPTION
      }
    });
  } catch (error) {
    console.error('Error in getSolarSourceBreakdownData:', error);
    sendError(res, HTTP_STATUS.SERVER_ERROR, 'Failed to fetch solar source breakdown data');
  }
};

/**
 * Get comprehensive electricity overview (consumption + generation + net energy)
 */
const getElectricityOverview = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.params;

    // Validate date range
    const validation = validateDateRange(dateFrom, dateTo);
    if (!validation.isValid) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, validation.error);
    }

    // Fetch all three datasets in parallel
    const [consumptionData, generationData, netEnergyData] = await Promise.all([
      ElectricityService.getConsumptionData(dateFrom, dateTo),
      ElectricityService.getGenerationData(dateFrom, dateTo),
      ElectricityService.getNetEnergyData(dateFrom, dateTo)
    ]);

    // Calculate metrics
    const consumptionMetrics = ElectricityService.calculateMetrics(consumptionData);
    const generationMetrics = ElectricityService.calculateMetrics(generationData);
    const netEnergyMetrics = ElectricityService.calculateMetrics(netEnergyData);

    // Calculate self-sufficiency
    const selfSufficiency = ElectricityService.calculateSelfSufficiency(generationData, consumptionData);

    sendDataWithMetadata(res, {
      data: {
        consumption: {
          data: consumptionData,
          metrics: consumptionMetrics,
          dataSource: DATA_SOURCES.CONSUMPTION
        },
        generation: {
          data: generationData,
          metrics: generationMetrics,
          dataSource: DATA_SOURCES.GENERATION
        },
        netEnergy: {
          data: netEnergyData,
          metrics: netEnergyMetrics,
          dataSource: DATA_SOURCES.NET_ENERGY
        },
        selfSufficiency: {
          percentage: selfSufficiency.toFixed(2),
          description: 'Percentage of consumption met by generation'
        }
      },
      metadata: {
        dateFrom,
        dateTo
      }
    });
  } catch (error) {
    console.error('Error in getElectricityOverview:', error);
    sendError(res, HTTP_STATUS.SERVER_ERROR, 'Failed to fetch electricity overview');
  }
};

module.exports = {
  getAvailableDateRange,
  getConsumptionData,
  getGenerationData,
  getNetEnergyData,
  getPhaseBreakdownData,
  getEquipmentBreakdownData,
  getSolarSourceBreakdownData,
  getElectricityOverview
};
