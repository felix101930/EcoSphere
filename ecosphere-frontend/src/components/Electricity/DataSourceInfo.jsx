// Data Source Info Component - Reusable component for displaying data source information
import { Alert, Box } from '@mui/material';

const DataSourceInfo = ({
    dataSource,
    count,
    dateFrom,
    dateTo,
    note,
    additionalInfo
}) => {
    // Format date to string if it's a Date object
    const formatDate = (date) => {
        if (!date) return '';
        if (typeof date === 'string') return date;
        return date.toISOString?.()?.split('T')[0] || date;
    };

    return (
        <Alert severity="info" sx={{ mt: 2 }}>
            Data Source: {dataSource}
            {count !== undefined && ` | Records: ${count}`}
            {dateFrom && dateTo && ` | Date Range: ${formatDate(dateFrom)} to ${formatDate(dateTo)}`}
            {note && (
                <>
                    <br />
                    Note: {note}
                </>
            )}
            {additionalInfo && (
                <Box sx={{ mt: 1, fontSize: '0.875rem' }}>
                    {additionalInfo}
                </Box>
            )}
        </Alert>
    );
};

export default DataSourceInfo;
