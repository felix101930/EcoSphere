// Hot Water Tab Component - Display hot water consumption data
import { Box, CircularProgress, Alert } from '@mui/material';
import OverallTrendChart from '../Electricity/OverallTrendChart';
import MetricsCards from '../Electricity/MetricsCards';
import { CHART_COLORS } from '../../lib/constants/water';

const HotWaterTab = ({ data, loading }) => {
    // Loading state
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    // No data state
    if (!data || !data.data || data.data.length === 0) {
        return (
            <Alert severity="info">
                No hot water data available for the selected date range. Please select a different range.
            </Alert>
        );
    }

    return (
        <Box>
            {/* Metrics Cards */}
            <MetricsCards metrics={data.metrics} unit="L/h" />

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
            <Alert severity="info" sx={{ mt: 2 }}>
                <strong>Data Source:</strong> {data.dataSource}<br />
                <strong>Aggregation:</strong> Hourly sum from 1-minute intervals<br />
                <strong>Date Range:</strong> {data.dateFrom} to {data.dateTo}<br />
                <strong>Data Points:</strong> {data.count}
            </Alert>
        </Box>
    );
};

export default HotWaterTab;
