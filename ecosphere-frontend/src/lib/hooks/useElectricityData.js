// Custom Hook for Electricity Data Management
import { useState, useEffect, useCallback } from 'react';
import ElectricityReportService from '../../services/ElectricityReportService';
import {
  calculateNetEnergyFromData,
  calculateNetEnergyMetrics,
  calculateSelfSufficiencyRate,
  calculateAverageSelfSufficiencyRate
} from '../../utils/electricityCalculations';

export const useElectricityData = () => {
  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState(null);

  // Data states
  const [overviewData, setOverviewData] = useState(null);
  const [consumptionData, setConsumptionData] = useState(null);
  const [generationData, setGenerationData] = useState(null);
  const [netEnergyData, setNetEnergyData] = useState(null);
  const [phaseBreakdownData, setPhaseBreakdownData] = useState(null);
  const [equipmentBreakdownData, setEquipmentBreakdownData] = useState(null);
  const [solarBreakdownData, setSolarBreakdownData] = useState(null);

  /**
   * Load available date range on mount
   */
  useEffect(() => {
    const loadDateRange = async () => {
      try {
        setLoading(true);
        const response = await ElectricityReportService.getAvailableDateRange();
        if (response.success) {
          setDateRange(response.dateRanges);
        }
      } catch (err) {
        console.error('Error loading date range:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadDateRange();
  }, []);

  /**
   * Load electricity overview (consumption + generation + net energy)
   */
  const loadOverview = useCallback(async (dateFrom, dateTo) => {
    try {
      setLoading(true);
      setError(null);

      const formattedFrom = ElectricityReportService.formatDate(dateFrom);
      const formattedTo = ElectricityReportService.formatDate(dateTo);

      const response = await ElectricityReportService.getElectricityOverview(
        formattedFrom,
        formattedTo
      );

      if (response.success) {
        setOverviewData(response);
      } else {
        throw new Error(response.error || 'Failed to load overview');
      }
    } catch (err) {
      console.error('Error loading overview:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load consumption data
   */
  const loadConsumptionData = useCallback(async (dateFrom, dateTo) => {
    try {
      setLoading(true);
      setError(null);

      const formattedFrom = ElectricityReportService.formatDate(dateFrom);
      const formattedTo = ElectricityReportService.formatDate(dateTo);

      const response = await ElectricityReportService.getConsumptionData(
        formattedFrom,
        formattedTo
      );

      if (response.success) {
        setConsumptionData(response);
      } else {
        throw new Error(response.error || 'Failed to load consumption data');
      }
    } catch (err) {
      console.error('Error loading consumption data:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load generation data
   */
  const loadGenerationData = useCallback(async (dateFrom, dateTo) => {
    try {
      setLoading(true);
      setError(null);

      const formattedFrom = ElectricityReportService.formatDate(dateFrom);
      const formattedTo = ElectricityReportService.formatDate(dateTo);

      const response = await ElectricityReportService.getGenerationData(
        formattedFrom,
        formattedTo
      );

      if (response.success) {
        setGenerationData(response);
      } else {
        throw new Error(response.error || 'Failed to load generation data');
      }
    } catch (err) {
      console.error('Error loading generation data:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load net energy data
   * Note: Database net energy values are incorrect, so we calculate from consumption + generation
   */
  const loadNetEnergyData = useCallback(async (dateFrom, dateTo) => {
    try {
      setLoading(true);
      setError(null);

      const formattedFrom = ElectricityReportService.formatDate(dateFrom);
      const formattedTo = ElectricityReportService.formatDate(dateTo);

      // Fetch consumption and generation data
      const [consumptionResponse, generationResponse] = await Promise.all([
        ElectricityReportService.getConsumptionData(formattedFrom, formattedTo),
        ElectricityReportService.getGenerationData(formattedFrom, formattedTo)
      ]);

      if (consumptionResponse.success && generationResponse.success) {
        // Extract data arrays from responses
        const consumptionData = consumptionResponse.data;
        const generationData = generationResponse.data;

        // Calculate net energy from consumption and generation (ignore database values)
        const netEnergyData = calculateNetEnergyFromData(consumptionData, generationData);

        // Calculate self-sufficiency rate for each time point
        const selfSufficiencyRateData = calculateSelfSufficiencyRate(consumptionData, generationData);

        // Calculate average self-sufficiency rate
        const avgSelfSufficiencyRate = calculateAverageSelfSufficiencyRate(selfSufficiencyRateData);

        // Calculate net energy metrics (preserve sign)
        const calculatedMetrics = calculateNetEnergyMetrics(netEnergyData);
        calculatedMetrics.avgSelfSufficiencyRate = avgSelfSufficiencyRate;

        // Build response
        const enhancedResponse = {
          success: true,
          data: netEnergyData,
          selfSufficiencyRate: selfSufficiencyRateData,
          metrics: calculatedMetrics,
          count: netEnergyData.length,
          dateFrom: formattedFrom,
          dateTo: formattedTo,
          dataSource: 'Calculated from Consumption + Generation'
        };

        setNetEnergyData(enhancedResponse);
      } else {
        throw new Error('Failed to load consumption or generation data');
      }
    } catch (err) {
      console.error('Error loading net energy data:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load phase breakdown data
   */
  const loadPhaseBreakdown = useCallback(async (dateFrom, dateTo) => {
    try {
      setLoading(true);
      setError(null);

      const formattedFrom = ElectricityReportService.formatDate(dateFrom);
      const formattedTo = ElectricityReportService.formatDate(dateTo);

      const response = await ElectricityReportService.getPhaseBreakdownData(
        formattedFrom,
        formattedTo
      );

      if (response.success) {
        // Store the full response (includes data, metrics, warning)
        setPhaseBreakdownData(response);
      } else {
        throw new Error(response.error || 'Failed to load phase breakdown data');
      }
    } catch (err) {
      console.error('Error loading phase breakdown:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load equipment breakdown data
   */
  const loadEquipmentBreakdown = useCallback(async (dateFrom, dateTo) => {
    try {
      setLoading(true);
      setError(null);

      const formattedFrom = ElectricityReportService.formatDate(dateFrom);
      const formattedTo = ElectricityReportService.formatDate(dateTo);

      const response = await ElectricityReportService.getEquipmentBreakdownData(
        formattedFrom,
        formattedTo
      );

      if (response.success) {
        // Store the full response (includes data, metrics, warning)
        setEquipmentBreakdownData(response);
      } else {
        throw new Error(response.error || 'Failed to load equipment breakdown data');
      }
    } catch (err) {
      console.error('Error loading equipment breakdown:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load solar source breakdown data
   */
  const loadSolarBreakdown = useCallback(async (dateFrom, dateTo) => {
    try {
      setLoading(true);
      setError(null);

      const formattedFrom = ElectricityReportService.formatDate(dateFrom);
      const formattedTo = ElectricityReportService.formatDate(dateTo);

      const response = await ElectricityReportService.getSolarSourceBreakdownData(
        formattedFrom,
        formattedTo
      );

      if (response.success) {
        // Store the full response (includes data, metrics, warning)
        setSolarBreakdownData(response);
      } else {
        throw new Error(response.error || 'Failed to load solar breakdown data');
      }
    } catch (err) {
      console.error('Error loading solar breakdown:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Clear all data
   */
  const clearData = useCallback(() => {
    setOverviewData(null);
    setConsumptionData(null);
    setGenerationData(null);
    setNetEnergyData(null);
    setPhaseBreakdownData(null);
    setEquipmentBreakdownData(null);
    setSolarBreakdownData(null);
    setError(null);
  }, []);

  return {
    // State
    loading,
    error,
    dateRange,

    // Data
    overviewData,
    consumptionData,
    generationData,
    netEnergyData,
    phaseBreakdownData,
    equipmentBreakdownData,
    solarBreakdownData,

    // Actions
    loadOverview,
    loadConsumptionData,
    loadGenerationData,
    loadNetEnergyData,
    loadPhaseBreakdown,
    loadEquipmentBreakdown,
    loadSolarBreakdown,
    clearData
  };
};
