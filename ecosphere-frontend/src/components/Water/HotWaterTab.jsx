// Hot Water Tab Component - Display hot water consumption data and forecast
import { useState } from 'react';
import { Box, Tabs, Tab, CircularProgress, Alert } from '@mui/material';
import OverallTrendChart from '../Electricity/OverallTrendChart';
import MetricsCards from '../Electricity/MetricsCards';
import DataSourceInfo from '../Electricity/DataSourceInfo';
import HotWaterForecastView from './HotWaterForecastView';
import { CHART_COLORS } from '../../lib/constants/water';

// Sub-tab types
const SUB_TABS = {
    OVERVIEW: 'overview',
    FORECAST: 'forecast'
};

const HotWaterTab = ({ data, loading, dateTo, dateFrom, forecast, forecastLoading, forecastError, onLoadForecast }) => {
    const [activeSubTab, setActiveSubTab] = useState(SUB_TABS.OVERVIEW);

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
                            {/* Metrics Cards */}
                            <MetricsCards metrics={data.metrics} unit="L/h" metricType="Hot Water" />

                            {/* Overall Trend Chart */}
                            <OverallTrendChart
                                data={data.data}
                                title="Hot Water Consumption Trend"
                                dataLabel="Consumption (L/h)"
                                color={CHART_COLORS.PRIMARY}
                                unit="L/h"
                                yAxisLabel="Consumption (L/h)"
                            />

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
