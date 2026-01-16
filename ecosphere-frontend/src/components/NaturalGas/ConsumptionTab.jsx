// Natural Gas Consumption Tab - Display monthly usage data
import { Box, Alert } from '@mui/material';
import { Info } from '@mui/icons-material';
import LoadingSpinner from '../Common/LoadingSpinner';
import MetricsCards from '../Electricity/MetricsCards';
import MonthlyUsageChart from './MonthlyUsageChart';
import DataSummary from './DataSummary';
import { DATA_CONFIG } from '../../lib/constants/naturalGas';

function ConsumptionTab({ data, isLoading, dateFrom, dateTo }) {
    if (isLoading) {
        return <LoadingSpinner message="Loading natural gas data..." />;
    }

    if (!data || !data.data || data.data.length === 0) {
        return (
            <Alert
                severity="info"
                icon={<Info />}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    minHeight: '200px'
                }}
            >
                <Box>
                    No natural gas data available for the selected period
                </Box>
            </Alert>
        );
    }

    return (
        <Box>
            {/* Key Metrics - Reuse existing component */}
            <MetricsCards
                metrics={{
                    total: data.metrics.total,
                    average: data.metrics.average,
                    peak: data.metrics.peak,
                    min: data.metrics.min
                }}
                unit={DATA_CONFIG.UNIT}
                metricType="Monthly"
            />

            {/* Monthly Usage Chart */}
            <MonthlyUsageChart
                data={data.data}
                dataSource={data.dataSource}
                count={data.count}
            />

            {/* Data Summary */}
            <DataSummary
                dataSource={data.dataSource}
                dateFrom={dateFrom}
                dateTo={dateTo}
                count={data.count}
            />
        </Box>
    );
}

export default ConsumptionTab;
