// Natural Gas Consumption Tab - Display monthly usage data
import { Box } from '@mui/material';
import LoadingSpinner from '../Common/LoadingSpinner';
import NoDataMessage from '../Common/NoDataMessage';
import MetricsCards from '../Electricity/MetricsCards';
import MonthlyUsageChart from './MonthlyUsageChart';
import DataSummary from './DataSummary';
import { DATA_CONFIG } from '../../lib/constants/naturalGas';

function ConsumptionTab({ data, isLoading, dateFrom, dateTo }) {
    if (isLoading) {
        return <LoadingSpinner message="Loading natural gas data..." />;
    }

    if (!data || !data.data || data.data.length === 0) {
        return <NoDataMessage message="No natural gas data available for the selected period" />;
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
