// Electricity Controller - Handle electricity data requests
const ElectricityService = require('../services/electricityService');

/**
 * Get available date range for electricity data
 */
const getAvailableDateRange = async (req, res) => {
  try {
    // Get date ranges for primary tables
    const consumptionRange = await ElectricityService.getAvailableDateRange('30000_TL341');
    const generationRange = await ElectricityService.getAvailableDateRange('30000_TL340');
    const netEnergyRange = await ElectricityService.getAvailableDateRange('30000_TL339');

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
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available date range'
    });
  }
};

/**
 * Get consumption data (overall)
 */
const getConsumptionData = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.params;

    if (!dateFrom || !dateTo) {
      return res.status(400).json({
        success: false,
        error: 'Missing dateFrom or dateTo parameter'
      });
    }

    const data = await ElectricityService.getConsumptionData(dateFrom, dateTo);
    const metrics = ElectricityService.calculateMetrics(data);

    res.json({
      success: true,
      dateFrom,
      dateTo,
      dataSource: 'TL341',
      count: data.length,
      data,
      metrics
    });
  } catch (error) {
    console.error('Error in getConsumptionData:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch consumption data'
    });
  }
};

/**
 * Get generation data (overall)
 */
const getGenerationData = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.params;

    if (!dateFrom || !dateTo) {
      return res.status(400).json({
        success: false,
        error: 'Missing dateFrom or dateTo parameter'
      });
    }

    const data = await ElectricityService.getGenerationData(dateFrom, dateTo);
    const metrics = ElectricityService.calculateMetrics(data);

    res.json({
      success: true,
      dateFrom,
      dateTo,
      dataSource: 'TL340',
      count: data.length,
      data,
      metrics
    });
  } catch (error) {
    console.error('Error in getGenerationData:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch generation data'
    });
  }
};

/**
 * Get net energy data (overall)
 */
const getNetEnergyData = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.params;

    if (!dateFrom || !dateTo) {
      return res.status(400).json({
        success: false,
        error: 'Missing dateFrom or dateTo parameter'
      });
    }

    const data = await ElectricityService.getNetEnergyData(dateFrom, dateTo);
    // Use special metrics calculation that preserves sign
    const metrics = ElectricityService.calculateNetEnergyMetrics(data);

    res.json({
      success: true,
      dateFrom,
      dateTo,
      dataSource: 'TL339',
      count: data.length,
      data,
      metrics
    });
  } catch (error) {
    console.error('Error in getNetEnergyData:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch net energy data'
    });
  }
};

/**
 * Get phase breakdown data
 */
const getPhaseBreakdownData = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.params;

    if (!dateFrom || !dateTo) {
      return res.status(400).json({
        success: false,
        error: 'Missing dateFrom or dateTo parameter'
      });
    }

    // Validate date range (only 2020-11-01 to 2020-11-08 available)
    // Use string comparison to avoid timezone issues
    const availableFrom = '2020-11-01';
    const availableTo = '2020-11-08';

    if (dateFrom < availableFrom || dateTo > availableTo) {
      return res.status(400).json({
        success: false,
        error: 'Phase breakdown data only available from 2020-11-01 to 2020-11-08',
        availableRange: {
          from: availableFrom,
          to: availableTo
        }
      });
    }

    const data = await ElectricityService.getPhaseBreakdownData(dateFrom, dateTo);

    // Calculate metrics for each phase
    const metrics = {
      total: ElectricityService.calculateMetrics(data.total),
      phaseA: ElectricityService.calculateMetrics(data.phaseA),
      phaseB: ElectricityService.calculateMetrics(data.phaseB),
      phaseC: ElectricityService.calculateMetrics(data.phaseC)
    };

    res.json({
      success: true,
      dateFrom,
      dateTo,
      dataSources: {
        total: 'TL342',
        phaseA: 'TL343',
        phaseB: 'TL344',
        phaseC: 'TL345'
      },
      data,
      metrics,
      warning: 'Phase data only available for 7 days (2020-11-01 to 2020-11-08)'
    });
  } catch (error) {
    console.error('Error in getPhaseBreakdownData:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch phase breakdown data'
    });
  }
};

/**
 * Get equipment breakdown data
 */
const getEquipmentBreakdownData = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.params;

    if (!dateFrom || !dateTo) {
      return res.status(400).json({
        success: false,
        error: 'Missing dateFrom or dateTo parameter'
      });
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

    res.json({
      success: true,
      dateFrom,
      dateTo,
      dataSources: {
        panel2A1: 'TL213 (2020-02-15 to 2020-11-08)',
        ventilation: 'TL4 (2020-11-01 to 2020-11-08)',
        lighting: 'TL209 (2019-11-07 to 2019-11-14)',
        equipment: 'TL211 (2019-11-07 to 2019-11-14)',
        appliances: 'TL212 (2019-11-07 to 2019-11-14)'
      },
      data,
      metrics,
      warning: 'Equipment data has different time ranges for different categories'
    });
  } catch (error) {
    console.error('Error in getEquipmentBreakdownData:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch equipment breakdown data'
    });
  }
};

/**
 * Get solar source breakdown data
 */
const getSolarSourceBreakdownData = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.params;

    if (!dateFrom || !dateTo) {
      return res.status(400).json({
        success: false,
        error: 'Missing dateFrom or dateTo parameter'
      });
    }

    // Validate date range (only 2020-11-01 to 2020-11-08 available)
    // Use string comparison to avoid timezone issues
    const availableFrom = '2020-11-01';
    const availableTo = '2020-11-08';

    if (dateFrom < availableFrom || dateTo > availableTo) {
      return res.status(400).json({
        success: false,
        error: 'Solar source data only available from 2020-11-01 to 2020-11-08',
        availableRange: {
          from: '2020-11-01',
          to: '2020-11-08'
        }
      });
    }

    const data = await ElectricityService.getSolarSourceBreakdownData(dateFrom, dateTo);

    // Calculate metrics for each source
    const metrics = {
      carport: ElectricityService.calculateMetrics(data.carport),
      rooftop: ElectricityService.calculateMetrics(data.rooftop)
    };

    res.json({
      success: true,
      dateFrom,
      dateTo,
      dataSources: {
        carport: 'TL252',
        rooftop: 'TL253'
      },
      data,
      metrics,
      warning: 'Solar source data only available for 7 days (2020-11-01 to 2020-11-08). Unit is W (power), not Wh (energy). Only covers ~27% of total generation.'
    });
  } catch (error) {
    console.error('Error in getSolarSourceBreakdownData:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch solar source breakdown data'
    });
  }
};

/**
 * Get comprehensive electricity overview (consumption + generation + net energy)
 */
const getElectricityOverview = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.params;

    if (!dateFrom || !dateTo) {
      return res.status(400).json({
        success: false,
        error: 'Missing dateFrom or dateTo parameter'
      });
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

    res.json({
      success: true,
      dateFrom,
      dateTo,
      consumption: {
        data: consumptionData,
        metrics: consumptionMetrics,
        dataSource: 'TL341'
      },
      generation: {
        data: generationData,
        metrics: generationMetrics,
        dataSource: 'TL340'
      },
      netEnergy: {
        data: netEnergyData,
        metrics: netEnergyMetrics,
        dataSource: 'TL339'
      },
      selfSufficiency: {
        percentage: selfSufficiency.toFixed(2),
        description: 'Percentage of consumption met by generation'
      }
    });
  } catch (error) {
    console.error('Error in getElectricityOverview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch electricity overview'
    });
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
