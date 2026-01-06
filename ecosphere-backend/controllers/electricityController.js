// Electricity Controller - Handle electricity data requests
const ElectricityService = require('../services/electricityService');
const { sendError, sendDataWithMetadata } = require('../utils/responseHelper');
const { validateDateRange } = require('../utils/validationHelper');
const { HTTP_STATUS, DATA_RANGES, DATA_SOURCES } = require('../utils/constants');
const { asyncHandler, createDataFetcher, createBreakdownDataFetcher } = require('../utils/controllerHelper');

/**
 * Get available date range for electricity data
 */
const getAvailableDateRange = asyncHandler(async (req, res) => {
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
});

/**
 * Get consumption data (overall)
 */
const getConsumptionData = createDataFetcher({
  fetchDataFn: ElectricityService.getConsumptionData.bind(ElectricityService),
  calculateMetricsFn: ElectricityService.calculateMetrics.bind(ElectricityService),
  dataSource: DATA_SOURCES.CONSUMPTION
});

/**
 * Get generation data (overall)
 */
const getGenerationData = createDataFetcher({
  fetchDataFn: ElectricityService.getGenerationData.bind(ElectricityService),
  calculateMetricsFn: ElectricityService.calculateMetrics.bind(ElectricityService),
  dataSource: DATA_SOURCES.GENERATION
});

/**
 * Get net energy data (overall)
 * Note: Uses special metrics calculation that preserves sign
 */
const getNetEnergyData = createDataFetcher({
  fetchDataFn: ElectricityService.getNetEnergyData.bind(ElectricityService),
  calculateMetricsFn: ElectricityService.calculateNetEnergyMetrics.bind(ElectricityService),
  dataSource: DATA_SOURCES.NET_ENERGY
});

/**
 * Get phase breakdown data
 */
const getPhaseBreakdownData = createBreakdownDataFetcher({
  fetchDataFn: ElectricityService.getPhaseBreakdownData.bind(ElectricityService),
  calculateMetricsFn: ElectricityService.calculateMetrics.bind(ElectricityService),
  dataSources: DATA_SOURCES.PHASE,
  dataKeys: ['total', 'phaseA', 'phaseB', 'phaseC'],
  warning: DATA_RANGES.PHASE_BREAKDOWN.DESCRIPTION,
  dateAvailability: {
    from: DATA_RANGES.PHASE_BREAKDOWN.FROM,
    to: DATA_RANGES.PHASE_BREAKDOWN.TO
  }
});

/**
 * Get equipment breakdown data
 */
const getEquipmentBreakdownData = createBreakdownDataFetcher({
  fetchDataFn: ElectricityService.getEquipmentBreakdownData.bind(ElectricityService),
  calculateMetricsFn: ElectricityService.calculateMetrics.bind(ElectricityService),
  dataSources: DATA_SOURCES.EQUIPMENT,
  dataKeys: ['panel2A1', 'ventilation', 'lighting', 'equipment', 'appliances'],
  warning: DATA_RANGES.EQUIPMENT_BREAKDOWN.DESCRIPTION
});

/**
 * Get solar source breakdown data
 */
const getSolarSourceBreakdownData = createBreakdownDataFetcher({
  fetchDataFn: ElectricityService.getSolarSourceBreakdownData.bind(ElectricityService),
  calculateMetricsFn: ElectricityService.calculateMetrics.bind(ElectricityService),
  dataSources: DATA_SOURCES.SOLAR,
  dataKeys: ['carport', 'rooftop'],
  warning: DATA_RANGES.SOLAR_BREAKDOWN.DESCRIPTION,
  dateAvailability: {
    from: DATA_RANGES.SOLAR_BREAKDOWN.FROM,
    to: DATA_RANGES.SOLAR_BREAKDOWN.TO
  }
});

/**
 * Get comprehensive electricity overview (consumption + generation + net energy)
 */
const getElectricityOverview = asyncHandler(async (req, res) => {
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
});

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
