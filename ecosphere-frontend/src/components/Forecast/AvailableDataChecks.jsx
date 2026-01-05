// Available Data Checks - Shows which data requirements are met
import { Box, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';

const AvailableDataChecks = ({ dataAvailability }) => {
    const checks = [
        {
            key: 'hasRecent7Days',
            label: 'Recent 7 days data',
            useWarning: false
        },
        {
            key: 'hasRecent30Days',
            label: 'Recent 30 days data',
            useWarning: false
        },
        {
            key: 'hasLastYearData',
            label: 'Last year same period data',
            useWarning: true
        },
        {
            key: 'hasOneYearCycle',
            label: 'Complete 1-year cycle data',
            useWarning: true
        }
    ];

    return (
        <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
                Available Data:
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: 2 }}>
                {checks.map(({ key, label, useWarning }) => (
                    <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {dataAvailability[key] ? (
                            <CheckCircleIcon fontSize="small" color="success" />
                        ) : useWarning ? (
                            <WarningIcon fontSize="small" color="warning" />
                        ) : (
                            <ErrorIcon fontSize="small" color="error" />
                        )}
                        <Typography variant="body2">
                            {label}
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

export default AvailableDataChecks;
