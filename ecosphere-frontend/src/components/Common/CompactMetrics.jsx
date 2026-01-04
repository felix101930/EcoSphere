import { Box, Typography } from '@mui/material';

export default function CompactMetrics({ metrics, unit = '' }) {
    const formatValue = (value) => {
        if (value === null || value === undefined) return 'N/A';
        return typeof value === 'number' ? value.toFixed(2) : value;
    };

    return (
        <Box
            sx={{
                display: 'flex',
                gap: 3,
                mb: 2,
                flexWrap: 'wrap'
            }}
        >
            {metrics.map((metric, index) => (
                <Box key={index}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {metric.label}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {formatValue(metric.value)} {unit}
                    </Typography>
                </Box>
            ))}
        </Box>
    );
}
