// Rainwater Tab Component - Display rainwater harvesting data
import { Box, CircularProgress, Alert } from '@mui/material';
import OverallTrendChart from '../Electricity/OverallTrendChart';
import MetricsCards from '../Electricity/MetricsCards';
import { CHART_COLORS } from '../../lib/constants/water';

const RainwaterTab = ({ data, loading }) => {
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
                No rainwater data available for the selected date range. Please select a different range.
            </Alert>
        );
    }

    return (
        <Box>
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
        </Box>
    );
};

export default RainwaterTab;
