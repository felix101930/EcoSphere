// Hot Water Tab Component - Display hot water consumption data and forecast
import { useState, useMemo } from 'react';
import { Box, Tabs, Tab, CircularProgress, Alert } from '@mui/material';
import OverallTrendChart from '../Electricity/OverallTrendChart';
import MetricsCards from '../Electricity/MetricsCards';
import FlowRateMetricsCards from './FlowRateMetricsCards';
import DataSourceInfo from '../Electricity/DataSourceInfo';
import HotWaterForecastView from './HotWaterForecastView';
import { CHART_COLORS } from '../../lib/constants/water';

// Sub-tab types
const SUB_TABS = {
    OVERVIEW: 'overview',
    FORECAST: 'forecast'
};

/**
 * Convert flow rate data to per-minute consumption
 * @param {Array} data - Array of {ts, value} where value is flow rate in L/h
 * @returns {Array} Array of {ts, value} where value is consumption in L/min
 */
const convertToPerMinuteConsumption = (data) => {
    if (!data || data.length === 0) return [];

    return data.map(point => ({
        ts: point.ts,
        value: point.value * (1 / 60) // Convert L/h to L/min
    }));
};

/**
 * Calculate metrics for per-minute consumption data
 * @param {Array} perMinuteData - Array of per-minute consumption
 * @returns {Object} Metrics object
 */
const calculatePerMinuteMetrics = (perMinuteData) => {
    if (!perMinuteData || perMinuteData.length === 0) {
        return { current: 0, average: 0, peak: 0, min: 0, total: 0 };
    }

    const values = perMinuteData.map(d => d.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const average = sum / values.length;
    const peak = Math.max(...values);
    const min = Math.min(...values);
    const current = values[values.length - 1];
    const total = sum;

    return {
        current: Math.round(current * 100) / 100,
        average: Math.round(average * 100) / 100,
        peak: Math.round(peak * 100) / 100,
        min: Math.round(min * 100) / 100,
        total: Math.round(total * 100) / 100
    };
};

const HotWaterTab = ({ data, loading, dateTo, dateFrom, forecast, forecastLoading, forecastError, onLoadForecast }) => {
    const [activeSubTab, setActiveSubTab] = useState(SUB_TABS.OVERVIEW);

    // Calculate per-minute consumption data
    const perMinuteConsumptionData = useMemo(() => {
        if (!data || !data.data || data.data.length === 0) return null;
        return convertToPerMinuteConsumption(data.data);
    }, [data]);

    // Calculate per-minute metrics
    const perMinuteMetrics = useMemo(() => {
        if (!perMinuteConsumptionData) return null;
        return calculatePerMinuteMetrics(perMinuteConsumptionData);
    }, [perMinuteConsumptionData]);

    // Handle sub-tab change
    const handleSubTabChange = (_event, newValue) => {
        setActiveSubTab(newValue);
    };

    return (
        <Box>
            {/* Sub-tabs - Hide in export */}
            <Box data-hide-in-export="true" sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={activeSubTab} onChange={handleSubTabChange}>
                    <Tab label="Overview" value={SUB_TABS.OVERVIEW} />
                    <Tab label="Forecast" value={SUB_TABS.FORECAST} />
                </Tabs>
            </Box>

            {/* Overview Sub-tab */}
            {activeSubTab === SUB_TABS.OVERVIEW && (
                <>
                    {/* Loading state */}
                    {loading && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                            <CircularProgress />
                        </Box>
                    )}

                    {/* No data state */}
                    {!loading && (!data || !data.data || data.data.length === 0) && (
                        <Alert severity="info">
                            No hot water data available for the selected date range. Please select a different range.
                        </Alert>
                    )}

                    {/* Data display */}
                    {!loading && data && data.data && data.data.length > 0 && (
                        <>
                            {/* Flow Rate Metrics Cards - No Total */}
                            <FlowRateMetricsCards
                                metrics={data.metrics}
                                unit="L/h"
                                metricType="Flow Rate"
                            />

                            {/* Flow Rate Trend Chart */}
                            <OverallTrendChart
                                data={data.data}
                                title="Hot Water Flow Rate Trend"
                                dataLabel="Flow Rate (L/h)"
                                color={CHART_COLORS.PRIMARY}
                                unit="L/h"
                                yAxisLabel="Flow Rate (L/h)"
                            />

                            {/* Per-Minute Consumption Chart */}
                            {perMinuteConsumptionData && perMinuteConsumptionData.length > 0 && (
                                <>
                                    <Box sx={{ mt: 4 }}>
                                        <MetricsCards
                                            metrics={perMinuteMetrics}
                                            unit="L"
                                            metricType="Consumption"
                                        />
                                    </Box>
                                    <OverallTrendChart
                                        data={perMinuteConsumptionData}
                                        title="Hot Water Consumption Trend (Per Minute)"
                                        dataLabel="Consumption (L/min)"
                                        color={CHART_COLORS.SECONDARY}
                                        unit="L"
                                        yAxisLabel="Consumption (L/min)"
                                    />
                                </>
                            )}

                            {/* Data Info */}
                            <DataSourceInfo
                                dataSource={data.dataSource}
                                count={data.count}
                                dateFrom={dateFrom}
                                dateTo={dateTo}
                            />
                        </>
                    )}
                </>
            )}

            {/* Forecast Sub-tab */}
            {activeSubTab === SUB_TABS.FORECAST && (
                <HotWaterForecastView
                    dateTo={dateTo}
                    loading={forecastLoading}
                    error={forecastError}
                    forecast={forecast}
                    onLoadForecast={onLoadForecast}
                />
            )}
        </Box>
    );
};

export default HotWaterTab;
