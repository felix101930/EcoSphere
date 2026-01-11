import { useState, useEffect, useCallback } from 'react';
import { TIME_PRESETS, DATA_RANGES, DEMO_DATE_RANGE } from '../constants/overview';
import ElectricityReportService from '../../services/ElectricityReportService';
import WaterReportService from '../../services/WaterReportService';
import ThermalService from '../../services/ThermalService';
import { aggregateToDaily, calculateDailyMetrics } from '../utils/dataAggregation';

export default function useOverviewData() {
    const [timePreset, setTimePreset] = useState(TIME_PRESETS.DEMO_DAY);
    const [dateRange, setDateRange] = useState({ from: null, to: null });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Data states
    const [electricityData, setElectricityData] = useState({
        consumption: null,
        generation: null,
        netEnergy: null
    });
    const [waterData, setWaterData] = useState({
        rainwater: null,
        hotWater: null
    });
    const [thermalData, setThermalData] = useState({
        basement: null,
        first: null,
        second: null
    });

    // Calculate date range based on preset
    const calculateDateRange = useCallback((preset) => {
        const today = new Date();
        today.setHours(12, 0, 0, 0); // Noon time for timezone safety

        let from, to;

        switch (preset) {
            case TIME_PRESETS.DEMO_DAY:
                // Use demo date range where all modules have data
                from = new Date(DEMO_DATE_RANGE.start + 'T12:00:00');
                to = new Date(DEMO_DATE_RANGE.end + 'T12:00:00');
                break;
            case TIME_PRESETS.TODAY:
                from = new Date(today);
                to = new Date(today);
                break;
            case TIME_PRESETS.YESTERDAY:
                from = new Date(today);
                from.setDate(from.getDate() - 1);
                to = new Date(from);
                break;
            case TIME_PRESETS.LAST_7_DAYS:
                to = new Date(today);
                from = new Date(today);
                from.setDate(from.getDate() - 7);
                break;
            default:
                from = new Date(today);
                to = new Date(today);
        }

        return { from, to };
    }, []);

    // Format date for API
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Check if date is within range
    const isDateInRange = useCallback((dateStr, moduleRange) => {
        return dateStr >= moduleRange.start && dateStr <= moduleRange.end;
    }, []);

    // Load electricity data
    const loadElectricityData = useCallback(async (fromStr, toStr) => {
        try {
            if (!isDateInRange(fromStr, DATA_RANGES.electricity) ||
                !isDateInRange(toStr, DATA_RANGES.electricity)) {
                return {
                    consumption: null,
                    generation: null,
                    netEnergy: null
                };
            }

            const [consumptionRaw, generationRaw] = await Promise.all([
                ElectricityReportService.getConsumptionData(fromStr, toStr),
                ElectricityReportService.getGenerationData(fromStr, toStr)
            ]);

            if (!consumptionRaw?.data || !generationRaw?.data) {
                return {
                    consumption: null,
                    generation: null,
                    netEnergy: null
                };
            }

            // Import calculation utilities
            const {
                calculateNetEnergyFromData,
                calculateNetEnergyMetrics,
                calculateSelfSufficiencyRate,
                calculateAverageSelfSufficiencyRate
            } = await import('../../utils/electricityCalculations');

            // Calculate net energy from consumption + generation (don't use database values)
            const netEnergyCalculated = calculateNetEnergyFromData(
                consumptionRaw.data,
                generationRaw.data
            );

            // Calculate self-sufficiency rate
            const selfSufficiencyRateData = calculateSelfSufficiencyRate(
                consumptionRaw.data,
                generationRaw.data
            );

            const avgSelfSufficiencyRate = calculateAverageSelfSufficiencyRate(selfSufficiencyRateData);

            // Calculate net energy metrics
            const netEnergyMetrics = calculateNetEnergyMetrics(netEnergyCalculated);
            netEnergyMetrics.avgSelfSufficiencyRate = avgSelfSufficiencyRate;

            // Aggregate to daily data
            const consumption = {
                data: aggregateToDaily(consumptionRaw.data),
                metrics: calculateDailyMetrics(aggregateToDaily(consumptionRaw.data))
            };

            const generation = {
                data: aggregateToDaily(generationRaw.data),
                metrics: calculateDailyMetrics(aggregateToDaily(generationRaw.data))
            };

            const netEnergy = {
                data: aggregateToDaily(netEnergyCalculated),
                metrics: {
                    ...calculateDailyMetrics(aggregateToDaily(netEnergyCalculated)),
                    avgSelfSufficiencyRate: avgSelfSufficiencyRate
                },
                selfSufficiencyRate: aggregateToDaily(selfSufficiencyRateData)
            };

            return { consumption, generation, netEnergy };
        } catch (err) {
            console.error('Error loading electricity data:', err);
            return { consumption: null, generation: null, netEnergy: null };
        }
    }, [isDateInRange]);

    // Load water data
    const loadWaterData = useCallback(async (fromStr, toStr) => {
        try {
            const rainwaterInRange = isDateInRange(fromStr, DATA_RANGES.rainwater) &&
                isDateInRange(toStr, DATA_RANGES.rainwater);
            const hotWaterInRange = isDateInRange(fromStr, DATA_RANGES.hotWater) &&
                isDateInRange(toStr, DATA_RANGES.hotWater);

            const [rainwaterRaw, hotWaterRaw] = await Promise.all([
                rainwaterInRange ? WaterReportService.getRainwaterLevelData(fromStr, toStr) : Promise.resolve(null),
                hotWaterInRange ? WaterReportService.getHotWaterConsumptionData(fromStr, toStr) : Promise.resolve(null)
            ]);

            // Aggregate to daily data
            const rainwater = rainwaterRaw?.data ? {
                data: aggregateToDaily(rainwaterRaw.data),
                metrics: calculateDailyMetrics(aggregateToDaily(rainwaterRaw.data))
            } : null;

            const hotWater = hotWaterRaw?.data ? {
                data: aggregateToDaily(hotWaterRaw.data),
                metrics: calculateDailyMetrics(aggregateToDaily(hotWaterRaw.data))
            } : null;

            return { rainwater, hotWater };
        } catch (err) {
            console.error('Error loading water data:', err);
            return { rainwater: null, hotWater: null };
        }
    }, [isDateInRange]);

    // Load thermal data
    const loadThermalData = useCallback(async (fromStr, toStr) => {
        try {
            if (!isDateInRange(fromStr, DATA_RANGES.thermal) ||
                !isDateInRange(toStr, DATA_RANGES.thermal)) {
                return { basement: null, first: null, second: null };
            }

            // Load aggregated data for all floors
            const basementSensors = ['20004_TL2', '20005_TL2', '20006_TL2'];
            const firstFloorSensors = ['20007_TL2', '20008_TL2', '20009_TL2', '20010_TL2', '20011_TL2'];
            const secondFloorSensors = ['20012_TL2', '20013_TL2', '20014_TL2', '20015_TL2', '20016_TL2'];

            const [basementData, firstData, secondData] = await Promise.all([
                ThermalService.getAggregatedData(fromStr, toStr, basementSensors),
                ThermalService.getAggregatedData(fromStr, toStr, firstFloorSensors),
                ThermalService.getAggregatedData(fromStr, toStr, secondFloorSensors)
            ]);

            // Transform data to match expected format
            const transformData = (sensorData) => {
                if (!sensorData || Object.keys(sensorData).length === 0) {
                    return null;
                }

                // sensorData structure: { "2020-11-01": { "20004_TL2": {...}, ... }, ... }
                // We need to convert it to array format with multi-sensor averaging
                const dates = Object.keys(sensorData).sort();

                if (dates.length === 0) {
                    return null;
                }

                // Build array of data points by averaging all sensors for each date
                const dataArray = dates.map(date => {
                    const sensorsForDate = sensorData[date];
                    const sensorIds = Object.keys(sensorsForDate);

                    if (sensorIds.length === 0) {
                        return { ts: date, value: 0 };
                    }

                    // Calculate average temperature across all sensors for this date
                    const sensorValues = sensorIds.map(sensorId => {
                        return sensorsForDate[sensorId]?.avg || 0;
                    });

                    const avgTemp = sensorValues.reduce((sum, val) => sum + val, 0) / sensorValues.length;

                    return {
                        ts: date,
                        value: avgTemp
                    };
                });

                // Calculate metrics
                const values = dataArray.map(item => item.value);
                const metrics = {
                    average: values.reduce((sum, val) => sum + val, 0) / values.length,
                    peak: Math.max(...values),
                    min: Math.min(...values)
                };

                return {
                    data: dataArray,
                    metrics: metrics
                };
            };

            return {
                basement: transformData(basementData),
                first: transformData(firstData),
                second: transformData(secondData)
            };
        } catch (err) {
            console.error('Error loading thermal data:', err);
            return { basement: null, first: null, second: null };
        }
    }, [isDateInRange]);

    // Load all data
    const loadAllData = useCallback(async () => {
        if (!dateRange.from || !dateRange.to) return;

        setLoading(true);
        setError(null);

        try {
            const fromStr = formatDate(dateRange.from);
            const toStr = formatDate(dateRange.to);

            const [electricity, water, thermal] = await Promise.all([
                loadElectricityData(fromStr, toStr),
                loadWaterData(fromStr, toStr),
                loadThermalData(fromStr, toStr)
            ]);

            setElectricityData(electricity);
            setWaterData(water);
            setThermalData(thermal);
        } catch (err) {
            console.error('Error loading overview data:', err);
            setError('Failed to load data. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [dateRange, loadElectricityData, loadWaterData, loadThermalData]);

    // Update date range when preset changes
    useEffect(() => {
        const range = calculateDateRange(timePreset);
        setDateRange(range);
    }, [timePreset, calculateDateRange]);

    // Load data when date range changes
    useEffect(() => {
        loadAllData();
    }, [loadAllData]);

    return {
        timePreset,
        setTimePreset,
        dateRange,
        loading,
        error,
        electricityData,
        waterData,
        thermalData,
        reload: loadAllData
    };
}
