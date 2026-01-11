// Rainwater Tab Component - Display rainwater harvesting data and forecast
import { useState } from 'react';
import { Box, Tabs, Tab, CircularProgress, Alert } from '@mui/material';
import OverallTrendChart from '../Electricity/OverallTrendChart';
import MetricsCards from '../Electricity/MetricsCards';
import RainwaterForecastView from './RainwaterForecastView';
import { CHART_COLORS } from '../../lib/constants/water';

// Sub-tab types
const SUB_TABS = {
    OVERVIEW: 'overview',
    FORECAST: 'forecast'
};

const RainwaterTab = ({ data, loading, dateTo, forecast, forecastLoading, forecastError, onLoadForecast }) => {
    const [activeSubTab, setActiveSubTab] = useState(SUB_TABS.OVERVIEW);

    // Handle sub-tab change
    const handleSubTabChange = (_event, newValue) => {
        setActiveSubTab(newValue);
    };

    return (
        <Box>
            {/* Sub-tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
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
                            No rainwater data available for the selected date range. Please select a different range.
                        </Alert>
                    )}

                    {/* Data display */}
                    {!loading && data && data.data && data.data.length > 0 && (
                        <>
                            {/* Metrics Cards */}
                            <MetricsCards metrics={data.metrics} unit="%" />

                            {/* Overall Trend Chart */}
                            <OverallTrendChart
                                data={data.data}
                                title="Rainwater Level Trend"
                                dataLabel="Water Level (%)"
                                color={CHART_COLORS.SECONDARY}
                                unit="%"
                                yAxisLabel="Water Level (%)"
                            />

                            {/* Data Info */}
                            <Alert severity="info" sx={{ mt: 2 }}>
                                <strong>Data Source:</strong> {data.dataSource}<br />
                                <strong>Aggregation:</strong> Hourly average from 10-minute intervals<br />
                                <strong>Date Range:</strong> {data.dateFrom} to {data.dateTo}<br />
                                <strong>Data Points:</strong> {data.count}
                            </Alert>
                        </>
                    )}
                </>
            )}

            {/* Forecast Sub-tab */}
            {activeSubTab === SUB_TABS.FORECAST && (
                <RainwaterForecastView
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

export default RainwaterTab;
