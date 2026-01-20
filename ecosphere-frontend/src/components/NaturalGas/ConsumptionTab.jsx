// Natural Gas Consumption Tab - Display monthly usage data
import { Box, Alert } from '@mui/material';
import { Info } from '@mui/icons-material';
import { useMemo } from 'react';
import LoadingSpinner from '../Common/LoadingSpinner';
import MetricsCards from '../Electricity/MetricsCards';
import MonthlyUsageChart from './MonthlyUsageChart';
import DataSummary from './DataSummary';
import { DATA_CONFIG } from '../../lib/constants/naturalGas';

function ConsumptionTab({ data, isLoading, dateFrom, dateTo }) {
    // Calculate actual filtered count based on date range
    const actualCount = useMemo(() => {
        if (!data || !data.data || data.data.length === 0) {
            return 0;
        }

        // Get expected year range from dateFrom and dateTo
        const fromDate = new Date(dateFrom);
        const toDate = new Date(dateTo);
        const expectedFromYear = fromDate.getFullYear();
        const expectedToYear = toDate.getFullYear();

        // Filter data to match the expected year range
        const filteredData = data.data.filter(item => {
            const year = parseInt(item.month.split('-')[0]);
            return year >= expectedFromYear && year <= expectedToYear;
        });

        return filteredData.length;
    }, [data, dateFrom, dateTo]);
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
                dateFrom={dateFrom}
                dateTo={dateTo}
            />

            {/* Data Summary */}
            <DataSummary
                dataSource={data.dataSource}
                dateFrom={dateFrom}
                dateTo={dateTo}
                count={actualCount}
            />
        </Box>
    );
}

export default ConsumptionTab;
